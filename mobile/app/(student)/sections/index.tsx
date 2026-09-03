import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar } from '../../../components/student/BottomTabBar';
import { ErrorState } from '../../../components/student/ErrorState';
import { getAccent } from '../../../lib/levelingTest';
import { pluralize } from '../../../lib/pluralize';
import { SectionSummary, getSections } from '../../../lib/student';

const ACCENT_HEX = ['#ff5f55', '#c873d9', '#f0b67e', '#142284'];

export default function SectionsScreen() {
  const [sections, setSections] = useState<SectionSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
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
  }, [attempt]);

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
        </SafeAreaView>
        <BottomTabBar />
      </View>
    );
  }

  if (!sections) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#142284" />
          </View>
        </SafeAreaView>
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 118 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-infiro-navy font-manrope-extrabold text-[27px] leading-[31px]">Działy tematyczne</Text>
          <Text style={{ color: '#6b74a8' }} className="font-manrope-medium text-[14px] leading-[20px] mt-1 mb-[22px]">
            Wybierz dział, który chcesz dziś poćwiczyć.
          </Text>

          <View style={{ gap: 14 }}>
            {sections.map((section) => {
              const accent = getAccent(section.index);
              const accentHex = ACCENT_HEX[section.index % ACCENT_HEX.length];
              const totalTasks = section.subsections.reduce((sum, s) => sum + s.totalTasks, 0);
              const solvedTasks = section.subsections.reduce((sum, s) => sum + s.solvedTasks, 0);
              const pct = totalTasks > 0 ? Math.round((solvedTasks / totalTasks) * 100) : 0;
              const expanded = expandedId === section.id;

              return (
                <View
                  key={section.id}
                  className={accent.bgSoft}
                  style={{ borderRadius: 20, overflow: 'hidden' }}
                >
                  <View style={{ padding: 18 }}>
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <Pressable
                        onPress={() => router.push(`/(student)/sections/${section.id}`)}
                        className="flex-1 flex-row items-center"
                        style={{ gap: 14 }}
                      >
                        <View
                          className={`items-center justify-center ${accent.bg}`}
                          style={{ width: 40, height: 40, borderRadius: 10 }}
                        >
                          <Text className="text-infiro-white font-manrope-extrabold text-[17px]">{section.index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-infiro-navy font-manrope-extrabold text-[17px] leading-[21px]">
                            {section.title}
                          </Text>
                          <Text style={{ color: '#4a5488' }} className="font-manrope-medium text-xs mt-1">
                            {pluralize(section.subsections.length, 'podsekcja', 'podsekcje', 'podsekcji')} ·{' '}
                            {pluralize(totalTasks, 'zadanie', 'zadania', 'zadań')}
                          </Text>
                        </View>
                        <Text className="text-infiro-navy font-manrope-extrabold text-[17px]">{pct}%</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setExpandedId((prev) => (prev === section.id ? null : section.id))}
                        hitSlop={12}
                        accessibilityLabel={expanded ? 'Zwiń podsekcje' : 'Rozwiń podsekcje'}
                        style={{ padding: 2 }}
                      >
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8b93bd" />
                      </Pressable>
                    </View>

                    <View
                      style={{
                        height: 8,
                        borderRadius: 100,
                        backgroundColor: 'rgba(20,34,132,0.09)',
                        overflow: 'hidden',
                        marginTop: 14,
                      }}
                    >
                      <View className={accent.bg} style={{ height: 8, borderRadius: 100, width: `${pct}%` }} />
                    </View>

                    {expanded && section.description && (
                      <Text style={{ color: '#6b74a8' }} className="font-manrope-medium text-[14px] leading-[20px] mt-3.5">
                        {section.description}
                      </Text>
                    )}
                  </View>

                  {/* Podsekcje -- w tej samej karcie, jasne wiersze rozdzielone
                      cienką linią, zaokrąglenia dziedziczone z kafla. */}
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
                          onPress={() => router.push(`/(student)/subsections/${sub.id}`)}
                          className="flex-row items-center"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.6)',
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(20,34,132,0.07)',
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
                              backgroundColor: full ? accentHex : 'rgba(20,34,132,0.06)',
                            }}
                          >
                            {full ? (
                              <Ionicons name="checkmark" size={15} color="#fefefe" />
                            ) : started ? (
                              <Ionicons name="play" size={11} color="#8b93bd" />
                            ) : (
                              <View style={{ width: 5, height: 5, borderRadius: 100, backgroundColor: '#a7aecd' }} />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-infiro-navy font-manrope-bold text-[13px] leading-[17px]">{sub.title}</Text>
                            <Text style={{ color: '#8b93bd' }} className="font-manrope-medium text-xs mt-0.5">
                              {meta}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#c3c8de" />
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
