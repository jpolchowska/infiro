import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar } from '../../components/student/BottomTabBar';
import { ErrorState } from '../../components/student/ErrorState';
import { formatShortDate } from '../../lib/formatDate';
import { getAccent } from '../../lib/levelingTest';
import { DashboardStats, StudentMe, getMe, getStats } from '../../lib/student';

export default function HomeScreen() {
  const [me, setMe] = useState<StudentMe | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    Promise.all([getMe(), getStats()])
      .then(([meData, statsData]) => {
        if (active) {
          setMe(meData);
          setStats(statsData);
        }
      })
      .catch((err) => {
        console.warn('Failed to load dashboard:', err);
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

  const loading = !me || !stats;

  const name = me?.name ?? null;
  const initial = name ? name.slice(0, 1).toUpperCase() : null;
  const current = stats?.current ?? null;
  const currentAccent = current ? getAccent(current.sectionIndex) : null;
  const currentPct =
    current && current.totalTasks > 0
      ? Math.round((current.solvedTasks / current.totalTasks) * 100)
      : 0;
  const recent = stats?.recentSections ?? [];
  const hasActivity = !!current || (stats?.solvedTasks ?? 0) > 0 || recent.length > 0;

  return (
    <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#142284" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 118 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-center justify-between mb-[22px]">
              <Text className="text-infiro-navy font-extrabold text-[27px] leading-[31px]">
                {name ? `Cześć, ${name}!` : 'Cześć!'}
              </Text>
              <Pressable
                onPress={() => router.replace('/(student)/profile')}
                className="items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: '#eceffa',
                  borderWidth: 1,
                  borderColor: 'rgba(20,34,132,0.12)',
                }}
              >
                {initial ? (
                  <Text className="text-infiro-navy font-bold text-[15px]">{initial}</Text>
                ) : (
                  <Ionicons name="person" size={18} color="#142284" />
                )}
              </Pressable>
            </View>

            {current && currentAccent && (
              <View className="bg-infiro-navy" style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}>
                <Text
                  style={{ color: '#8f9adf', letterSpacing: 1.4 }}
                  className="font-bold text-[12px] uppercase mb-2.5"
                >
                  W trakcie
                </Text>
                <Text className="text-infiro-white font-extrabold text-[22px] leading-[26px]">
                  {current.subsectionTitle}
                </Text>
                <Text style={{ color: '#b6bdec' }} className="font-medium text-[13px] mt-1.5">
                  {current.sectionTitle} · {current.solvedTasks} z {current.totalTasks} zadań
                </Text>
                <View
                  style={{
                    height: 8,
                    borderRadius: 100,
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    overflow: 'hidden',
                    marginTop: 16,
                    marginBottom: 18,
                  }}
                >
                  <View
                    className={currentAccent.bg}
                    style={{ height: 8, borderRadius: 100, width: `${currentPct}%` }}
                  />
                </View>
                <Pressable
                  onPress={() => router.push(`/(student)/subsections/${current.subsectionId}`)}
                  className="items-center justify-center"
                  style={{ height: 54, borderRadius: 100, backgroundColor: '#ff5f55' }}
                >
                  <Text className="text-infiro-white font-extrabold text-base">Rozwiązuj dalej</Text>
                </Pressable>
              </View>
            )}

            {hasActivity ? (
              <View className="flex-row mb-[22px]" style={{ gap: 10 }}>
                <StatTile value={stats!.solvedTasks} label="zrobionych zadań" />
                <StatTile
                  value={stats!.accuracy !== null ? `${stats!.accuracy}%` : '—'}
                  label="dobrych odpowiedzi"
                />
                <StatTile value={stats!.startedSections} label="rozpoczęte działy" />
              </View>
            ) : (
              <View className="bg-infiro-navy" style={{ borderRadius: 20, padding: 22, marginBottom: 22 }}>
                <View
                  className="items-center justify-center mb-3.5"
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)' }}
                >
                  <Ionicons name="sparkles" size={22} color="#fefefe" />
                </View>
                <Text className="text-infiro-white font-extrabold text-[20px] leading-[25px]">
                  Zacznij naukę
                </Text>
                <Text style={{ color: '#b6bdec' }} className="font-medium text-[13px] leading-[19px] mt-1.5">
                  Wybierz dział i rozwiąż pierwsze zadania — Twoje postępy pojawią się tutaj.
                </Text>
                <Pressable
                  onPress={() => router.replace('/(student)/sections')}
                  className="items-center justify-center"
                  style={{ height: 52, borderRadius: 100, backgroundColor: '#ff5f55', marginTop: 18 }}
                >
                  <Text className="text-infiro-white font-extrabold text-base">Przejdź do nauki</Text>
                </Pressable>
              </View>
            )}

            <Text
              style={{ color: '#8b93bd', letterSpacing: 1.4 }}
              className="font-bold text-[12px] uppercase mb-3"
            >
              Test poziomujący
            </Text>
            <Pressable
              onPress={() => router.replace('/(student)/profile')}
              className="flex-row items-center"
              style={{
                backgroundColor: '#fefefe',
                borderRadius: 17,
                padding: 16,
                paddingHorizontal: 18,
                marginBottom: 22,
                gap: 14,
              }}
            >
              <View
                className="items-center justify-center"
                style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eceffa' }}
              >
                <Text className="text-infiro-navy font-extrabold text-[13px]">
                  {stats!.lastLevelingTest
                    ? `${stats!.lastLevelingTest.score}/${stats!.lastLevelingTest.total}`
                    : '—'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-infiro-navy font-extrabold text-[15px]">
                  {stats!.lastLevelingTest
                    ? `Ostatni test: ${formatShortDate(stats!.lastLevelingTest.completedAt)}`
                    : 'Jeszcze nie rozwiązany'}
                </Text>
                <Text style={{ color: '#8b93bd' }} className="font-semibold text-xs mt-0.5">
                  Zobacz historię wyników
                </Text>
              </View>
              <Text style={{ color: '#b3b9d6' }} className="font-bold text-base">
                ›
              </Text>
            </Pressable>

            {recent.length > 0 && (
              <>
                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    style={{ color: '#8b93bd', letterSpacing: 1.4 }}
                    className="font-bold text-[12px] uppercase"
                  >
                    Ostatnio ćwiczone
                  </Text>
                  <Pressable onPress={() => router.replace('/(student)/sections')}>
                    <Text className="text-infiro-coral font-bold text-xs">Wszystkie działy</Text>
                  </Pressable>
                </View>

                <View style={{ gap: 12 }}>
                  {recent.map((section) => {
                    const accent = getAccent(section.sectionIndex);
                    const pct =
                      section.totalTasks > 0
                        ? Math.round((section.solvedTasks / section.totalTasks) * 100)
                        : 0;
                    return (
                      <Pressable
                        key={section.sectionId}
                        onPress={() => router.replace('/(student)/sections')}
                        className={`flex-row items-center ${accent.bgSoft}`}
                        style={{ borderRadius: 17, padding: 16, paddingHorizontal: 18, gap: 14 }}
                      >
                        <View className="flex-1">
                          <Text className="text-infiro-navy font-extrabold text-[15px] leading-[19px]">
                            {section.sectionTitle}
                          </Text>
                          <Text style={{ color: '#6b74a8' }} className="font-semibold text-xs mt-1">
                            {section.solvedTasks} z {section.totalTasks} zadań
                          </Text>
                          <View
                            style={{
                              height: 7,
                              borderRadius: 100,
                              backgroundColor: 'rgba(20,34,132,0.09)',
                              overflow: 'hidden',
                              marginTop: 12,
                            }}
                          >
                            <View
                              className={accent.bg}
                              style={{ height: 7, borderRadius: 100, width: `${pct}%` }}
                            />
                          </View>
                        </View>
                        <Text className="text-infiro-navy font-extrabold text-[17px]">{pct}%</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: '#fefefe',
        borderRadius: 15,
        padding: 16,
        shadowColor: '#142284',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <Text className="text-infiro-navy font-extrabold text-[24px]">{value}</Text>
      <Text style={{ color: '#8b93bd' }} className="font-semibold text-xs mt-1.5">
        {label}
      </Text>
    </View>
  );
}
