import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeIn } from '../../../components/leveling-test/FadeIn';
import { MathText } from '../../../components/MathText';
import { Text } from '../../../components/Text';
import { AnswerFeedback } from '../../../components/student/AnswerFeedback';
import { ErrorState } from '../../../components/student/ErrorState';
import { MemoryBoard } from '../../../components/student/MemoryBoard';
import { TaskCta } from '../../../components/student/TaskCta';
import { TaskHeader } from '../../../components/student/TaskHeader';
import { Task, TaskAnswerInput, TaskAnswerResult, getTask, submitTaskAnswer } from '../../../lib/tasks';
import { isLightHex, topicColor, useTheme, withAlpha } from '../../../lib/theme';

const CORAL = '#ff5f55';
const GREEN = '#1f9d63';
const NEUTRAL_ACCENT_INDEX = 3;
const LETTERS = ['A', 'B', 'C'];
const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = { 1: 'Łatwe', 2: 'Średnie', 3: 'Trudne' };

type Phase = 'answering' | 'correct' | 'retry' | 'revealed' | 'unlocked';

function AttemptDots({
  used,
  max,
  phase,
  accentColor,
  neutralColor,
}: {
  used: number;
  max: number;
  phase: Phase;
  accentColor: string;
  neutralColor: string;
}) {
  return (
    <View className="flex-row" style={{ gap: 6 }}>
      {Array.from({ length: max }).map((_, i) => {
        let color = neutralColor;
        if (phase === 'answering') {
          if (i < used) color = CORAL;
          else if (i === used) color = accentColor;
        } else if (i < used) {
          color = i === used - 1 && phase === 'correct' ? GREEN : CORAL;
        }
        return <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
      })}
    </View>
  );
}

