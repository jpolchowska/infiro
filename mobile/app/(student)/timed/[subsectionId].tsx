import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MathText } from '../../../components/MathText';
import { Text } from '../../../components/Text';
import { ErrorState } from '../../../components/student/ErrorState';
import { TimedAnswer, TimedResult, TimedSet, getTimedSet, submitTimedSet } from '../../../lib/timed';

const NAVY = '#142284';
const CORAL = '#ff5f55';
const LETTERS = ['A', 'B', 'C'];

type Phase = 'intro' | 'running' | 'result';

function clock(seconds: number) {
  const s = Math.max(seconds, 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function TimedScreen() {
  const { subsectionId } = useLocalSearchParams<{ subsectionId: string }>();
  const id = Number(subsectionId);

  const [set, setSet] = useState<TimedSet | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState<TimedResult | null>(null);

  const answersRef = useRef<TimedAnswer[]>([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    setError(false);
    setSet(null);
    getTimedSet(id)
      .then((data) => {
        if (!active) return;
        setSet(data);
        setRemaining(data.durationSeconds);
      })
      .catch((e) => {
        console.warn('Failed to load timed set:', e);
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [id, reload]);

  const finish = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase('result');
    const elapsed = set ? set.durationSeconds - Math.max(remaining, 0) : 0;
    submitTimedSet(id, answersRef.current, elapsed)
      .then(setResult)
      .catch((e) => console.warn('Failed to submit timed set:', e));
  };

  useEffect(() => {
    if (phase !== 'running') return;
    if (remaining <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, remaining]);

  const start = () => {
    answersRef.current = [];
    submittedRef.current = false;
    setIndex(0);
    setResult(null);
    if (set) setRemaining(set.durationSeconds);
    setPhase('running');
  };

  const pick = (optionId: number) => {
    if (!set) return;
    const q = set.questions[index];
    answersRef.current = [...answersRef.current, { taskId: q.taskId, selectedOptionId: optionId }];
    if (index + 1 >= set.questions.length) finish();
    else setIndex((i) => i + 1);
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

  if (!set) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#f4f5fb' }}>
        <ActivityIndicator color={NAVY} />
      </View>
    );
  }

  if (phase === 'intro') {
    const empty = set.questions.length === 0;
    return (
      <View className="flex-1 bg-infiro-navy">
        <SafeAreaView className="flex-1">
          <View className="px-6" style={{ paddingTop: 8 }}>
            <Pressable onPress={() => router.back()} hitSlop={12} className="w-9 h-9 items-center justify-center">
              <Ionicons name="close" size={22} color="#fefefe" />
            </Pressable>
          </View>
          <View className="flex-1 justify-center px-6">
            <Text className="text-infiro-white font-manrope-extrabold text-4xl leading-tight mb-3">
              Ćwicz na czas
            </Text>
            <Text className="text-infiro-white/70 text-base mb-8">
              Masz {set.durationSeconds} sekund na jak najwięcej zadań ABC z tej podsekcji. Bez
              podpowiedzi — wybierasz i lecisz dalej.
            </Text>
            {empty && (
              <Text className="text-infiro-white/70 text-sm mb-4">
                Brak zadań ABC w tej podsekcji.
              </Text>
            )}
            <Pressable
              onPress={start}
              disabled={empty}
              className="rounded-full py-4 items-center"
              style={{ backgroundColor: CORAL, opacity: empty ? 0.4 : 1 }}
            >
              <Text className="text-infiro-white font-manrope-extrabold text-base">Start</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (phase === 'running') {
    const q = set.questions[index];
    const low = remaining <= 10;
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View
            className="flex-row items-center justify-between px-5"
            style={{ paddingTop: 4, paddingBottom: 8 }}
          >
            <Pressable
              onPress={finish}
              hitSlop={12}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(20,34,132,0.06)' }}
            >
              <Ionicons name="close" size={18} color={NAVY} />
            </Pressable>
            <Text
              className="font-manrope-extrabold text-[18px]"
              style={{ color: low ? CORAL : NAVY }}
            >
              {clock(remaining)}
            </Text>
            <Text className="font-manrope-semibold text-[13px] w-9 text-right" style={{ color: '#8b93bd' }}>
              {index + 1}/{set.questions.length}
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <MathText
              className="text-infiro-navy font-manrope-extrabold text-[22px] leading-[28px]"
              color={NAVY}
            >
              {q.prompt}
            </MathText>

            <View style={{ gap: 10, marginTop: 24 }}>
              {q.options.map((opt, i) => (
                <Pressable
                  key={opt.id}
                  onPress={() => pick(opt.id)}
                  className="flex-row items-center bg-infiro-white"
                  style={{
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: 'rgba(20,34,132,0.12)',
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
                      backgroundColor: 'rgba(20,34,132,0.06)',
                    }}
                  >
                    <Text className="font-manrope-bold text-[13px]" style={{ color: NAVY }}>
                      {LETTERS[i]}
                    </Text>
                  </View>
                  <MathText className="font-manrope-semibold text-[15px] flex-1" color={NAVY}>
                    {opt.text}
                  </MathText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-infiro-navy">
      <SafeAreaView className="flex-1 justify-center px-6">
        <Text className="text-infiro-white/60 text-sm uppercase tracking-wide mb-2">Twój wynik</Text>
        <Text className="text-infiro-white font-manrope-extrabold text-4xl leading-tight mb-2">
          {result ? `${result.correct} / ${result.answered}` : '—'}
        </Text>
        <Text className="text-infiro-white/80 text-base mb-10">
          {result
            ? `Poprawne odpowiedzi z ${result.answered} udzielonych (na ${result.total} zadań).`
            : 'Nie udało się zapisać wyniku, ale ćwiczenie się liczy.'}
        </Text>

        <Pressable
          onPress={start}
          className="rounded-full py-4 items-center mb-3"
          style={{ backgroundColor: CORAL }}
        >
          <Text className="text-infiro-white font-manrope-extrabold text-base">Jeszcze raz</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="rounded-full py-4 items-center bg-infiro-white/10">
          <Text className="text-infiro-white font-manrope-semibold text-base">Wróć</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
