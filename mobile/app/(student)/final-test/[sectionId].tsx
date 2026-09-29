import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceQuestionCard } from '../../../components/final-test/ChoiceQuestionCard';
import { ShortAnswerCard } from '../../../components/final-test/ShortAnswerCard';
import { FadeIn } from '../../../components/leveling-test/FadeIn';
import { ProgressBar } from '../../../components/leveling-test/ProgressBar';
import { MathText } from '../../../components/MathText';
import { ScoreRing } from '../../../components/ScoreRing';
import {
  FinalTest,
  FinalTestAnswer,
  FinalTestResult,
  fetchFinalTest,
  submitFinalTest,
} from '../../../lib/finalTest';
import { isLightHex, topicColor, useTheme, withAlpha } from '../../../lib/theme';

type Step = 'intro' | 'quiz' | 'result';

export default function FinalTestScreen() {
  const { sectionId, sectionIndex } = useLocalSearchParams<{ sectionId: string; sectionIndex?: string }>();
  const theme = useTheme();
  const sectionColor = topicColor(theme, Number(sectionIndex ?? 0));
  const [step, setStep] = useState<Step>('intro');
  const [test, setTest] = useState<FinalTest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<FinalTestAnswer[]>([]);
  const [result, setResult] = useState<FinalTestResult | null>(null);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchFinalTest(Number(sectionId))
      .then((data) => {
        if (active) setTest(data);
      })
      .catch((error) => {
        console.error('Failed to fetch final test:', error);
        if (active) setLoadError('Nie udało się załadować testu. Spróbuj ponownie.');
      });
    return () => {
      active = false;
    };
  }, [sectionId]);

  const questions = test?.questions ?? null;
  const currentQuestion = questions?.[index];

  const sendResult = (all: FinalTestAnswer[]) => {
    setResult(null);
    setSubmitError(false);
    submitFinalTest(Number(sectionId), all)
      .then(setResult)
      .catch((error) => {
        console.error('Failed to submit final test:', error);
        setSubmitError(true);
      });
  };

  const answerCurrent = (partial: Pick<FinalTestAnswer, 'selectedOptionId' | 'answerText'>) => {
    if (!currentQuestion || !questions) return;

    const next = [...answers, { questionId: currentQuestion.questionId, ...partial }];
    setAnswers(next);

    if (index + 1 >= questions.length) {
      setStep('result');
      sendResult(next);
    } else {
      setIndex(index + 1);
    }
  };

  const goToSection = () => {
    router.replace(`/(student)/sections/${sectionId}`);
  };

  const restartTest = () => {
    setStep('intro');
    setIndex(0);
    setAnswers([]);
    setResult(null);
    setSubmitError(false);
  };

  if (step === 'intro') {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
        <View className="flex-1 px-6 pb-6">
          <Pressable
            onPress={goToSection}
            hitSlop={12}
            className="w-9 h-9 rounded-full items-center justify-center mt-3"
            style={{ backgroundColor: theme.surfaceMuted }}
          >
            <Text style={{ color: theme.textPrimary }} className="text-base font-manrope-bold">
              ×
            </Text>
          </Pressable>

          <View className="flex-1 items-center justify-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-7"
              style={{
                backgroundColor: withAlpha(theme.accent, 0.15),
                shadowColor: theme.accent,
                shadowOpacity: 0.4,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 0 },
                elevation: 6,
              }}
            >
              <Ionicons name="school-outline" size={42} color={theme.accent} />
            </View>

            <Text
              style={{ color: theme.textPrimary, fontFamily: theme.headingFontFamily }}
              className="text-3xl leading-tight text-center mb-3"
            >
              Test końcowy
            </Text>
            <Text
              style={{ color: theme.textSecondary }}
              className="font-manrope-medium text-base leading-relaxed text-center mb-8"
            >
              {test ? `Sprawdź, co zapamiętałeś/aś z działu „${test.sectionTitle}”.` : 'Ładowanie pytań…'}
              {'\n'}Możesz podejść dowolną liczbę razy.
            </Text>

            <View
              className="w-full rounded-2xl p-4"
              style={{ backgroundColor: theme.surfaceMuted }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: withAlpha(theme.accent, 0.15) }}
                >
                  <Ionicons name="list-outline" size={18} color={theme.accent} />
                </View>
                <Text style={{ color: theme.textPrimary }} className="font-manrope-medium text-base flex-1">
                  {questions ? `${questions.length} pytań` : 'Ładowanie pytań…'}
                </Text>
              </View>
            </View>
          </View>

          <View>
            {loadError && (
              <Text style={{ color: theme.accent }} className="text-sm mb-4">
                {loadError}
              </Text>
            )}

            {questions && questions.length === 0 && (
              <Text style={{ color: theme.textSecondary }} className="text-sm mb-4">
                Test końcowy tego działu nie jest jeszcze gotowy.
              </Text>
            )}

            <Pressable
              onPress={() => setStep('quiz')}
              disabled={!questions || questions.length === 0}
              className="rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={{
                backgroundColor: theme.accent,
                opacity: !questions || questions.length === 0 ? 0.4 : 1,
                shadowColor: theme.accent,
                shadowOpacity: 0.5,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              {!questions ? (
                <ActivityIndicator color={theme.accentInk} />
              ) : (
                <>
                  <Text className="font-manrope-semibold text-base" style={{ color: theme.accentInk }}>
                    Zaczynamy
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.accentInk} />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'quiz' && questions && currentQuestion) {
    const accentColor = topicColor(theme, index);

    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
        <View className="flex-1 px-6 pt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={goToSection}
              hitSlop={12}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.surfaceMuted }}
            >
              <Text style={{ color: theme.textPrimary }} className="text-base font-manrope-bold">
                ×
              </Text>
            </Pressable>
            <Text style={{ color: theme.textSecondary }} className="text-sm font-manrope-semibold">
              Pytanie {index + 1} z {questions.length}
            </Text>
            <View className="w-9" />
          </View>

          <ProgressBar
            current={index + 1}
            total={questions.length}
            accentColor={accentColor}
            trackColor={theme.surfaceMuted}
          />

          <FadeIn key={currentQuestion.questionId}>
            <MathText
              className="text-2xl font-manrope-extrabold leading-snug mt-8 mb-6"
              color={theme.textPrimary}
            >
              {currentQuestion.prompt}
            </MathText>

            {currentQuestion.type === 'single_choice' ? (
              <ChoiceQuestionCard
                question={currentQuestion}
                theme={theme}
                accentColor={accentColor}
                onAnswer={(selectedOptionId) => answerCurrent({ selectedOptionId })}
                onSkip={() => answerCurrent({})}
              />
            ) : (
              <ShortAnswerCard
                theme={theme}
                accentColor={accentColor}
                onAnswer={(answerText) => answerCurrent({ answerText })}
                onSkip={() => answerCurrent({})}
              />
            )}
          </FadeIn>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'result') {
    if (submitError) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
          <View className="flex-1 justify-center px-6">
            <Text
              style={{ color: theme.textPrimary, fontFamily: theme.headingFontFamily }}
              className="text-2xl mb-3"
            >
              Nie udało się wysłać wyniku
            </Text>
            <Text style={{ color: theme.textSecondary }} className="text-base mb-8">
              Sprawdź połączenie i spróbuj ponownie.
            </Text>
            <Pressable
              onPress={() => sendResult(answers)}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: theme.accent }}
            >
              <Text className="font-manrope-semibold text-base" style={{ color: theme.accentInk }}>
                Spróbuj ponownie
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    if (!result) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
          <View className="flex-1 justify-center items-center px-6">
            <ActivityIndicator color={theme.accent} />
            <Text style={{ color: theme.textSecondary }} className="text-base mt-4">
              Sprawdzamy odpowiedzi…
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    const percent = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

    const resultInk = isLightHex(sectionColor) ? theme.textPrimary : '#fefefe';

    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
        <View className="flex-1 px-6 pb-6">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <FadeIn>
              <View className="items-center">
                <Text
                  style={{ color: theme.textPrimary, fontFamily: theme.headingFontFamily }}
                  className="text-[30px] leading-[34px] text-center mb-10"
                >
                  Dział ukończony!
                </Text>

                <ScoreRing
                  percent={percent}
                  size={232}
                  colorFrom={sectionColor}
                  colorTo={sectionColor}
                  trackColor={theme.surfaceBorder}
                  label={`${result.score}/${result.maxScore}`}
                  labelColor={theme.textPrimary}
                  labelFontFamily={theme.headingFontFamily}
                />

                <Text
                  style={{ color: theme.textSecondary }}
                  className="font-manrope-semibold text-lg text-center mt-7"
                >
                  {percent}% poprawnych odpowiedzi
                </Text>
              </View>
            </FadeIn>
          </ScrollView>

          <View style={{ gap: 12 }}>
            <Pressable
              onPress={restartTest}
              className="rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={{
                backgroundColor: sectionColor,
                shadowColor: sectionColor,
                shadowOpacity: 0.35,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <Text className="font-manrope-semibold text-base" style={{ color: resultInk }}>
                Spróbuj ponownie
              </Text>
            </Pressable>
            <Pressable
              onPress={goToSection}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: theme.surfaceMuted }}
            >
              <Text className="font-manrope-semibold text-base" style={{ color: theme.textPrimary }}>
                Wróć do działu
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
      <View className="flex-1 justify-center items-center px-6">
        <Text style={{ color: theme.textSecondary }} className="text-base mb-6">
          Coś poszło nie tak.
        </Text>
        <Pressable
          onPress={() => setStep('intro')}
          className="rounded-2xl py-3 px-6 items-center"
          style={{ backgroundColor: theme.accent }}
        >
          <Text className="font-manrope-semibold text-base" style={{ color: theme.accentInk }}>
            Wróć
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
