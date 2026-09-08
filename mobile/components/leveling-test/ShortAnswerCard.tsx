import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '../Text';
import { Accent } from '../../lib/levelingTest';

type ShortAnswerCardProps = {
  accent: Accent;
  onAnswer: (answerText: string) => void;
  onSkip: () => void;
};

export function ShortAnswerCard({ accent, onAnswer, onSkip }: ShortAnswerCardProps) {
  const [value, setValue] = useState('');
  const [answered, setAnswered] = useState(false);

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
        placeholderTextColor="#14228455"
        onSubmitEditing={handleSubmit}
        className="border border-infiro-navy/15 rounded-2xl px-4 text-infiro-navy text-xl font-manrope-bold mb-4"
        style={{ height: 56, paddingVertical: 0 }}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={disabled}
        className={`rounded-2xl py-4 items-center ${disabled ? accent.bgDisabled : accent.bg}`}
      >
        <Text className="text-infiro-white font-manrope-semibold text-base">Dalej</Text>
      </Pressable>

      <Pressable onPress={handleSkip} disabled={answered} className="py-3.5 items-center mt-1">
        <Text className="text-infiro-navy/50 font-manrope-semibold text-sm">Nie wiem</Text>
      </Pressable>
    </View>
  );
}