export default function TaskScreen() {
  const theme = useTheme();
  const textClass = theme.isDark ? 'text-infiro-white' : 'text-infiro-navy';
  const params = useLocalSearchParams<{
    id: string;
    position?: string;
    total?: string;
    sectionTitle?: string;
    sectionIndex?: string;
  }>();
  const { id } = params;

  const position = Number(params.position) || 0;
  const total = Number(params.total) || 0;
  const accentIndex = params.sectionIndex != null ? Number(params.sectionIndex) || 0 : NEUTRAL_ACCENT_INDEX;
  const color = topicColor(theme, accentIndex);
  const sectionTitle = params.sectionTitle;

  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [result, setResult] = useState<TaskAnswerResult | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [memorySolved, setMemorySolved] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    setTask(null);
    setSelectedId(null);
    setAnswerText('');
    setResult(null);
    setAttemptsUsed(0);
    setMemorySolved(false);

    getTask(Number(id))
      .then((t) => {
        if (!active) return;
        setTask(t);
        if (t.type !== 'memory') {
          setAttemptsUsed(t.attemptsUsed);
        }
      })
      .catch((e) => {
        console.warn('Failed to load task:', e);
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [id, reload]);

  const phase: Phase =
    result == null
      ? 'answering'
      : result.isCorrect
        ? result.unlockedDifficulty != null
          ? 'unlocked'
          : 'correct'
        : (result.attemptsLeft ?? 0) > 0
          ? 'retry'
          : 'revealed';

  const check = async () => {
    if (task == null || submitting) return;

    let input: TaskAnswerInput;
    if (task.type === 'single_choice') {
      if (selectedId == null) return;
      input = { selectedOptionId: selectedId };
    } else if (task.type === 'short_answer') {
      if (answerText.trim() === '') return;
      input = { answerText: answerText.trim() };
    } else {
      return;
    }

    setSubmitting(true);
    try {
      const r = await submitTaskAnswer(task.id, input);
      setResult(r);
      setAttemptsUsed(r.attemptNumber);
    } catch (e) {
      console.warn('Failed to submit answer:', e);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setResult(null);
    setSelectedId(null);
    setAnswerText('');
  };

  const handleMemorySolved = async () => {
    if (task == null || task.type !== 'memory' || memorySolved) return;
    setMemorySolved(true);
    try {
      await submitTaskAnswer(task.id, { memoryCompleted: true });
    } catch (e) {
      console.warn('Failed to submit memory result:', e);
    }
  };

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.bg }}>
        <SafeAreaView className="flex-1">
          <ErrorState onRetry={() => setReload((n) => n + 1)} />
        </SafeAreaView>
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.textPrimary} />
      </View>
    );
  }

  const headerTitle = position > 0 ? `Zadanie ${position}${total > 0 ? ` z ${total}` : ''}` : 'Zadanie';
  const headerProgress = position > 0 && total > 0 ? { current: position, total } : undefined;

  if (task.type === 'memory') {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.bg }}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <TaskHeader
            title={headerTitle}
            onClose={() => router.back()}
            progress={headerProgress}
            accentColor={color}
            trackColor={withAlpha(theme.textPrimary, 0.1)}
            closeButtonColor={withAlpha(theme.textPrimary, 0.06)}
            closeIconColor={theme.textPrimary}
            titleColor={theme.textSecondary}
          />

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {sectionTitle ? (
              <Text
                className="text-xs font-manrope-bold uppercase tracking-wide mb-2"
                style={{ color }}
                numberOfLines={1}
              >
                {sectionTitle}
              </Text>
            ) : null}
            <MathText
              className={`${textClass} text-2xl font-manrope-extrabold leading-snug`}
              color={theme.textPrimary}
            >
              {task.prompt}
            </MathText>
            <View style={{ marginTop: 24 }}>
              <MemoryBoard pairs={task.pairs} onSolved={handleMemorySolved} />
            </View>
            {memorySolved && (
              <FadeIn>
                <View style={{ marginTop: 20 }}>
                  <AnswerFeedback kind="correct" />
                </View>
              </FadeIn>
            )}
          </ScrollView>

          <View className="px-5" style={{ paddingTop: 8, paddingBottom: 12 }}>
            <TaskCta
              label="Dalej"
              onPress={() => router.back()}
              disabled={!memorySolved}
              tone="success"
              showArrow
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (phase === 'unlocked' && result?.unlockedDifficulty) {
    const unlockedLabel = DIFFICULTY_LABEL[result.unlockedDifficulty as 1 | 2 | 3];
    return (
      <View className="flex-1" style={{ backgroundColor: theme.heroTo }}>
        <SafeAreaView className="flex-1 px-6 pb-6">
          <View className="flex-1 items-center justify-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-7"
              style={{
                backgroundColor: withAlpha(theme.accent, 0.18),
                shadowColor: theme.accent,
                shadowOpacity: 0.4,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 0 },
                elevation: 6,
              }}
            >
              <Ionicons name="trending-up-outline" size={42} color={theme.accent} />
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.65)' }} className="text-sm uppercase tracking-wide text-center mb-2">
              Awans
            </Text>
            <Text
              className="text-4xl leading-tight text-center mb-4"
              style={{ color: '#fefefe', fontFamily: theme.headingFontFamily }}
            >
              Odblokowano poziom: {unlockedLabel}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }} className="text-base leading-relaxed text-center">
              Wszystkie łatwiejsze zadania w tej podsekcji są zrobione — czas na trudniejsze.
            </Text>
          </View>

          <TaskCta
            label="Super, dalej!"
            onPress={() => router.back()}
            tone="accent"
            accentHex={theme.accent}
            showArrow
          />
        </SafeAreaView>
      </View>
    );
  }

  const correctOptionId =
    result?.solution && 'correctOptionId' in result.solution ? result.solution.correctOptionId : null;
  const revealedText =
    task.type === 'single_choice'
      ? task.options.find((o) => o.id === correctOptionId)?.text ?? ''
      : result?.solution && 'answers' in result.solution
        ? result.solution.answers.join('   •   ')
        : '';

  const locked = phase !== 'answering';
  const answerEmpty = task.type === 'single_choice' ? selectedId == null : answerText.trim() === '';

  const cta: { label: string; onPress: () => void } =
    phase === 'answering'
      ? { label: 'Sprawdź', onPress: check }
      : phase === 'retry'
        ? { label: 'Spróbuj jeszcze raz', onPress: retry }
        : { label: 'Dalej', onPress: () => router.back() };

  const inputBorder =
    phase === 'correct'
      ? GREEN
      : phase === 'revealed' || phase === 'retry'
        ? CORAL
        : inputFocused
          ? color
          : withAlpha(theme.textPrimary, 0.12);
  const inputBg =
    phase === 'correct'
      ? 'rgba(31,157,99,0.08)'
      : phase === 'revealed' || phase === 'retry'
        ? 'rgba(255,95,85,0.06)'
        : theme.surface;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <TaskHeader
          title={headerTitle}
          onClose={() => router.back()}
          right={
            <AttemptDots
              used={attemptsUsed}
              max={task.maxAttempts}
              phase={phase}
              accentColor={color}
              neutralColor={withAlpha(theme.textPrimary, 0.15)}
            />
          }
          progress={headerProgress}
          accentColor={color}
          trackColor={withAlpha(theme.textPrimary, 0.1)}
          closeButtonColor={withAlpha(theme.textPrimary, 0.06)}
          closeIconColor={theme.textPrimary}
          titleColor={theme.textSecondary}
        />

        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
              {sectionTitle ? (
                <Text
                  className="text-xs font-manrope-bold uppercase tracking-wide flex-1 mr-3"
                  style={{ color }}
                  numberOfLines={1}
                >
                  {sectionTitle}
                </Text>
              ) : (
                <View className="flex-1" />
              )}
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: withAlpha(color, 0.14) }}>
                <Text className="text-xs font-manrope-bold" style={{ color }}>
                  {DIFFICULTY_LABEL[task.difficulty]}
                </Text>
              </View>
            </View>

            <MathText
              className={`${textClass} text-2xl font-manrope-extrabold leading-snug`}
              color={theme.textPrimary}
            >
              {task.prompt}
            </MathText>

            {task.type === 'single_choice' ? (
              <View style={{ gap: 12, marginTop: 24 }}>
                {task.options.map((opt, i) => {
                  const selected = selectedId === opt.id;
                  const active = selected && phase === 'answering';
                  const isCorrectOne = phase === 'revealed' && opt.id === correctOptionId;
                  const pickedCorrect = phase === 'correct' && selected;
                  const good = isCorrectOne || pickedCorrect;
                  const pickedWrong = (phase === 'retry' || phase === 'revealed') && selected && !isCorrectOne;

                  const borderColor = good
                    ? GREEN
                    : pickedWrong
                      ? CORAL
                      : active
                        ? theme.accent
                        : withAlpha(theme.textPrimary, 0.12);
                  const bg = good
                    ? 'rgba(31,157,99,0.08)'
                    : pickedWrong
                      ? 'rgba(255,95,85,0.06)'
                      : active
                        ? theme.accent
                        : theme.surface;
                  const fg = active ? theme.accentInk : theme.textPrimary;

                  return (
                    <Pressable
                      key={opt.id}
                      disabled={locked}
                      onPress={() => setSelectedId(opt.id)}
                      className="flex-row items-center"
                      style={{
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor,
                        backgroundColor: bg,
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        gap: 12,
                      }}
                    >
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: active ? withAlpha(theme.accentInk, 0.2) : withAlpha(color, 0.14) }}
                      >
                        <Text className="font-manrope-bold text-sm" style={{ color: active ? theme.accentInk : color }}>
                          {LETTERS[i]}
                        </Text>
                      </View>
                      <MathText
                        className={`font-manrope-semibold text-base flex-1 ${
                          active ? (isLightHex(theme.accentInk) ? 'text-infiro-white' : 'text-infiro-navy') : textClass
                        }`}
                        color={fg}
                      >
                        {opt.text}
                      </MathText>
                      {good && <Ionicons name="checkmark-circle" size={22} color={GREEN} />}
                      {pickedWrong && <Ionicons name="close-circle" size={22} color={CORAL} />}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={{ marginTop: 24, justifyContent: 'center' }}>
                <TextInput
                  value={answerText}
                  onChangeText={setAnswerText}
                  editable={!locked}
                  keyboardType="decimal-pad"
                  placeholder="Wpisz odpowiedź"
                  placeholderTextColor={withAlpha(theme.textPrimary, 0.35)}
                  onSubmitEditing={check}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  className="font-manrope-bold text-xl"
                  style={{
                    height: 56,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: inputBorder,
                    backgroundColor: inputBg,
                    color: theme.textPrimary,
                    paddingLeft: 18,
                    paddingRight: 48,
                    paddingVertical: 0,
                  }}
                />
                {phase === 'correct' && (
                  <View style={{ position: 'absolute', right: 16 }}>
                    <Ionicons name="checkmark-circle" size={24} color={GREEN} />
                  </View>
                )}
                {(phase === 'retry' || phase === 'revealed') && (
                  <View style={{ position: 'absolute', right: 16 }}>
                    <Ionicons name="close-circle" size={24} color={CORAL} />
                  </View>
                )}
              </View>
            )}

            {phase !== 'answering' && (
              <FadeIn key={phase}>
                <View style={{ marginTop: 20 }}>
                  {phase === 'correct' && <AnswerFeedback kind="correct" />}
                  {phase === 'retry' && (
                    <AnswerFeedback kind="retry" attemptsLeft={result?.attemptsLeft ?? 0} />
                  )}
                  {phase === 'revealed' && <AnswerFeedback kind="revealed" solution={revealedText} />}
                </View>
              </FadeIn>
            )}
          </ScrollView>

          <View className="px-5" style={{ paddingTop: 8, paddingBottom: 12 }}>
            <TaskCta
              label={cta.label}
              onPress={cta.onPress}
              disabled={phase === 'answering' && answerEmpty}
              loading={submitting}
              tone={phase === 'correct' ? 'success' : phase === 'retry' ? 'warning' : 'accent'}
              accentHex={color}
              showArrow={phase === 'correct' || phase === 'revealed'}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
