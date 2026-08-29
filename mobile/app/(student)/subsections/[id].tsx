import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '../../../components/student/ErrorState';
import { getAccent } from '../../../lib/levelingTest';
import { pluralize } from '../../../lib/pluralize';
import { SubsectionDetail, SubsectionTaskStatus, getSubsectionTasks } from '../../../lib/student';

const ACCENT_HEX = ['#ff5f55', '#c873d9', '#f0b67e', '#142284'];

const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = { 1: 'Łatwe', 2: 'Średnie', 3: 'Trudne' };
const STATUS_LABEL: Record<SubsectionTaskStatus, string> = {
  done: 'zrobione',
  current: 'teraz',
  todo: 'dalej',
  locked: 'zamknięte',
};

function StatusGlyph({ status, color }: { status: SubsectionTaskStatus; color: string }) {
  if (status === 'done') return <Ionicons name="checkmark" size={16} color={color} />;
  if (status === 'current') return <Ionicons name="play" size={13} color={color} />;
  if (status === 'locked') return <Ionicons name="lock-closed" size={13} color={color} />;
  return <View style={{ width: 5, height: 5, borderRadius: 100, backgroundColor: color }} />;
}

export default function SubsectionTasksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<SubsectionDetail | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    getSubsectionTasks(Number(id))
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((err) => {
        console.warn('Failed to load subsection tasks:', err);
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  const accent = detail ? getAccent(detail.sectionIndex) : null;
  const accentHex = detail ? ACCENT_HEX[detail.sectionIndex % ACCENT_HEX.length] : '#142284';
  const tasks = detail?.tasks ?? [];
  const total = tasks.length;
  const solved = tasks.filter((t) => t.status === 'done').length;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const finished = total > 0 && solved >= total;

  const goToSection = () => {
    if (detail) router.dismissTo(`/(student)/sections/${detail.sectionId}`);
    else router.back();
  };

  const cta: { label: string; onPress: () => void } = finished
    ? detail?.nextSubsectionId != null
      ? {
          label: 'Dalej',
          onPress: () => router.replace(`/(student)/subsections/${detail.nextSubsectionId}`),
        }
      : { label: 'Wróć do działu', onPress: goToSection }
    : { label: solved === 0 ? 'Zacznij ćwiczyć' : 'Ćwicz dalej', onPress: () => {} };

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb', paddingTop: insets.top }}>
        <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 132 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className={accent?.bgSoft}
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 22,
            borderBottomLeftRadius: 26,
            borderBottomRightRadius: 26,
          }}
        >
          <Pressable onPress={goToSection} hitSlop={8} className="mb-3.5">
            <Text style={{ color: '#6b74a8' }} className="font-semibold text-[13px]" numberOfLines={1}>
              ‹ {detail?.sectionTitle ?? 'Wróć'}
            </Text>
          </Pressable>

          <Text className="text-infiro-navy font-extrabold text-[24px] leading-[28px]">
            {detail?.title ?? ''}
          </Text>
          {detail?.description && (
            <Text style={{ color: '#5a6392' }} className="font-medium text-[13px] leading-[19px] mt-2.5">
              {detail.description}
            </Text>
          )}

          <View
            style={{
              height: 8,
              borderRadius: 100,
              backgroundColor: 'rgba(20,34,132,0.1)',
              overflow: 'hidden',
              marginTop: 18,
            }}
          >
            <View className={accent?.bg} style={{ height: 8, borderRadius: 100, width: `${pct}%` }} />
          </View>
          <View className="flex-row items-center justify-between" style={{ marginTop: 9 }}>
            <Text style={{ color: '#5a6392' }} className="font-semibold text-xs">
              {pluralize(total, 'zadanie', 'zadania', 'zadań')}
            </Text>
            <Text className="text-infiro-navy font-extrabold text-[13px]">
              {solved} / {total}
            </Text>
          </View>
        </View>

        <View className="px-5" style={{ marginTop: 22 }}>
          <Text
            style={{ color: '#8b93bd', letterSpacing: 1.4 }}
            className="font-bold text-[12px] uppercase mb-3.5"
          >
            Zadania
          </Text>

          <View style={{ gap: 10 }}>
            {tasks.map((task) => {
              const isDone = task.status === 'done';
              const isCurrent = task.status === 'current';
              const isLocked = task.status === 'locked';

              const circleBg = isDone || isCurrent ? accentHex : isLocked ? 'rgba(20,34,132,0.05)' : 'rgba(20,34,132,0.06)';
              const glyphColor = isDone || isCurrent ? '#fefefe' : isLocked ? '#b3b9d6' : '#a7aecd';

              const pillBg = isCurrent ? accentHex : isLocked ? 'rgba(20,34,132,0.04)' : 'rgba(20,34,132,0.06)';
              const pillFg = isCurrent ? '#fefefe' : isDone ? '#6b74a8' : isLocked ? '#b3b9d6' : '#8b93bd';

              return (
                <Pressable
                  key={task.id}
                  disabled={isLocked}
                  onPress={() => {}}
                  className="flex-row items-center bg-infiro-white"
                  style={{
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 15,
                    gap: 13,
                    opacity: isLocked ? 0.6 : 1,
                    borderWidth: isCurrent ? 1.5 : 0,
                    borderColor: isCurrent ? accentHex : 'transparent',
                    shadowColor: '#142284',
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 100,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: circleBg,
                    }}
                  >
                    <StatusGlyph status={task.status} color={glyphColor} />
                  </View>

                  <View className="flex-1">
                    <Text className="text-infiro-navy font-extrabold text-[14px] leading-[18px]">{task.title}</Text>
                    <Text style={{ color: '#8b93bd' }} className="font-semibold text-xs mt-1">
                      {DIFFICULTY_LABEL[task.difficulty]}
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 100,
                      backgroundColor: pillBg,
                    }}
                  >
                    <Text style={{ color: pillFg }} className="font-bold text-[11px]">
                      {STATUS_LABEL[task.status]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {detail && tasks.length === 0 && (
              <Text style={{ color: '#8b93bd' }} className="font-medium text-[13px] text-center mt-6">
                Brak zadań w tej podsekcji.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {detail && tasks.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(244,245,251,0.96)',
            borderTopWidth: 1,
            borderTopColor: '#e8eaf4',
          }}
        >
          <SafeAreaView edges={['bottom']}>
            <View className="px-5" style={{ paddingTop: 12, paddingBottom: 6 }}>
              <Pressable
                onPress={cta.onPress}
                className="flex-row items-center justify-center"
                style={{
                  height: 54,
                  borderRadius: 100,
                  gap: 8,
                  backgroundColor: accentHex,
                  shadowColor: accentHex,
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 6,
                }}
              >
                <Text className="text-infiro-white font-extrabold text-base">{cta.label}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fefefe" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}
