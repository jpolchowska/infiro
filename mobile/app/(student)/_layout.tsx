// app/(student)/_layout.tsx
import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" options={{ animation: 'fade', animationDuration: 150 }} />
      <Stack.Screen name="sections/index" options={{ animation: 'fade', animationDuration: 150 }} />
      <Stack.Screen name="profile" options={{ animation: 'fade', animationDuration: 150 }} />
      <Stack.Screen name="interests" options={{ animation: 'fade', animationDuration: 150 }} />
      <Stack.Screen name="leveling-test" options={{ animation: 'fade', animationDuration: 150 }} />
    </Stack>
  );
}
