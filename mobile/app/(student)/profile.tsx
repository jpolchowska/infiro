import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar } from '../../components/student/BottomTabBar';
import { ErrorState } from '../../components/student/ErrorState';
import { InterestIcon } from '../../components/student/InterestIcon';
import { logout } from '../../lib/auth';
import { formatShortDate } from '../../lib/formatDate';
import { INTERESTS } from '../../lib/interests';
import {
  LastLevelingTest,
  StudentMe,
  getLevelingTestHistory,
  getMe,
} from '../../lib/student';

export default function ProfileScreen() {
  const [me, setMe] = useState<StudentMe | null>(null);
  const [history, setHistory] = useState<LastLevelingTest[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    Promise.all([getMe(), getLevelingTestHistory()])
      .then(([meData, historyData]) => {
        if (active) {
          setMe(meData);
          setHistory(historyData);
        }
      })
      .catch((err) => {
        console.warn('Failed to load profile:', err);
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const name = me?.name ?? null;
  const initial = name ? name.slice(0, 1).toUpperCase() : null;
  const pickedInterest = INTERESTS.find((i) => i.id === me?.interest) ?? null;

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

  if (!me || !history) {
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
          <Text className="text-infiro-navy font-extrabold text-[27px] leading-[31px] mb-5">Profil</Text>

          <View
            className="flex-row items-center bg-infiro-white"
            style={{
              borderRadius: 20,
              paddingVertical: 20,
              paddingHorizontal: 18,
              gap: 16,
              marginBottom: 24,
              shadowColor: '#142284',
              shadowOpacity: 0.06,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 52,
                height: 52,
                borderRadius: 100,
                backgroundColor: '#eceffa',
                borderWidth: 1,
                borderColor: 'rgba(20,34,132,0.12)',
              }}
            >
              {initial ? (
                <Text className="text-infiro-navy font-bold text-lg">{initial}</Text>
              ) : (
                <Ionicons name="person" size={22} color="#142284" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-infiro-navy font-extrabold text-xl">{name ?? 'Uczeń'}</Text>
              <Text style={{ color: '#8b93bd' }} className="font-semibold text-[13px] mt-1">
                klasa 5
              </Text>
            </View>
          </View>

          <Text style={{ color: '#8b93bd', letterSpacing: 1.4 }} className="font-bold text-[12px] uppercase mb-3">
            Zainteresowania
          </Text>
          {pickedInterest ? (
            <View
              className="flex-row items-center bg-infiro-white mb-6"
              style={{
                borderRadius: 17,
                paddingVertical: 14,
                paddingHorizontal: 18,
                gap: 14,
                shadowColor: '#142284',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <View
                className="items-center justify-center"
                style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: pickedInterest.tile }}
              >
                <InterestIcon id={pickedInterest.id} size={24} />
              </View>
              <Text className="flex-1 text-infiro-navy font-extrabold text-[15px]">{pickedInterest.label}</Text>
              <Pressable
                onPress={() => router.push('/(student)/interests?from=profile')}
                style={{ backgroundColor: '#f4f5fb', borderRadius: 100, paddingVertical: 9, paddingHorizontal: 14 }}
              >
                <Text className="text-infiro-navy font-bold text-xs">Zmień</Text>
              </Pressable>
            </View>
          ) : (
            <View
              className="flex-row items-center bg-infiro-white mb-6"
              style={{
                borderRadius: 17,
                paddingVertical: 14,
                paddingHorizontal: 18,
                gap: 14,
                shadowColor: '#142284',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <View
                className="items-center justify-center"
                style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef0f8' }}
              >
                <Ionicons name="sparkles-outline" size={22} color="#a7aecd" />
              </View>
              <Text className="flex-1 text-infiro-navy font-extrabold text-[15px]">Nie wybrano</Text>
              <Pressable
                onPress={() => router.push('/(student)/interests?from=profile')}
                style={{ backgroundColor: '#f4f5fb', borderRadius: 100, paddingVertical: 9, paddingHorizontal: 14 }}
              >
                <Text className="text-infiro-navy font-bold text-xs">Wybierz</Text>
              </Pressable>
            </View>
          )}

          <Text style={{ color: '#8b93bd', letterSpacing: 1.4 }} className="font-bold text-[12px] uppercase mb-3">
            Testy poziomujące
          </Text>
          <View
            className="bg-infiro-white"
            style={{
              borderRadius: 17,
              paddingHorizontal: 18,
              marginBottom: 24,
              shadowColor: '#142284',
              shadowOpacity: 0.06,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            {history.map((attempt, index) => (
              <View
                key={`${attempt.completedAt}-${index}`}
                className="flex-row items-center"
                style={{
                  gap: 12,
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f4f5fb',
                }}
              >
                <Text className="flex-1 text-infiro-navy font-bold text-[13px]">
                  {formatShortDate(attempt.completedAt)}
                </Text>
                <Text className="text-infiro-navy font-extrabold text-[15px]" style={{ width: 44, textAlign: 'right' }}>
                  {attempt.score}/{attempt.total}
                </Text>
              </View>
            ))}
            <Text style={{ color: '#8b93bd', paddingVertical: 13 }} className="font-medium text-xs leading-5">
              Test wraca co jakiś czas i sprawdza Twój poziom.
            </Text>
          </View>

          <Text style={{ color: '#8b93bd', letterSpacing: 1.4 }} className="font-bold text-[12px] uppercase mb-3">
            Ustawienia
          </Text>
          <View
            className="bg-infiro-white"
            style={{
              borderRadius: 17,
              overflow: 'hidden',
              marginBottom: 24,
              shadowColor: '#142284',
              shadowOpacity: 0.06,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <View
              className="flex-row items-center"
              style={{ borderBottomWidth: 1, borderBottomColor: '#f1f2f9', paddingVertical: 16, paddingHorizontal: 18, gap: 12 }}
            >
              <Text className="flex-1 text-infiro-navy font-bold text-[15px]">Język</Text>
              <Text style={{ color: '#8b93bd' }} className="font-semibold text-[13px]">
                Polski
              </Text>
            </View>
            <View className="flex-row items-center" style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
              <Text className="flex-1 text-infiro-navy font-bold text-[15px]">O aplikacji</Text>
              <Text style={{ color: '#8b93bd' }} className="font-semibold text-[13px]">
                Prototyp
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleLogout}
            className="bg-infiro-navy items-center justify-center"
            style={{ borderRadius: 100, height: 56 }}
          >
            <Text className="text-infiro-white font-extrabold text-base">Wyloguj się</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}
