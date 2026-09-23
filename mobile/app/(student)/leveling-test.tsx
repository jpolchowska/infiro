import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceQuestionCard } from '../../components/leveling-test/ChoiceQuestionCard';
import { FadeIn } from '../../components/leveling-test/FadeIn';
import { ProgressBar } from '../../components/leveling-test/ProgressBar';
import { ShortAnswerCard } from '../../components/leveling-test/ShortAnswerCard';
import { MathText } from '../../components/MathText';
import {
  LevelingAnswer,
  LevelingQuestion,
  LevelingResult,
  fetchLevelingTest,
  getAccent,
  submitLevelingTest,
} from '../../lib/levelingTest';

type Step = 'intro' | 'quiz' | 'result';

const CTA_SHADOW = {
  shadowColor: '#ff5f55',
  shadowOpacity: 0.5,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

export default function LevelingTestScreen() {
  const [step, setStep] = useState<Step>('intro');
  const [questions, setQuestions] = useState<LevelingQuestion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<LevelingAnswer[]>([]);
  const [result, setResult] = useState<LevelingResult | null>(null);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchLevelingTest()
      .then((data) => {
        if (active) setQuestions(data);
      })
      .catch((error) => {
        console.error('Failed to fetch leveling test:', error);
        if (active) setLoadError('Nie udało się załadować testu. Spróbuj ponownie.');
      });
    return () => {
      active = false;
    };
  }, []);

  const currentQuestion = questions?.[index];

  const sendResult = (all: LevelingAnswer[]) => {
    setResult(null);
    setSubmitError(false);
    submitLevelingTest(all)
      .then(setResult)
      .catch((error) => {
        console.error('Failed to submit leveling test:', error);
        setSubmitError(true);
      });
  };

  const answerCurrent = (partial: Pick<LevelingAnswer, 'selectedOptionId' | 'answerText'>) => {
    if (!currentQuestion || !questions) return;

    const next = [...answers, { taskId: currentQuestion.taskId, ...partial }];
    setAnswers(next);

    if (index + 1 >= questions.length) {
      setStep('result');
      sendResult(next);
    } else {
      setIndex(index + 1);
    }
  };

  const goToApp = () => {
    router.replace('/(student)/home');
  };

  const restartTest = () => {
    setStep('intro');
    setIndex(0);
    setAnswers([]);
    setResult(null);
    setSubmitError(false);
  };

  const handleClose = () => {
    Alert.alert('Przerwać test?', 'Test trzeba będzie zrobić od nowa, żeby wejść do aplikacji.', [
      { text: 'Zostań', style: 'cancel' },
      { text: 'Przerwij', style: 'destructive', onPress: restartTest },
    ]);
  };

  if (step === 'intro') {
    const features: { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; label: string }[] = [
      {
        icon: 'list-outline',
        color: '#c873d9',
        bg: 'bg-infiro-purple/15',
        label: questions ? `${questions.length} pytań` : 'Ładowanie pytań…',
      },
      { icon: 'person-outline', color: '#f0b67e', bg: 'bg-infiro-peach/15', label: 'Ten test jest dla ciebie' },
      {
        icon: 'shapes-outline',
        color: '#ff5f55',
        bg: 'bg-infiro-coral/15',
        label: 'Zadania są z różnych działów matematyki',
      },
    ];

    return (
      <SafeAreaView className="flex-1 bg-infiro-navy">
        <View className="flex-1 px-6 pb-6">
          <View className="flex-1 items-center justify-center">
            <View
              className="w-24 h-24 rounded-full bg-infiro-purple/15 items-center justify-center mb-7"
              style={{
                shadowColor: '#c873d9',
                shadowOpacity: 0.4,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 0 },
                elevation: 6,
              }}
            >
              <Ionicons name="speedometer-outline" size={42} color="#c873d9" />
            </View>

            <Text className="text-infiro-white text-3xl font-manrope-extrabold leading-tight text-center mb-3">
              Test poziomujący
            </Text>
            <Text className="text-infiro-white/70 text-base leading-relaxed text-center mb-8">
              Ten test pomoże nam poznać Twój poziom. Odpowiadaj tak, jak potrafisz.
            </Text>

            <View className="w-full bg-infiro-white/10 rounded-2xl p-4 gap-4">
              {features.map((feature) => (
                <View key={feature.label} className="flex-row items-center gap-3">
                  <View className={`w-9 h-9 rounded-full items-center justify-center ${feature.bg}`}>
                    <Ionicons name={feature.icon} size={18} color={feature.color} />
                  </View>
                  <Text className="text-infiro-white text-base flex-1">{feature.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View>
            {loadError && (
              <Text className="text-infiro-coral text-sm mb-4">{loadError}</Text>
            )}

            {questions && questions.length === 0 && (
              <Text className="text-infiro-white/70 text-sm mb-4">
                Nie ma jeszcze żadnych zadań do testu — wróć tu, gdy nauczyciel doda treść.
              </Text>
            )}

            <Pressable
              onPress={() => setStep('quiz')}
              disabled={!questions || questions.length === 0}
              className={`rounded-2xl py-4 flex-row items-center justify-center gap-2 active:opacity-80 ${
                questions && questions.length > 0 ? 'bg-infiro-coral' : 'bg-infiro-coral/40'
              }`}
              style={CTA_SHADOW}
            >
              {!questions ? (
                <ActivityIndicator color="#fefefe" />
              ) : (
                <>
                  <Text className="text-infiro-white font-manrope-semibold text-base">Zaczynamy</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fefefe" />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'quiz' && questions && currentQuestion) {
    const accent = getAccent(currentQuestion.sectionIndex);

    return (
      <SafeAreaView className="flex-1 bg-infiro-white">
        <View className="flex-1 px-6 pt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-infiro-navy/5 items-center justify-center"
            >
              <Text className="text-infiro-navy text-base font-manrope-bold">×</Text>
            </Pressable>
            <Text className="text-infiro-navy/60 text-sm font-manrope-semibold">
              Pytanie {index + 1} z {questions.length}
            </Text>
            <View className="w-9" />
          </View>

          <ProgressBar current={index + 1} total={questions.length} accentClassName={accent.bg} />

          <FadeIn key={currentQuestion.taskId}>
            <Text className={`${accent.text} text-xs font-manrope-bold uppercase tracking-wide mt-8 mb-2`}>
              {currentQuestion.sectionTitle}
            </Text>

            <MathText
              className="text-infiro-navy text-2xl font-manrope-extrabold leading-snug mb-6"
              color="#142284"
            >
              {currentQuestion.prompt}
            </MathText>

            {currentQuestion.type === 'single_choice' ? (
              <ChoiceQuestionCard
                question={currentQuestion}
                accent={accent}
                onAnswer={(selectedOptionId) => answerCurrent({ selectedOptionId })}
                onSkip={() => answerCurrent({})}
              />
            ) : (
              <ShortAnswerCard
                accent={accent}
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
        <SafeAreaView className="flex-1 bg-infiro-navy">
          <View className="flex-1 justify-center px-6">
            <Text className="text-infiro-white text-2xl font-manrope-extrabold mb-3">
              Nie udało się wysłać wyniku
            </Text>
            <Text className="text-infiro-white/80 text-base mb-8">
              Sprawdź połączenie i spróbuj ponownie.
            </Text>
            <Pressable
              onPress={() => sendResult(answers)}
              className="bg-infiro-coral rounded-2xl py-4 items-center active:opacity-80"
              style={CTA_SHADOW}
            >
              <Text className="text-infiro-white font-manrope-semibold text-base">Spróbuj ponownie</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    if (!result) {
      return (
        <SafeAreaView className="flex-1 bg-infiro-navy">
          <View className="flex-1 justify-center items-center px-6">
            <ActivityIndicator color="#fefefe" />
            <Text className="text-infiro-white/70 text-base mt-4">Sprawdzamy odpowiedzi…</Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-infiro-navy">
        <View className="flex-1 px-6 pb-6">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <View className="items-center">
              <View
                className="w-24 h-24 rounded-full bg-infiro-purple/15 items-center justify-center mb-8"
                style={{
                  shadowColor: '#c873d9',
                  shadowOpacity: 0.4,
                  shadowRadius: 22,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 6,
                }}
              >
                <Ionicons name="trophy-outline" size={42} color="#c873d9" />
              </View>

              <Text className="text-infiro-white/60 text-sm uppercase tracking-wide text-center mb-1">
                Twój wynik
              </Text>
              <Text className="text-infiro-white text-5xl font-manrope-extrabold leading-tight text-center mb-2">
                {result.total}/{result.maxTotal}
              </Text>

              <View
                className="w-full bg-infiro-white/10 rounded-2xl p-5 gap-7"
                style={{ marginTop: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {result.perSection.map((section) => {
                  const percent = section.total > 0 ? Math.min(100, Math.round((section.score / section.total) * 100)) : 0;
                  return (
                    <View key={section.sectionId}>
                      <View className="flex-row items-center justify-between mb-2.5">
                        <Text className="text-infiro-white text-sm font-manrope-semibold flex-1 mr-2">
                          {section.sectionTitle}
                        </Text>
                        <Text className="text-infiro-white/70 text-sm font-manrope-semibold">
                          {section.score}/{section.total}
                        </Text>
                      </View>
                      <View className="w-full h-2.5 bg-infiro-white/15 rounded-full overflow-hidden">
                        <View className="h-2.5 bg-infiro-coral rounded-full" style={{ width: `${percent}%` }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <Pressable
            onPress={goToApp}
            className="bg-infiro-coral rounded-2xl py-4 flex-row items-center justify-center gap-2 active:opacity-80"
            style={CTA_SHADOW}
          >
            <Text className="text-infiro-white font-manrope-semibold text-base">Przejdź do nauki</Text>
            <Ionicons name="arrow-forward" size={18} color="#fefefe" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-infiro-navy">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-infiro-white/70 text-base mb-6">Coś poszło nie tak.</Text>
        <Pressable
          onPress={() => setStep('intro')}
          className="bg-infiro-coral rounded-2xl py-3 px-6 items-center active:opacity-80"
        >
          <Text className="text-infiro-white font-manrope-semibold text-base">Wróć</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
