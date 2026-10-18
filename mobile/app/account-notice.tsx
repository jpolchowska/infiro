import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '../lib/auth';

const NOTICES = {
  staff: {
    title: 'Ta aplikacja jest dla uczniów',
    body: 'Zalogowano kontem nauczyciela lub administratora. Treść kursu i wyniki uczniów znajdziesz w panelu dla kadry.',
  },
  unassigned: {
    title: 'To konto nie ma jeszcze dostępu',
    body: 'Poproś osobę, która założyła Ci konto, o dokończenie jego konfiguracji.',
  },
};

export default function AccountNoticeScreen() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const notice = kind === 'staff' ? NOTICES.staff : NOTICES.unassigned;

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-infiro-navy">
      <View className="flex-1 justify-center px-6">
        <Text className="text-infiro-white text-4xl font-manrope-extrabold leading-tight mb-3">
          {notice.title}
        </Text>
        <Text className="text-infiro-white/70 text-base mb-10">{notice.body}</Text>

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
