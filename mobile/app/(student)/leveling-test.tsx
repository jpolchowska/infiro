import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceQuestionCard } from '../../components/leveling-test/ChoiceQuestionCard';
import { FadeIn } from '../../components/leveling-test/FadeIn';
import { ProgressBar } from '../../components/leveling-test/ProgressBar';
import {
  LevelingAnswer,
  LevelingQuestion,
  calculateResult,
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

  const handleAnswer = (selectedOptionId: number, correct: boolean) => {
    if (!currentQuestion || !questions) return;

    const nextAnswers = [
      ...answers,
      {
        sectionId: currentQuestion.sectionId,
        sectionTitle: currentQuestion.sectionTitle,
        taskId: currentQuestion.taskId,
        selectedOptionId,
        correct,
      },
    ];
    setAnswers(nextAnswers);

    if (index + 1 >= questions.length) {
      setStep('result');
      submitLevelingTest(nextAnswers).catch((error) => {
        console.error('Failed to submit leveling test results:', error);
      });
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
  };

  const handleClose = () => {
    Alert.alert('Przerwać test?', 'Test trzeba będzie zrobić od nowa, żeby wejść do aplikacji.', [
      { text: 'Zostań', style: 'cancel' },
      { text: 'Przerwij', style: 'destructive', onPress: restartTest },
    ]);
  };

  if (step === 'intro') {
    return (
      <SafeAreaView className="flex-1 bg-infiro-navy">
        <View className="flex-1 justify-center px-6">
          <Text className="text-infiro-white text-4xl font-extrabold leading-tight mb-4">
            Test poziomujący
          </Text>
          <Text className="text-infiro-white/70 text-base mb-8">
            Krótki test bez oceny. Możesz się pomylić — dzięki temu dobierzemy zadania na Twój poziom.
          </Text>

          <View className="mb-10">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-infiro-purple mr-3" />
              <Text className="text-infiro-white text-base">
                {questions ? `${questions.length} pytań` : 'Ładowanie pytań…'}
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-infiro-purple mr-3" />
              <Text className="text-infiro-white text-base">Ten test jest dla ciebie</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-infiro-purple mr-3" />
              <Text className="text-infiro-white text-base">Zadania są z różnych działów matematyki</Text>
            </View>
          </View>

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
            className={`rounded-2xl py-4 items-center active:opacity-80 ${
              questions && questions.length > 0 ? 'bg-infiro-coral' : 'bg-infiro-coral/40'
            }`}
            style={CTA_SHADOW}
          >
            {!questions ? (
              <ActivityIndicator color="#fefefe" />
            ) : (
              <Text className="text-infiro-white font-semibold text-base">Zaczynamy</Text>
            )}
          </Pressable>
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
              <Text className="text-infiro-navy text-base font-bold">×</Text>
            </Pressable>
            <Text className="text-infiro-navy/60 text-sm font-semibold">
              Pytanie {index + 1} z {questions.length}
            </Text>
            <View className="w-9" />
          </View>

          <ProgressBar current={index + 1} total={questions.length} accentClassName={accent.bg} />

          <FadeIn key={currentQuestion.taskId}>
            <Text className={`${accent.text} text-xs font-bold uppercase tracking-wide mt-8 mb-2`}>
              {currentQuestion.sectionTitle}
            </Text>

            <Text className="text-infiro-navy text-2xl font-extrabold leading-snug mb-6">
              {currentQuestion.prompt}
            </Text>

            <ChoiceQuestionCard question={currentQuestion} accent={accent} onAnswer={handleAnswer} />
          </FadeIn>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'result') {
    const result = calculateResult(answers);

    return (
      <SafeAreaView className="flex-1 bg-infiro-navy">
        <View className="flex-1 justify-center px-6">
          <Text className="text-infiro-white/60 text-sm uppercase tracking-wide mb-2">Twój wynik</Text>
          <Text className="text-infiro-white text-4xl font-extrabold leading-tight mb-2">
            {result.total}/{result.maxTotal}
          </Text>
          <Text className="text-infiro-white text-2xl font-bold mb-4">Poziom: {result.levelLabel}</Text>
          <Text className="text-infiro-white/80 text-base mb-8">{result.encouragement}</Text>

          <View className="bg-infiro-white/10 rounded-2xl p-4 mb-10">
            {result.perSection.map((section) => (
              <View key={section.sectionId} className="flex-row items-center justify-between py-2">
                <Text className="text-infiro-white text-base">{section.sectionTitle}</Text>
                <Text className="text-infiro-white/70 text-base font-semibold">
                  {section.score}/{section.total}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={goToApp}
            className="bg-infiro-coral rounded-2xl py-4 items-center active:opacity-80"
            style={CTA_SHADOW}
          >
            <Text className="text-infiro-white font-semibold text-base">Przejdź do nauki</Text>
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
          <Text className="text-infiro-white font-semibold text-base">Wróć</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
