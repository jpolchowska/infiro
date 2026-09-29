import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../Text';
import { MathText } from '../MathText';

import { FinalTestChoiceQuestion } from '../../lib/finalTest';
import { ThemeTokens, isLightHex, withAlpha } from '../../lib/theme';

const LETTERS = ['A', 'B', 'C', 'D'];

function inkFor(color: string, theme: ThemeTokens): string {
  return isLightHex(color) ? theme.textPrimary : '#fefefe';
}

type ChoiceQuestionCardProps = {
  question: FinalTestChoiceQuestion;
  theme: ThemeTokens;
  accentColor: string;
  onAnswer: (selectedOptionId: number) => void;
  onSkip: () => void;
};

export function ChoiceQuestionCard({
  question,
  theme,
  accentColor,
  onAnswer,
  onSkip,
}: ChoiceQuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const ink = inkFor(accentColor, theme);

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
            className="flex-row items-center rounded-2xl px-4 py-4 mb-3"
            style={{
              borderWidth: 1,
              backgroundColor: isSelected ? accentColor : theme.surface,
              borderColor: isSelected ? accentColor : theme.surfaceBorder,
            }}
          >
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{
                backgroundColor: isSelected ? withAlpha(ink, 0.2) : withAlpha(accentColor, 0.12),
              }}
            >
              <Text
                className="font-manrope-bold text-sm"
                style={{ color: isSelected ? ink : accentColor }}
              >
                {LETTERS[index]}
              </Text>
            </View>
            <MathText
              className="text-base font-manrope-semibold flex-1"
              color={isSelected ? ink : theme.textPrimary}
            >
              {option.text}
            </MathText>
          </Pressable>
        );
      })}

      <Pressable
        onPress={handleSubmit}
        disabled={selectedIndex === null || answered}
        className="rounded-2xl py-4 items-center"
        style={{
          backgroundColor: accentColor,
          opacity: selectedIndex === null || answered ? 0.4 : 1,
        }}
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
