import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../Text';

import { ChoiceQuestion, Accent } from '../../lib/levelingTest';

const LETTERS = ['A', 'B', 'C', 'D'];

type ChoiceQuestionCardProps = {
  question: ChoiceQuestion;
  accent: Accent;
  onAnswer: (selectedOptionId: number, correct: boolean) => void;
};

export function ChoiceQuestionCard({ question, accent, onAnswer }: ChoiceQuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (answered || selectedIndex === null) return;
    setAnswered(true);
    const option = question.options[selectedIndex];
    onAnswer(option.id, option.isCorrect);
  };

  return (
    <View>
      {question.options.map((option, index) => {
        const isSelected = selectedIndex === index;
        return (
          <Pressable
            key={option.id}
            onPress={() => handleSelect(index)}
            disabled={answered}
            className={`flex-row items-center rounded-2xl border px-4 py-4 mb-3 ${
              isSelected ? 'bg-infiro-navy border-infiro-navy' : 'bg-infiro-white border-infiro-navy/15'
            }`}
          >
            <View
              className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                isSelected ? 'bg-infiro-white/20' : accent.bgSoft
              }`}
            >
              <Text className={`font-manrope-bold text-sm ${isSelected ? 'text-infiro-white' : accent.text}`}>
                {LETTERS[index]}
              </Text>
            </View>
            <Text className={`text-base font-manrope-semibold ${isSelected ? 'text-infiro-white' : 'text-infiro-navy'}`}>
              {option.text}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={handleSubmit}
        disabled={selectedIndex === null || answered}
        className={`rounded-2xl py-4 items-center ${
          selectedIndex === null || answered ? accent.bgDisabled : accent.bg
        }`}
      >
        <Text className="text-infiro-white font-manrope-semibold text-base">Dalej</Text>
      </Pressable>
    </View>
  );
}
