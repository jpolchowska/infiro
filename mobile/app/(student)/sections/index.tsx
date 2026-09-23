import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar } from '../../../components/student/BottomTabBar';
import { ErrorState } from '../../../components/student/ErrorState';
import { pluralize } from '../../../lib/pluralize';
import { SectionSummary, getSections } from '../../../lib/student';
import { topicColor, useTheme, withAlpha } from '../../../lib/theme';

export default function SectionsScreen() {
  const theme = useTheme();
  const [sections, setSections] = useState<SectionSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(false);
      getSections()
        .then((data) => {
          if (active) setSections(data);
        })
        .catch((err) => {
          console.warn('Failed to load sections:', err);
          if (active) setError(true);
        });
      return () => {
        active = false;
      };
    }, [attempt])
  );

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.bg }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
        </SafeAreaView>
        <BottomTabBar />
      </View>
    );
  }

  if (!sections) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.bg }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={theme.textPrimary} />
          </View>
        </SafeAreaView>
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 118 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="text-[27px] leading-[31px]"
            style={{ color: theme.textPrimary, fontFamily: theme.headingFontFamily }}
          >
            Działy tematyczne
          </Text>
          <Text style={{ color: theme.textSecondary }} className="font-manrope-medium text-[14px] leading-[20px] mt-1 mb-[22px]">
            Wybierz dział, który chcesz dziś poćwiczyć.
          </Text>

          <View style={{ gap: 14 }}>
            {sections.map((section) => {
              const color = topicColor(theme, section.index);
              const totalTasks = section.subsections.reduce((sum, s) => sum + s.totalTasks, 0);
              const solvedTasks = section.subsections.reduce((sum, s) => sum + s.solvedTasks, 0);
              const pct = totalTasks > 0 ? Math.round((solvedTasks / totalTasks) * 100) : 0;
              const expanded = expandedId === section.id;

              return (
                <View
                  key={section.id}
                  style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: withAlpha(color, 0.12) }}
                >
                  <View style={{ padding: 18 }}>
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <Pressable
                        onPress={() => router.push(`/(student)/sections/${section.id}`)}
                        className="flex-1 flex-row items-center"
                        style={{ gap: 14 }}
                      >
                        <View
                          className="items-center justify-center"
                          style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color }}
                        >
                          <Text className="font-manrope-extrabold text-[17px]" style={{ color: theme.accentInk }}>
                            {section.index + 1}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="font-manrope-extrabold text-[17px] leading-[21px]"
                            style={{ color: theme.textPrimary }}
                          >
                            {section.title}
                          </Text>
                          <Text style={{ color: theme.textSecondary }} className="font-manrope-medium text-xs mt-1">
                            {pluralize(section.subsections.length, 'podsekcja', 'podsekcje', 'podsekcji')} ·{' '}
                            {pluralize(totalTasks, 'zadanie', 'zadania', 'zadań')}
                          </Text>
                        </View>
                        <Text className="font-manrope-extrabold text-[17px]" style={{ color: theme.textPrimary }}>
                          {pct}%
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setExpandedId((prev) => (prev === section.id ? null : section.id))}
                        hitSlop={12}
                        accessibilityLabel={expanded ? 'Zwiń podsekcje' : 'Rozwiń podsekcje'}
                        style={{ padding: 2 }}
                      >
                        <Ionicons
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={theme.textSecondary}
                        />
                      </Pressable>
                    </View>

                    <View
                      style={{
                        height: 8,
                        borderRadius: 100,
                        backgroundColor: withAlpha(theme.textPrimary, 0.09),
                        overflow: 'hidden',
                        marginTop: 14,
                      }}
                    >
                      <View style={{ height: 8, borderRadius: 100, width: `${pct}%`, backgroundColor: color }} />
                    </View>

                    {expanded && section.description && (
                      <Text
                        style={{ color: theme.textSecondary }}
                        className="font-manrope-medium text-[14px] leading-[20px] mt-3.5"
                      >
                        {section.description}
                      </Text>
                    )}
                  </View>

                  {expanded &&
                    section.subsections.map((sub) => {
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
                          onPress={() => {
                            router.push(`/(student)/sections/${section.id}`);
                            router.push(`/(student)/subsections/${sub.id}`);
                          }}
                          className="flex-row items-center"
                          style={{
                            backgroundColor: withAlpha(theme.surface, 0.6),
                            borderTopWidth: 1,
                            borderTopColor: theme.surfaceBorder,
                            paddingHorizontal: 18,
                            paddingVertical: 15,
                            gap: 13,
                          }}
                        >
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 100,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: full ? color : withAlpha(theme.textPrimary, 0.06),
                            }}
                          >
                            {full ? (
                              <Ionicons name="checkmark" size={15} color={theme.accentInk} />
                            ) : started ? (
                              <Ionicons name="play" size={11} color={theme.textSecondary} />
                            ) : (
                              <View
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 100,
                                  backgroundColor: theme.textSecondary,
                                }}
                              />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text
                              className="font-manrope-bold text-[13px] leading-[17px]"
                              style={{ color: theme.textPrimary }}
                            >
                              {sub.title}
                            </Text>
                            <Text style={{ color: theme.textSecondary }} className="font-manrope-medium text-xs mt-0.5">
                              {meta}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                        </Pressable>
                      );
                    })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}
