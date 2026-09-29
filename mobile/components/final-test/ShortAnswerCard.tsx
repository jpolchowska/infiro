import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '../Text';
import { ThemeTokens, isLightHex } from '../../lib/theme';

function inkFor(color: string, theme: ThemeTokens): string {
  return isLightHex(color) ? theme.textPrimary : '#fefefe';
}

type ShortAnswerCardProps = {
  theme: ThemeTokens;
  accentColor: string;
  onAnswer: (answerText: string) => void;
  onSkip: () => void;
};

export function ShortAnswerCard({ theme, accentColor, onAnswer, onSkip }: ShortAnswerCardProps) {
  const [value, setValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const ink = inkFor(accentColor, theme);

  const handleSubmit = () => {
    if (answered || value.trim() === '') return;
    setAnswered(true);
    onAnswer(value.trim());
  };

  const handleSkip = () => {
    if (answered) return;
    setAnswered(true);
    onSkip();
  };

  const disabled = value.trim() === '' || answered;

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={setValue}
        editable={!answered}
        keyboardType="decimal-pad"
        placeholder="Wpisz odpowiedź"
        placeholderTextColor={theme.textSecondary}
        onSubmitEditing={handleSubmit}
        className="rounded-2xl px-4 text-xl font-manrope-bold mb-4"
        style={{
          height: 56,
          paddingVertical: 0,
          borderWidth: 1,
          borderColor: theme.surfaceBorder,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={disabled}
        className="rounded-2xl py-4 items-center"
        style={{ backgroundColor: accentColor, opacity: disabled ? 0.4 : 1 }}
      >
        <Text className="font-manrope-semibold text-base" style={{ color: ink }}>
          Dalej
        </Text>
      </Pressable>

      <Pressable
        onPress={handleSkip}
        disabled={answered}
        className="rounded-2xl py-4 items-center mt-2"
        style={{ backgroundColor: theme.surfaceMuted }}
      >
        <Text className="font-manrope-semibold text-base" style={{ color: theme.textPrimary }}>
          Nie wiem
        </Text>
      </Pressable>
    </View>
  );
}
