import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '../Text';
import { ThemeTokens, withAlpha } from '../../lib/theme';

type TimedShortAnswerProps = {
  theme: ThemeTokens;
  onAnswer: (answerText: string) => void;
};

export function TimedShortAnswer({ theme, onAnswer }: TimedShortAnswerProps) {
  const [value, setValue] = useState('');
  const disabled = value.trim() === '';

  const submit = () => {
    if (!disabled) onAnswer(value.trim());
  };

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        value={value}
        onChangeText={setValue}
        autoFocus
        keyboardType="decimal-pad"
        placeholder="Wpisz odpowiedź"
        placeholderTextColor={withAlpha(theme.textPrimary, 0.35)}
        onSubmitEditing={submit}
        className="font-manrope-bold text-xl"
        style={{
          height: 56,
          paddingVertical: 0,
          paddingHorizontal: 16,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: theme.surfaceBorder,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />
      <Pressable
        onPress={submit}
        disabled={disabled}
        className="rounded-full py-4 items-center"
        style={{ backgroundColor: theme.accent, opacity: disabled ? 0.4 : 1 }}
      >
        <Text className="font-manrope-extrabold text-base" style={{ color: theme.accentInk }}>
          Dalej
        </Text>
      </Pressable>
    </View>
  );
}
