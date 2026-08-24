// Zakomentowane: typ pytania "input" (wpisywanie liczby) jest odłożony na
// później -- test poziomujący korzysta teraz tylko z "choice". Kod zostaje
// jako wzór na przyszłość. Typy InputQuestion/isInputAnswerCorrect i stary
// TOPIC_ACCENT, na które się powołuje, zostały usunięte z lib/levelingTest.ts.

/*
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { InputQuestion, isInputAnswerCorrect, TOPIC_ACCENT } from '../../lib/levelingTest';

type InputQuestionCardProps = {
  question: InputQuestion;
  onAnswer: (correct: boolean) => void;
};

export function InputQuestionCard({ question, onAnswer }: InputQuestionCardProps) {
  const [value, setValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const accent = TOPIC_ACCENT[question.topic];

  const handleSubmit = () => {
    if (answered || value.trim().length === 0) return;
    setAnswered(true);
    onAnswer(isInputAnswerCorrect(question, value));
  };

  const handleSkip = () => {
    if (answered) return;
    setAnswered(true);
    onAnswer(false);
  };

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType="decimal-pad"
        editable={!answered}
        placeholder="Wpisz liczbę"
        placeholderTextColor="#14228466"
        textAlignVertical="center"
        className="border border-infiro-navy/15 rounded-2xl px-4 text-infiro-navy text-xl font-bold mb-4"
        style={{ height: 56, paddingVertical: 0 }}
      />

      <Pressable
        onPress={handleSubmit}
        disabled={value.trim().length === 0 || answered}
        className={`rounded-2xl py-4 items-center mb-3 ${
          value.trim().length === 0 || answered ? accent.bgDisabled : accent.bg
        }`}
      >
        <Text className="text-infiro-white font-semibold text-base">Dalej</Text>
      </Pressable>

      <Pressable
        onPress={handleSkip}
        disabled={answered}
        className="bg-infiro-navy/5 rounded-2xl py-3.5 items-center"
      >
        <Text className="text-infiro-navy/70 font-semibold text-sm">Nie wiem</Text>
      </Pressable>
    </View>
  );
}
*/
