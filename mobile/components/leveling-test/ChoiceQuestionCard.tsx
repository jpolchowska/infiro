import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../Text';
import { MathText } from '../MathText';

import { ChoiceQuestion, Accent } from '../../lib/levelingTest';

const LETTERS = ['A', 'B', 'C', 'D'];

type ChoiceQuestionCardProps = {
  question: ChoiceQuestion;
  accent: Accent;
  onAnswer: (selectedOptionId: number) => void;
  onSkip: () => void;
};

export function ChoiceQuestionCard({ question, accent, onAnswer, onSkip }: ChoiceQuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (answered || selectedIndex === null) return;
    setAnswered(true);
    onAnswer(question.options[selectedIndex].id);
  };

  const handleSkip = () => {
    if (answered) return;
    setAnswered(true);
    onSkip();
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
            <MathText
              className={`text-base font-manrope-semibold flex-1 ${isSelected ? 'text-infiro-white' : 'text-infiro-navy'}`}
              color={isSelected ? '#fefefe' : '#142284'}
            >
              {option.text}
            </MathText>
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

      <Pressable onPress={handleSkip} disabled={answered} className="py-3.5 items-center mt-1">
        <Text className="text-infiro-navy/50 font-manrope-semibold text-sm">Nie wiem</Text>
      </Pressable>
    </View>
  );
}
