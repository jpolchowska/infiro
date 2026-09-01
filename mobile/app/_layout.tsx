import '../global.css';

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Logowanie -> apka i apka -> logowanie to reset sesji, nie nawigacja
            "w głąb" -- przenikanie zamiast przewracania kartki. */}
        <Stack.Screen name="index" options={{ animation: 'fade', animationDuration: 220 }} />
        <Stack.Screen name="(student)" options={{ animation: 'fade', animationDuration: 220 }} />
        <Stack.Screen name="(teacher)" options={{ animation: 'fade', animationDuration: 220 }} />
      </Stack>
    </>
  );
}
