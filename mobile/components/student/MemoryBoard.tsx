import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { MathText } from '../MathText';
import { Text } from '../Text';
import { MemoryPair } from '../../lib/tasks';

const NAVY = '#142284';
const GREEN = '#1f9d63';

type Tile = { key: string; pairId: number; text: string };

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MemoryBoard({ pairs, onSolved }: { pairs: MemoryPair[]; onSolved: () => void }) {
  const tiles = useMemo<Tile[]>(
    () =>
      shuffle(
        pairs.flatMap((p) => [
          { key: `${p.id}-a`, pairId: p.id, text: p.a },
          { key: `${p.id}-b`, pairId: p.id, text: p.b },
        ])
      ),
    [pairs]
  );

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const handlePress = (tile: Tile) => {
    if (busy || matched.has(tile.pairId) || flipped.includes(tile.key) || flipped.length === 2) return;

    const next = [...flipped, tile.key];
    setFlipped(next);
    if (next.length < 2) return;

    const [first, second] = next.map((k) => tiles.find((t) => t.key === k)!);
    if (first.pairId === second.pairId) {
      const m = new Set(matched);
      m.add(first.pairId);
      setMatched(m);
      setFlipped([]);
      if (m.size === pairs.length) setTimeout(onSolved, 350);
    } else {
      setBusy(true);
      setTimeout(() => {
        setFlipped([]);
        setBusy(false);
      }, 750);
    }
  };

  return (
    <View className="flex-row flex-wrap justify-between" style={{ rowGap: 10 }}>
      {tiles.map((tile) => {
        const isMatched = matched.has(tile.pairId);
        const isFlipped = isMatched || flipped.includes(tile.key);
        return (
          <Pressable
            key={tile.key}
            onPress={() => handlePress(tile)}
            disabled={isMatched}
            className="items-center justify-center"
            style={{
              width: '31%',
              aspectRatio: 1,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: isMatched ? GREEN : isFlipped ? NAVY : 'rgba(20,34,132,0.12)',
              backgroundColor: isMatched ? 'rgba(31,157,99,0.1)' : isFlipped ? '#fefefe' : NAVY,
              paddingHorizontal: 6,
            }}
          >
            {isFlipped ? (
              <MathText className="font-manrope-extrabold text-[16px]" color={isMatched ? GREEN : NAVY}>
                {tile.text}
              </MathText>
            ) : (
              <Text className="text-infiro-white font-manrope-extrabold text-[20px]">?</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
