import { Pressable, View } from 'react-native';
import { Text } from '../Text';

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8" style={{ minHeight: 320 }}>
      <Text className="text-infiro-navy font-manrope-extrabold text-lg text-center mb-2">
        Coś poszło nie tak
      </Text>
      <Text style={{ color: '#8b93bd' }} className="font-manrope-medium text-[13px] text-center mb-6">
        Nie udało się połączyć z serwerem. Spróbuj jeszcze raz.
      </Text>
      <Pressable
        onPress={onRetry}
        className="bg-infiro-coral rounded-full items-center justify-center"
        style={{ paddingHorizontal: 28, height: 48 }}
      >
        <Text className="text-infiro-white font-manrope-bold text-[15px]">Spróbuj ponownie</Text>
      </Pressable>
    </View>
  );
}
