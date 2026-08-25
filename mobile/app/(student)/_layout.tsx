// app/(student)/_layout.tsx
import { Stack } from 'expo-router';

export default function StudentLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}