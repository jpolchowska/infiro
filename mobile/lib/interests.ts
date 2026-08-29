import { InterestId } from '../components/student/InterestIcon';

export type InterestOption = { id: InterestId; label: string; tile: string };

export const INTERESTS: InterestOption[] = [
  { id: 'sport', label: 'Sport', tile: '#ff5f55' },
  { id: 'zwierzeta', label: 'Zwierzęta', tile: '#f0b67e' },
  { id: 'gotowanie', label: 'Gotowanie', tile: '#c873d9' },
  { id: 'lego', label: 'LEGO', tile: '#ff5f55' },
  { id: 'gry', label: 'Gry', tile: '#c873d9' },
  { id: 'rysowanie', label: 'Rysowanie', tile: '#f0b67e' },
];
