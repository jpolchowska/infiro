import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar } from '../../components/student/BottomTabBar';
import { ErrorState } from '../../components/student/ErrorState';
import { formatShortDate } from '../../lib/formatDate';
import { DashboardStats, StudentMe, getMe, getStats } from '../../lib/student';
import { ThemeTokens, topicColor, useTheme, withAlpha } from '../../lib/theme';

export default function HomeScreen() {
  const theme = useTheme();
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
      <View className="flex-1" style={{ backgroundColor: theme.bg }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
        </SafeAreaView>
        <BottomTabBar />
      </View>
    );
  }

  const loading = !me || !stats;

  const name = me?.name ?? null;
  const current = stats?.current ?? null;
  const currentColor = current ? topicColor(theme, current.sectionIndex) : theme.accent;
  const currentPct =
    current && current.totalTasks > 0
      ? Math.round((current.solvedTasks / current.totalTasks) * 100)
      : 0;
  const recent = stats?.recentSections ?? [];
  const hasActivity = !!current || (stats?.solvedTasks ?? 0) > 0 || recent.length > 0;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={theme.textPrimary} />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 118 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-[22px]">
              <Text
                className="text-[27px] leading-[31px]"
                style={{ color: theme.textPrimary, fontFamily: theme.headingFontFamily }}
              >
                {name ? `Cześć, ${name}!` : 'Cześć!'}
              </Text>
            </View>

            {current && (
              <LinearGradient
                colors={[theme.heroFrom, theme.heroTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}
              >
                <Text
                  style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: 1.4 }}
                  className="font-manrope-bold text-[12px] uppercase mb-2.5"
                >
                  W trakcie
                </Text>
                <Text
                  className="text-[22px] leading-[26px]"
                  style={{ color: '#fefefe', fontFamily: theme.headingFontFamily }}
                >
                  {current.subsectionTitle}
                </Text>
                <Text
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                  className="font-manrope-medium text-[13px] mt-1.5"
                >
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
                    style={{
                      height: 8,
                      borderRadius: 100,
                      width: `${currentPct}%`,
                      backgroundColor: currentColor,
                    }}
                  />
                </View>
                <Pressable
                  onPress={() => router.push(`/(student)/subsections/${current.subsectionId}`)}
                  className="items-center justify-center"
                  style={{ height: 54, borderRadius: 100, backgroundColor: theme.accent }}
                >
                  <Text className="font-manrope-extrabold text-base" style={{ color: theme.accentInk }}>
                    Rozwiązuj dalej
                  </Text>
                </Pressable>
              </LinearGradient>
            )}

            {hasActivity ? (
              <View className="flex-row mb-[22px]" style={{ gap: 10 }}>
                <StatTile theme={theme} value={stats!.solvedTasks} label="zrobionych zadań" />
                <StatTile
                  theme={theme}
                  value={stats!.accuracy !== null ? `${stats!.accuracy}%` : '—'}
                  label="dobrych odpowiedzi"
                />
                <StatTile theme={theme} value={stats!.startedSections} label="rozpoczęte działy" />
              </View>
            ) : (
              <LinearGradient
                colors={[theme.heroFrom, theme.heroTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 22, marginBottom: 22 }}
              >
                <View
                  className="items-center justify-center mb-3.5"
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' }}
                >
                  <Ionicons name="sparkles" size={22} color="#fefefe" />
                </View>
                <Text
                  className="text-[20px] leading-[25px]"
                  style={{ color: '#fefefe', fontFamily: theme.headingFontFamily }}
                >
                  Zacznij naukę
                </Text>
                <Text
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                  className="font-manrope-medium text-[13px] leading-[19px] mt-1.5"
                >
                  Wybierz dział i rozwiąż pierwsze zadania — Twoje postępy pojawią się tutaj.
                </Text>
                <Pressable
                  onPress={() => router.replace('/(student)/sections')}
                  className="items-center justify-center"
                  style={{ height: 52, borderRadius: 100, backgroundColor: theme.accent, marginTop: 18 }}
                >
                  <Text className="font-manrope-extrabold text-base" style={{ color: theme.accentInk }}>
                    Przejdź do nauki
                  </Text>
                </Pressable>
              </LinearGradient>
            )}

            <Text
              style={{ color: theme.textSecondary, letterSpacing: 1.4 }}
              className="font-manrope-bold text-[12px] uppercase mb-3"
            >
              Test poziomujący
            </Text>
            <Pressable
              onPress={() => router.replace('/(student)/profile')}
              className="flex-row items-center"
              style={{
                backgroundColor: theme.surface,
                borderRadius: 17,
                padding: 16,
                paddingHorizontal: 18,
                marginBottom: 22,
                gap: 14,
                borderWidth: 1,
                borderColor: theme.surfaceBorder,
              }}
            >
              <View
                className="items-center justify-center"
                style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.surfaceMuted }}
              >
                <Text className="font-manrope-extrabold text-[13px]" style={{ color: theme.textPrimary }}>
                  {stats!.lastLevelingTest
                    ? `${stats!.lastLevelingTest.score}/${stats!.lastLevelingTest.total}`
                    : '—'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-manrope-extrabold text-[15px]" style={{ color: theme.textPrimary }}>
                  {stats!.lastLevelingTest
                    ? `Ostatni test: ${formatShortDate(stats!.lastLevelingTest.completedAt)}`
                    : 'Jeszcze nie rozwiązany'}
                </Text>
                <Text
                  style={{ color: theme.textSecondary }}
                  className="font-manrope-semibold text-xs mt-0.5"
                >
                  Zobacz historię wyników
                </Text>
              </View>
              <Text style={{ color: theme.textSecondary }} className="font-manrope-bold text-base">
                ›
              </Text>
            </Pressable>

            {recent.length > 0 && (
              <>
                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    style={{ color: theme.textSecondary, letterSpacing: 1.4 }}
                    className="font-manrope-bold text-[12px] uppercase"
                  >
                    Ostatnio ćwiczone
                  </Text>
                  <Pressable onPress={() => router.replace('/(student)/sections')}>
                    <Text className="font-manrope-bold text-xs" style={{ color: theme.accent }}>
                      Wszystkie działy
                    </Text>
                  </Pressable>
                </View>

                <View style={{ gap: 12 }}>
                  {recent.map((section) => {
                    const color = topicColor(theme, section.sectionIndex);
                    const pct =
                      section.totalTasks > 0
                        ? Math.round((section.solvedTasks / section.totalTasks) * 100)
                        : 0;
                    return (
                      <Pressable
                        key={section.sectionId}
                        onPress={() => router.replace('/(student)/sections')}
                        className="flex-row items-center"
                        style={{
                          borderRadius: 17,
                          padding: 16,
                          paddingHorizontal: 18,
                          gap: 14,
                          backgroundColor: withAlpha(color, 0.12),
                        }}
                      >
                        <View className="flex-1">
                          <Text
                            className="font-manrope-extrabold text-[15px] leading-[19px]"
                            style={{ color: theme.textPrimary }}
                          >
                            {section.sectionTitle}
                          </Text>
                          <Text
                            style={{ color: theme.textSecondary }}
                            className="font-manrope-semibold text-xs mt-1"
                          >
                            {section.solvedTasks} z {section.totalTasks} zadań
                          </Text>
                          <View
                            style={{
                              height: 7,
                              borderRadius: 100,
                              backgroundColor: withAlpha(theme.textPrimary, 0.09),
                              overflow: 'hidden',
                              marginTop: 12,
                            }}
                          >
                            <View
                              style={{ height: 7, borderRadius: 100, width: `${pct}%`, backgroundColor: color }}
                            />
                          </View>
                        </View>
                        <Text
                          className="font-manrope-extrabold text-[17px]"
                          style={{ color: theme.textPrimary }}
                        >
                          {pct}%
                        </Text>
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

function StatTile({ theme, value, label }: { theme: ThemeTokens; value: string | number; label: string }) {
  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.surface,
        borderRadius: 15,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.surfaceBorder,
        shadowColor: theme.textPrimary,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <Text className="font-manrope-extrabold text-[24px]" style={{ color: theme.textPrimary }}>
        {value}
      </Text>
      <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-xs mt-1.5">
        {label}
      </Text>
    </View>
  );
}
