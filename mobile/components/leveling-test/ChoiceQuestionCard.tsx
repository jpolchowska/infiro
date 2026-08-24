import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChoiceQuestion, TOPIC_ACCENT } from '../../lib/levelingTest';

const LETTERS = ['A', 'B', 'C', 'D'];

type ChoiceQuestionCardProps = {
  question: ChoiceQuestion;
  onAnswer: (correct: boolean) => void;
};

export function ChoiceQuestionCard({ question, onAnswer }: ChoiceQuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const accent = TOPIC_ACCENT[question.topic];

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (answered || selectedIndex === null) return;
    setAnswered(true);
    onAnswer(selectedIndex === question.correctIndex);
  };

  return (
    <View>
      {question.options.map((option, index) => {
        const isSelected = selectedIndex === index;
        return (
          <Pressable
            key={option}
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
              <Text className={`font-bold text-sm ${isSelected ? 'text-infiro-white' : accent.text}`}>
                {LETTERS[index]}
              </Text>
            </View>
            <Text className={`text-base font-semibold ${isSelected ? 'text-infiro-white' : 'text-infiro-navy'}`}>
              {option}
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
        <Text className="text-infiro-white font-semibold text-base">Dalej</Text>
      </Pressable>
    </View>
  );
}
