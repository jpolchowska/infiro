import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const handleStart = () => {
    console.log('start learning');
  };

  const handleLogout = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-infiro-navy">
      <View className="flex-1 justify-center px-6">
        <Text className="text-infiro-white text-4xl font-extrabold leading-tight mb-3">
          Cześć!
        </Text>
        <Text className="text-infiro-white/70 text-base mb-10">
          Logowanie się udało. Możesz zaczynać naukę.
        </Text>

        <Pressable
          onPress={handleStart}
          className="bg-infiro-coral rounded-2xl py-4 items-center active:opacity-80 mb-4"
          style={{
            shadowColor: '#ff5f55',
            shadowOpacity: 0.5,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Text className="text-infiro-white font-semibold text-base">Rozpocznij naukę</Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          className="bg-infiro-white/10 rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text className="text-infiro-white font-semibold text-base">Wyloguj się</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
