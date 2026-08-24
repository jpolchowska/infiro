import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceQuestionCard } from '../../components/leveling-test/ChoiceQuestionCard';
import { FadeIn } from '../../components/leveling-test/FadeIn';
import { InputQuestionCard } from '../../components/leveling-test/InputQuestionCard';
import { ProgressBar } from '../../components/leveling-test/ProgressBar';
import {
  LevelingAnswer,
  LevelingQuestion,
  TOPIC_ACCENT,
  TOPICS,
  buildLevelingTest,
  calculateResult,
  topicLabel,
} from '../../lib/levelingTest';

type Step = 'intro' | 'quiz' | 'result';

const CTA_SHADOW = {
  shadowColor: '#ff5f55',
  shadowOpacity: 0.5,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

const INTRO_POINTS = [
  '12 pytań',
  'Ten test jest dla ciebie',
  'Zadania są z różnych działów matematyki',
];

export default function LevelingTestScreen() {
  const [step, setStep] = useState<Step>('intro');
  const [questions] = useState<LevelingQuestion[]>(() => buildLevelingTest());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<LevelingAnswer[]>([]);

  const currentQuestion = questions[index];

  const handleAnswer = (correct: boolean) => {
    const nextAnswers = [...answers, { topic: currentQuestion.topic, correct }];
    setAnswers(nextAnswers);

    if (index + 1 >= questions.length) {
      setStep('result');
    } else {
      setIndex(index + 1);
    }
  };

  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  const handleClose = () => {
    Alert.alert('Przerwać test?', 'Twoje odpowiedzi nie zostaną zapisane.', [
      { text: 'Zostań', style: 'cancel' },
      { text: 'Przerwij', style: 'destructive', onPress: goHome },
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
            {INTRO_POINTS.map((item) => (
              <View key={item} className="flex-row items-center mb-3">
                <View className="w-2 h-2 rounded-full bg-infiro-purple mr-3" />
                <Text className="text-infiro-white text-base">{item}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => setStep('quiz')}
            className="bg-infiro-coral rounded-2xl py-4 items-center active:opacity-80"
            style={CTA_SHADOW}
          >
            <Text className="text-infiro-white font-semibold text-base">Zaczynamy</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'quiz' && currentQuestion) {
    const accent = TOPIC_ACCENT[currentQuestion.topic];

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

          <FadeIn key={currentQuestion.id}>
            <Text className={`${accent.text} text-xs font-bold uppercase tracking-wide mt-8 mb-2`}>
              {topicLabel(currentQuestion.topic)}
            </Text>

            {currentQuestion.type !== 'memory' && (
              <Text className="text-infiro-navy text-2xl font-extrabold leading-snug mb-6">
                {currentQuestion.prompt}
              </Text>
            )}

            {currentQuestion.type === 'choice' && (
              <ChoiceQuestionCard question={currentQuestion} onAnswer={handleAnswer} />
            )}
            {currentQuestion.type === 'input' && (
              <InputQuestionCard question={currentQuestion} onAnswer={handleAnswer} />
            )}
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
            {TOPICS.map((topic) => (
              <View key={topic.id} className="flex-row items-center justify-between py-2">
                <Text className="text-infiro-white text-base">{topic.label}</Text>
                <Text className="text-infiro-white/70 text-base font-semibold">
                  {result.perTopic[topic.id]}/3
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={goHome}
            className="bg-infiro-coral rounded-2xl py-4 items-center active:opacity-80"
            style={CTA_SHADOW}
          >
            <Text className="text-infiro-white font-semibold text-base">Przejdź do nauki</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}
