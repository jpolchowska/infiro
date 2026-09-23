import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '../../../components/student/ErrorState';
import { pluralize } from '../../../lib/pluralize';
import { SectionSummary, getSections } from '../../../lib/student';
import { topicColor, useTheme, withAlpha } from '../../../lib/theme';

export default function SectionDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<SectionSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(false);
      getSections()
        .then((data) => {
          if (active) setSections(data);
        })
        .catch((err) => {
          console.warn('Failed to load section:', err);
          if (active) setError(true);
        });
      return () => {
        active = false;
      };
    }, [attempt])
  );

  const section = sections?.find((s) => s.id === Number(id)) ?? null;
  const color = section ? topicColor(theme, section.index) : theme.accent;
  const totalTasks = section ? section.subsections.reduce((sum, s) => sum + s.totalTasks, 0) : 0;
  const solvedTasks = section ? section.subsections.reduce((sum, s) => sum + s.solvedTasks, 0) : 0;
  const pct = totalTasks > 0 ? Math.round((solvedTasks / totalTasks) * 100) : 0;
  const doneCount = section
    ? section.subsections.filter((s) => s.totalTasks > 0 && s.solvedTasks === s.totalTasks).length
    : 0;

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.bg, paddingTop: insets.top }}>
        <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
      </View>
    );
  }

  if (!sections) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.bg, paddingTop: insets.top }}
      >
        <ActivityIndicator color={theme.textPrimary} />
      </View>
    );
  }

  if (!section) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.bg, paddingTop: insets.top + 8 }}>
        <Pressable onPress={() => router.dismissTo('/(student)/sections')} hitSlop={8} className="px-5">
          <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-[14px]">
            ‹ Działy tematyczne
          </Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className="font-manrope-extrabold text-lg text-center mb-2"
            style={{ color: theme.textPrimary }}
          >
            Nie znaleziono działu
          </Text>
          <Text style={{ color: theme.textSecondary }} className="font-manrope-medium text-[13px] text-center">
            Ten dział mógł zostać usunięty albo link jest nieaktualny.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 44 }}
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
          <Pressable onPress={() => router.dismissTo('/(student)/sections')} hitSlop={8} className="mb-3.5">
            <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-[14px]">
              ‹ Działy tematyczne
            </Text>
          </Pressable>

          {section && (
            <>
              <View className="flex-row items-center" style={{ gap: 13 }}>
                <View
                  className="items-center justify-center"
                  style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: color }}
                >
                  <Text className="font-manrope-extrabold text-[17px]" style={{ color: theme.accentInk }}>
                    {section.index + 1}
                  </Text>
                </View>
                <Text
                  className="flex-1 text-[24px] leading-[28px]"
                  style={{ color: theme.textPrimary, fontFamily: theme.headingFontFamily }}
                >
                  {section.title}
                </Text>
              </View>

              {section.description && (
                <Text
                  style={{ color: theme.textSecondary }}
                  className="font-manrope-medium text-[14px] leading-[20px] mt-2.5"
                >
                  {section.description}
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
                  {pluralize(section.subsections.length, 'podsekcja', 'podsekcje', 'podsekcji')} ·{' '}
                  {pluralize(totalTasks, 'zadanie', 'zadania', 'zadań')}
                </Text>
                <Text className="font-manrope-extrabold text-[13px]" style={{ color: theme.textPrimary }}>
                  {pct}%
                </Text>
              </View>
            </>
          )}
        </View>

        {section && (
          <View className="px-5" style={{ marginTop: 22 }}>
            <View className="flex-row items-center justify-between mb-3.5">
              <Text
                style={{ color: theme.textSecondary, letterSpacing: 1.4 }}
                className="font-manrope-bold text-[12px] uppercase"
              >
                Podsekcje
              </Text>
              <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-xs">
                {doneCount} z {section.subsections.length} ukończonych
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {section.subsections.map((sub) => {
                const full = sub.totalTasks > 0 && sub.solvedTasks === sub.totalTasks;
                const started = sub.solvedTasks > 0 && !full;
                const meta = full
                  ? `Ukończone · ${pluralize(sub.totalTasks, 'zadanie', 'zadania', 'zadań')}`
                  : started
                    ? `${sub.solvedTasks} z ${sub.totalTasks} zadań`
                    : pluralize(sub.totalTasks, 'zadanie', 'zadania', 'zadań');

                return (
                  <Pressable
                    key={sub.id}
                    onPress={() => router.push(`/(student)/subsections/${sub.id}`)}
                    className="flex-row items-start"
                    style={{
                      borderRadius: 18,
                      padding: 16,
                      gap: 13,
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.surfaceBorder,
                      shadowColor: theme.textPrimary,
                      shadowOpacity: 0.07,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 3,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 100,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                        backgroundColor: full ? color : withAlpha(theme.textPrimary, 0.06),
                      }}
                    >
                      {full ? (
                        <Ionicons name="checkmark" size={15} color={theme.accentInk} />
                      ) : started ? (
                        <Ionicons name="play" size={11} color={theme.textSecondary} />
                      ) : (
                        <View
                          style={{ width: 5, height: 5, borderRadius: 100, backgroundColor: theme.textSecondary }}
                        />
                      )}
                    </View>

                    <View className="flex-1">
                      <Text
                        className="font-manrope-extrabold text-[15px] leading-[19px]"
                        style={{ color: theme.textPrimary }}
                      >
                        {sub.title}
                      </Text>
                      {sub.description && (
                        <Text
                          style={{ color: theme.textSecondary }}
                          className="font-manrope-medium text-[14px] leading-[20px] mt-1"
                        >
                          {sub.description}
                        </Text>
                      )}
                      <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-xs mt-2">
                        {meta}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginTop: 6 }} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
