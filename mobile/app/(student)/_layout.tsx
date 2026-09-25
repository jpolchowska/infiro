import { Stack } from 'expo-router';
import { ThemeProvider } from '../../lib/theme';

export default function StudentLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="sections/index" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="profile" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="interests" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="leveling-test" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="tasks/[id]" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="timed/[subsectionId]" options={{ animation: 'fade', animationDuration: 150 }} />
        <Stack.Screen name="ebooks/[subsectionId]" options={{ animation: 'fade', animationDuration: 150 }} />
      </Stack>
    </ThemeProvider>
  );
}
