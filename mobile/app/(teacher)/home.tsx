import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '../../lib/auth';
export default function HomeScreen() {
  const handleStart = () => {
    router.push('/leveling-test');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-infiro-navy">
      <View className="flex-1 justify-center px-6">
        <Text className="text-infiro-white text-4xl font-manrope-extrabold leading-tight mb-3">
          Witaj w aplikacji!
        </Text>
        <Text className="text-infiro-white/70 text-base mb-10">
          Logowanie się udało. Jesteś nauczycielem.
        </Text>

        <Pressable
          onPress={handleLogout}
          className="bg-infiro-white/10 rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text className="text-infiro-white font-manrope-semibold text-base">Wyloguj się</Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}
