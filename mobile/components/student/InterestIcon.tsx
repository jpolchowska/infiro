import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type InterestId =
  | 'sport'
  | 'gry'
  | 'lego'
  | 'zwierzeta'
  | 'rysowanie'
  | 'muzyka'
  | 'jedzenie';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const ICON_NAME: Record<InterestId, IoniconName> = {
  sport: 'football',
  gry: 'game-controller',
  lego: 'cube',
  zwierzeta: 'paw',
  rysowanie: 'brush',
  muzyka: 'musical-notes',
  jedzenie: 'restaurant',
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
