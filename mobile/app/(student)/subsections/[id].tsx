import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../../components/Text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '../../../components/student/ErrorState';
import { getEbook } from '../../../lib/ebook';
import { pluralize } from '../../../lib/pluralize';
import { SubsectionDetail, SubsectionTaskStatus, getSubsectionTasks } from '../../../lib/student';
import { topicColor, useTheme, withAlpha } from '../../../lib/theme';

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
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<SubsectionDetail | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [hasEbook, setHasEbook] = useState(false);

  useEffect(() => {
    let active = true;
    getEbook(Number(id))
      .then((data) => {
        if (active) setHasEbook(data !== null);
      })
      .catch(() => {
        if (active) setHasEbook(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useFocusEffect(
    useCallback(() => {
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
    }, [id, attempt])
  );

  const color = detail ? topicColor(theme, detail.sectionIndex) : theme.accent;
  const tasks = detail?.tasks ?? [];
  const total = tasks.length;
  const solved = tasks.filter((t) => t.status === 'done').length;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const finished = total > 0 && solved >= total;

  const goToSection = () => {
    if (detail) router.dismissTo(`/(student)/sections/${detail.sectionId}`);
    else router.back();
  };

  const currentTask =
    tasks.find((t) => t.status === 'current') ?? tasks.find((t) => t.status === 'todo') ?? tasks[0];

  const openTask = (task: { id: number; position: number }) =>
    router.push({
      pathname: '/(student)/tasks/[id]',
      params: {
        id: String(task.id),
        position: String(task.position),
        total: String(tasks.length),
        sectionTitle: detail?.sectionTitle ?? '',
        sectionIndex: String(detail?.sectionIndex ?? 0),
      },
    });

  const cta: { label: string; onPress: () => void } = finished
    ? detail?.nextSubsectionId != null
      ? {
          label: 'Dalej',
          onPress: () => router.replace(`/(student)/subsections/${detail.nextSubsectionId}`),
        }
      : { label: 'Wróć do działu', onPress: goToSection }
    : {
        label: solved === 0 ? 'Zacznij ćwiczyć' : 'Ćwicz dalej',
        onPress: () => {
          if (currentTask) openTask(currentTask);
        },
      };

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.bg, paddingTop: insets.top }}>
        <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.bg, paddingTop: insets.top }}
      >
        <ActivityIndicator color={theme.textPrimary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 132 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: withAlpha(color, 0.12),
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 22,
            borderBottomLeftRadius: 26,
            borderBottomRightRadius: 26,
          }}
        >
          <Pressable onPress={goToSection} hitSlop={8} className="mb-3.5">
            <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-[14px]" numberOfLines={1}>
              ‹ {detail?.sectionTitle ?? 'Wróć'}
            </Text>
          </Pressable>

          <Text
            className="text-[24px] leading-[28px]"
            style={{ color: theme.textPrimary, fontFamily: theme.headingFontFamily }}
          >
            {detail?.title ?? ''}
          </Text>
          {detail?.description && (
            <Text
              style={{ color: theme.textSecondary }}
              className="font-manrope-medium text-[14px] leading-[20px] mt-2.5"
            >
              {detail.description}
            </Text>
          )}

          <View
            style={{
              height: 8,
              borderRadius: 100,
              backgroundColor: withAlpha(theme.textPrimary, 0.1),
              overflow: 'hidden',
              marginTop: 18,
            }}
          >
            <View style={{ height: 8, borderRadius: 100, width: `${pct}%`, backgroundColor: color }} />
          </View>
          <View className="flex-row items-center justify-between" style={{ marginTop: 9 }}>
            <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-xs">
              {pluralize(total, 'zadanie', 'zadania', 'zadań')}
            </Text>
            <Text className="font-manrope-extrabold text-[13px]" style={{ color: theme.textPrimary }}>
              {solved} / {total}
            </Text>
          </View>
        </View>

        {(hasEbook || tasks.length > 0) && (
          <View className="px-5" style={{ marginTop: 18, gap: 10 }}>
            {hasEbook && (
              <Pressable
                onPress={() => router.push(`/(student)/ebooks/${detail.id}`)}
                className="flex-row items-center"
                style={{
                  borderRadius: 16,
                  padding: 14,
                  gap: 12,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.surfaceBorder,
                  shadowColor: theme.textPrimary,
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                }}
              >
                <View
                  className="items-center justify-center"
                  style={{ width: 34, height: 34, borderRadius: 100, backgroundColor: withAlpha(theme.textPrimary, 0.06) }}
                >
                  <Ionicons name="book-outline" size={18} color={color} />
                </View>
                <View className="flex-1">
                  <Text className="font-manrope-extrabold text-[14px]" style={{ color: theme.textPrimary }}>
                    Teoria
                  </Text>
                  <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-xs mt-0.5">
                    Przeczytaj przed ćwiczeniem
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>
            )}

            {tasks.length > 0 && (
              <Pressable
                onPress={() => router.push(`/(student)/timed/${detail.id}`)}
                className="flex-row items-center"
                style={{
                  borderRadius: 16,
                  padding: 14,
                  gap: 12,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.surfaceBorder,
                  shadowColor: theme.textPrimary,
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                }}
              >
                <View
                  className="items-center justify-center"
                  style={{ width: 34, height: 34, borderRadius: 100, backgroundColor: withAlpha(theme.textPrimary, 0.06) }}
                >
                  <Ionicons name="timer-outline" size={18} color={color} />
                </View>
                <View className="flex-1">
                  <Text className="font-manrope-extrabold text-[14px]" style={{ color: theme.textPrimary }}>
                    Ćwicz na czas
                  </Text>
                  <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-xs mt-0.5">
                    60 sekund, zadania ABC z tej podsekcji
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        )}

        <View className="px-5" style={{ marginTop: 22 }}>
          <Text
            style={{ color: theme.textSecondary, letterSpacing: 1.4 }}
            className="font-manrope-bold text-[12px] uppercase mb-3.5"
          >
            Zadania
          </Text>

          <View style={{ gap: 10 }}>
            {tasks.map((task) => {
              const isDone = task.status === 'done';
              const isCurrent = task.status === 'current';
              const isLocked = task.status === 'locked';

              const circleBg = isDone || isCurrent ? color : withAlpha(theme.textPrimary, isLocked ? 0.05 : 0.06);
              const glyphColor = isDone || isCurrent ? theme.accentInk : theme.textSecondary;

              const pillBg = isCurrent ? color : withAlpha(theme.textPrimary, isLocked ? 0.04 : 0.06);
              const pillFg = isCurrent ? theme.accentInk : theme.textSecondary;

              return (
                <Pressable
                  key={task.id}
                  disabled={isLocked}
                  onPress={() => openTask(task)}
                  className="flex-row items-center"
                  style={{
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 15,
                    gap: 13,
                    opacity: isLocked ? 0.6 : 1,
                    backgroundColor: theme.surface,
                    borderWidth: isCurrent ? 1.5 : 1,
                    borderColor: isCurrent ? color : theme.surfaceBorder,
                    shadowColor: theme.textPrimary,
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
                    <Text
                      className="font-manrope-extrabold text-[14px] leading-[18px]"
                      style={{ color: theme.textPrimary }}
                    >
                      Zadanie {task.position}
                    </Text>
                    <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-xs mt-1">
                      {task.difficulty ? DIFFICULTY_LABEL[task.difficulty] : 'Ćwiczenie pamięciowe'}
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
                    <Text style={{ color: pillFg }} className="font-manrope-bold text-[11px]">
                      {STATUS_LABEL[task.status]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {detail && tasks.length === 0 && (
              <Text style={{ color: theme.textSecondary }} className="font-manrope-medium text-[13px] text-center mt-6">
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
            backgroundColor: withAlpha(theme.bg, 0.96),
            borderTopWidth: 1,
            borderTopColor: theme.surfaceBorder,
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
                  backgroundColor: color,
                  shadowColor: color,
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 6,
                }}
              >
                <Text className="font-manrope-extrabold text-base" style={{ color: theme.accentInk }}>
                  {cta.label}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={theme.accentInk} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}
