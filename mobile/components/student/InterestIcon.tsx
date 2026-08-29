import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type InterestId = 'sport' | 'zwierzeta' | 'gotowanie' | 'lego' | 'gry' | 'rysowanie';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const ICON_NAME: Record<InterestId, IoniconName> = {
  sport: 'football',
  zwierzeta: 'paw',
  gotowanie: 'restaurant',
  lego: 'cube',
  gry: 'game-controller',
  rysowanie: 'brush',
};

export function InterestIcon({
  id,
  size = 24,
  color = '#fefefe',
}: {
  id: InterestId;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={ICON_NAME[id]} size={size} color={color} />;
}
