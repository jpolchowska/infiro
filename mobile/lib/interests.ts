import { InterestId } from '../components/student/InterestIcon';

export type InterestOption = { id: InterestId; label: string; tile: string };

// Kafelki cyklują 3 kolory z palety fundacji. `id` to wartość zapisywana
// w bazie (PATCH /api/student/interest) -- małe litery, ASCII.
export const INTERESTS: InterestOption[] = [
  { id: 'sport', label: 'Sport', tile: '#ff5f55' },
  { id: 'gry', label: 'Gry komputerowe', tile: '#c873d9' },
  { id: 'lego', label: 'LEGO (klocki)', tile: '#f0b67e' },
  { id: 'zwierzeta', label: 'Zwierzęta', tile: '#ff5f55' },
  { id: 'rysowanie', label: 'Rysowanie i sztuka', tile: '#c873d9' },
  { id: 'muzyka', label: 'Muzyka i taniec', tile: '#f0b67e' },
  { id: 'jedzenie', label: 'Jedzenie i gotowanie', tile: '#ff5f55' },
];
