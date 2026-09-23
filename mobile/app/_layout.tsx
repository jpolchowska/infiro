import '../global.css';

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Oswald_700Bold } from '@expo-google-fonts/oswald';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { TitanOne_400Regular } from '@expo-google-fonts/titan-one';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Oswald_700Bold,
    Rajdhani_700Bold,
    TitanOne_400Regular,
    Baloo2_700Bold,
    BodoniModa_700Bold,
    PlayfairDisplay_700Bold_Italic,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Logowanie -> apka i apka -> logowanie to reset sesji, nie nawigacja
            "w głąb" -- przenikanie zamiast przewracania kartki. */}
        <Stack.Screen name="index" options={{ animation: 'fade', animationDuration: 220 }} />
        <Stack.Screen name="(student)" options={{ animation: 'fade', animationDuration: 220 }} />
        <Stack.Screen name="(teacher)" options={{ animation: 'fade', animationDuration: 220 }} />
      </Stack>
    </SafeAreaProvider>
  );
}
