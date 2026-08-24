import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MemoryQuestion, TOPIC_ACCENT } from '../../lib/levelingTest';

type MemoryQuestionCardProps = {
  question: MemoryQuestion;
  onComplete: (correct: boolean) => void;
};

type Card = {
  id: string;
  pairIndex: number;
  text: string;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MAX_MISTAKES_FOR_CORRECT = 1;

export function MemoryQuestionCard({ question, onComplete }: MemoryQuestionCardProps) {
  const accent = TOPIC_ACCENT[question.topic];
  const cards = useMemo<Card[]>(() => {
    const built = question.pairs.flatMap((pair, pairIndex) => [
      { id: `${pairIndex}-left`, pairIndex, text: pair.left },
      { id: `${pairIndex}-right`, pairIndex, text: pair.right },
    ]);
    return shuffle(built);
  }, [question.id]);

  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const handlePress = (card: Card) => {
    if (locked || done) return;
    if (matchedPairs.has(card.pairIndex)) return;
    if (flippedIds.includes(card.id)) return;
    if (flippedIds.length === 2) return;

    const nextFlipped = [...flippedIds, card.id];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length < 2) return;

    const [firstId, secondId] = nextFlipped;
    const first = cards.find((c) => c.id === firstId)!;
    const second = cards.find((c) => c.id === secondId)!;

    if (first.pairIndex === second.pairIndex) {
      const nextMatched = new Set(matchedPairs);
      nextMatched.add(first.pairIndex);
      setMatchedPairs(nextMatched);
      setFlippedIds([]);

      if (nextMatched.size === question.pairs.length) {
        setDone(true);
        setTimeout(() => onComplete(mistakes <= MAX_MISTAKES_FOR_CORRECT), 400);
      }
    } else {
      setLocked(true);
      setMistakes((m) => m + 1);
      setTimeout(() => {
        setFlippedIds([]);
        setLocked(false);
      }, 700);
    }
  };

  const handleSkip = () => {
    if (done) return;
    setDone(true);
    onComplete(false);
  };

  return (
    <View>
      <View className="flex-row flex-wrap justify-between mb-4">
        {cards.map((card) => {
          const isFlipped = flippedIds.includes(card.id) || matchedPairs.has(card.pairIndex);
          const isMatched = matchedPairs.has(card.pairIndex);

          return (
            <Pressable
              key={card.id}
              onPress={() => handlePress(card)}
              className={`w-[31%] aspect-square rounded-2xl items-center justify-center mb-3 ${
                isMatched ? 'bg-infiro-navy/10' : isFlipped ? `bg-infiro-white border-2 ${accent.border}` : 'bg-infiro-navy'
              }`}
            >
              {isFlipped ? (
                <Text className={`text-lg font-extrabold ${isMatched ? 'text-infiro-navy/40' : 'text-infiro-navy'}`}>
                  {card.text}
                </Text>
              ) : (
                <Text className="text-infiro-white text-xl font-extrabold">?</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleSkip}
        disabled={done}
        className="bg-infiro-navy/5 rounded-2xl py-3.5 items-center"
      >
        <Text className="text-infiro-navy/70 font-semibold text-sm">Pomiń</Text>
      </Pressable>
    </View>
  );
}
