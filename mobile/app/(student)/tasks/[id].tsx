import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MathText } from '../../../components/MathText';
import { Text } from '../../../components/Text';
import { AnswerFeedback } from '../../../components/student/AnswerFeedback';
import { ErrorState } from '../../../components/student/ErrorState';
import { Task, TaskAnswerResult, getTask, submitTaskAnswer } from '../../../lib/tasks';

const NAVY = '#142284';
const CORAL = '#ff5f55';
const GREEN = '#1f9d63';
const LETTERS = ['A', 'B', 'C'];
const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = { 1: 'Łatwe', 2: 'Średnie', 3: 'Trudne' };

type Phase = 'answering' | 'correct' | 'retry' | 'revealed';

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<TaskAnswerResult | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    setTask(null);
    setSelectedId(null);
    setResult(null);
    setAttemptsUsed(0);

    getTask(Number(id))
      .then((t) => {
        if (!active) return;
        setTask(t);
        if (t.type !== 'memory') {
          setAttemptsUsed(t.attemptsUsed);
          if (t.solution) {
            setResult({
              isCorrect: false,
              attemptNumber: t.attemptsUsed,
              attemptsLeft: 0,
              solution: t.solution,
            });
          }
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
        ? 'correct'
        : (result.attemptsLeft ?? 0) > 0
          ? 'retry'
          : 'revealed';

  const check = async () => {
    if (task == null || task.type !== 'single_choice' || selectedId == null || submitting) return;
    setSubmitting(true);
    try {
      const r = await submitTaskAnswer(task.id, { selectedOptionId: selectedId });
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
  };

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
        <SafeAreaView className="flex-1">
          <ErrorState onRetry={() => setReload((n) => n + 1)} />
        </SafeAreaView>
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#f4f5fb' }}>
        <ActivityIndicator color={NAVY} />
      </View>
    );
  }

  if (task.type !== 'single_choice') {
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Text className="text-infiro-navy font-manrope-extrabold text-lg text-center">
            Ten typ zadania będzie wkrótce
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8} className="mt-4">
            <Text className="font-manrope-semibold text-[14px]" style={{ color: '#6b74a8' }}>
              ‹ Wróć
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const correctOptionId =
    result?.solution && 'correctOptionId' in result.solution ? result.solution.correctOptionId : null;
  const revealedText = task.options.find((o) => o.id === correctOptionId)?.text ?? '';
  const locked = phase !== 'answering';

  const cta: { label: string; onPress: () => void; disabled?: boolean } =
    phase === 'answering'
      ? { label: 'Sprawdź', onPress: check, disabled: selectedId == null || submitting }
      : phase === 'retry'
        ? { label: 'Spróbuj jeszcze raz', onPress: retry }
        : { label: 'Dalej', onPress: () => router.back() };

  return (
    <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-5" style={{ paddingTop: 4, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(20,34,132,0.06)' }}
          >
            <Ionicons name="close" size={18} color={NAVY} />
          </Pressable>
          <Text className="font-manrope-semibold text-[13px]" style={{ color: '#8b93bd' }}>
            {phase === 'answering'
              ? `Próba ${attemptsUsed + 1} z ${task.maxAttempts}`
              : DIFFICULTY_LABEL[task.difficulty]}
          </Text>
          <View className="w-9" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <MathText className="text-infiro-navy font-manrope-extrabold text-[22px] leading-[28px]" color={NAVY}>
            {task.prompt}
          </MathText>

          <View style={{ gap: 10, marginTop: 24 }}>
            {task.options.map((opt, i) => {
              const selected = selectedId === opt.id;
              const isCorrectOne = phase === 'revealed' && opt.id === correctOptionId;
              const isWrongPick = phase === 'revealed' && selected && !isCorrectOne;

              const borderColor = isCorrectOne
                ? GREEN
                : isWrongPick
                  ? CORAL
                  : selected
                    ? NAVY
                    : 'rgba(20,34,132,0.12)';
              const bg = selected && phase === 'answering' ? NAVY : '#fefefe';
              const fg = selected && phase === 'answering' ? '#fefefe' : NAVY;

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
                    paddingVertical: 15,
                    paddingHorizontal: 15,
                    gap: 13,
                  }}
                >
                  <View
                    className="items-center justify-center"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 100,
                      backgroundColor:
                        selected && phase === 'answering' ? 'rgba(254,254,254,0.2)' : 'rgba(20,34,132,0.06)',
                    }}
                  >
                    <Text className="font-manrope-bold text-[13px]" style={{ color: fg }}>
                      {LETTERS[i]}
                    </Text>
                  </View>
                  <MathText className="font-manrope-semibold text-[15px] flex-1" color={fg}>
                    {opt.text}
                  </MathText>
                  {isCorrectOne && <Ionicons name="checkmark" size={18} color={GREEN} />}
                  {isWrongPick && <Ionicons name="close" size={18} color={CORAL} />}
                </Pressable>
              );
            })}
          </View>

          {phase === 'correct' && (
            <View style={{ marginTop: 18 }}>
              <AnswerFeedback kind="correct" />
            </View>
          )}
          {phase === 'retry' && (
            <View style={{ marginTop: 18 }}>
              <AnswerFeedback kind="retry" attemptsLeft={result?.attemptsLeft ?? 0} />
            </View>
          )}
          {phase === 'revealed' && (
            <View style={{ marginTop: 18 }}>
              <AnswerFeedback kind="revealed" solution={revealedText} />
            </View>
          )}
        </ScrollView>

        <View
          className="px-5"
          style={{
            paddingTop: 12,
            paddingBottom: 10,
            borderTopWidth: 1,
            borderTopColor: '#e8eaf4',
            backgroundColor: 'rgba(244,245,251,0.96)',
          }}
        >
          <Pressable
            onPress={cta.onPress}
            disabled={cta.disabled}
            className="flex-row items-center justify-center"
            style={{
              height: 54,
              borderRadius: 100,
              gap: 8,
              backgroundColor: phase === 'correct' ? GREEN : phase === 'retry' ? CORAL : NAVY,
              opacity: cta.disabled ? 0.4 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fefefe" />
            ) : (
              <>
                <Text className="text-infiro-white font-manrope-extrabold text-base">{cta.label}</Text>
                {(phase === 'correct' || phase === 'revealed') && (
                  <Ionicons name="arrow-forward" size={18} color="#fefefe" />
                )}
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
