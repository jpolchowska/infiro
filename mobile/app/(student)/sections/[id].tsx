import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '../../../components/student/ErrorState';
import { getAccent } from '../../../lib/levelingTest';
import { pluralize } from '../../../lib/pluralize';
import { SectionSummary, getSections } from '../../../lib/student';

const ACCENT_HEX = ['#ff5f55', '#c873d9', '#f0b67e', '#142284'];

export default function SectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<SectionSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
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
  }, [attempt]);

  const section = sections?.find((s) => s.id === Number(id)) ?? null;
  const accent = section ? getAccent(section.index) : null;
  const accentHex = section ? ACCENT_HEX[section.index % ACCENT_HEX.length] : '#142284';
  const totalTasks = section ? section.subsections.reduce((sum, s) => sum + s.totalTasks, 0) : 0;
  const solvedTasks = section ? section.subsections.reduce((sum, s) => sum + s.solvedTasks, 0) : 0;
  const pct = totalTasks > 0 ? Math.round((solvedTasks / totalTasks) * 100) : 0;
  const doneCount = section
    ? section.subsections.filter((s) => s.totalTasks > 0 && s.solvedTasks === s.totalTasks).length
    : 0;

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb', paddingTop: insets.top }}>
        <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
      </View>
    );
  }

  if (!sections) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: '#f4f5fb', paddingTop: insets.top }}
      >
        <ActivityIndicator color="#142284" />
      </View>
    );
  }

  if (!section) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb', paddingTop: insets.top + 8 }}>
        <Pressable onPress={() => router.dismissTo('/(student)/sections')} hitSlop={8} className="px-5">
          <Text style={{ color: '#6b74a8' }} className="font-manrope-semibold text-[14px]">
            ‹ Działy tematyczne
          </Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-infiro-navy font-manrope-extrabold text-lg text-center mb-2">
            Nie znaleziono działu
          </Text>
          <Text style={{ color: '#8b93bd' }} className="font-manrope-medium text-[13px] text-center">
            Ten dział mógł zostać usunięty albo link jest nieaktualny.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 44 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Delikatny nagłówek w miękkim odcieniu działu -- ten sam odcień, co
            karty na liście działów, z której tu wchodzimy. */}
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
          <Pressable onPress={() => router.dismissTo('/(student)/sections')} hitSlop={8} className="mb-3.5">
            <Text style={{ color: '#6b74a8' }} className="font-manrope-semibold text-[14px]">
              ‹ Działy tematyczne
            </Text>
          </Pressable>

          {section && (
            <>
              <View className="flex-row items-center" style={{ gap: 13 }}>
                <View
                  className={`items-center justify-center ${accent?.bg}`}
                  style={{ width: 42, height: 42, borderRadius: 12 }}
                >
                  <Text className="text-infiro-white font-manrope-extrabold text-[17px]">{section.index + 1}</Text>
                </View>
                <Text className="flex-1 text-infiro-navy font-manrope-extrabold text-[24px] leading-[28px]">
                  {section.title}
                </Text>
              </View>

              {section.description && (
                <Text style={{ color: '#5a6392' }} className="font-manrope-medium text-[14px] leading-[20px] mt-2.5">
                  {section.description}
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
                <Text style={{ color: '#5a6392' }} className="font-manrope-semibold text-xs">
                  {pluralize(section.subsections.length, 'podsekcja', 'podsekcje', 'podsekcji')} ·{' '}
                  {pluralize(totalTasks, 'zadanie', 'zadania', 'zadań')}
                </Text>
                <Text className="text-infiro-navy font-manrope-extrabold text-[13px]">{pct}%</Text>
              </View>
            </>
          )}
        </View>

        {section && (
          <View className="px-5" style={{ marginTop: 22 }}>
            <View className="flex-row items-center justify-between mb-3.5">
              <Text style={{ color: '#8b93bd', letterSpacing: 1.4 }} className="font-manrope-bold text-[12px] uppercase">
                Podsekcje
              </Text>
              <Text style={{ color: '#8b93bd' }} className="font-manrope-semibold text-xs">
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
                    className="flex-row items-start bg-infiro-white"
                    style={{
                      borderRadius: 18,
                      padding: 16,
                      gap: 13,
                      shadowColor: '#142284',
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
                      <Text className="text-infiro-navy font-manrope-extrabold text-[15px] leading-[19px]">{sub.title}</Text>
                      {sub.description && (
                        <Text
                          style={{ color: '#6b74a8' }}
                          className="font-manrope-medium text-[14px] leading-[20px] mt-1"
                        >
                          {sub.description}
                        </Text>
                      )}
                      <Text style={{ color: '#8b93bd' }} className="font-manrope-semibold text-xs mt-2">
                        {meta}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#c3c8de" style={{ marginTop: 6 }} />
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
