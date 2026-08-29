export type MockSubsection = {
  id: number;
  title: string;
  description: string;
  solvedTasks: number;
  totalTasks: number;
};

export type MockSection = {
  id: number;
  index: number;
  title: string;
  description: string;
  subsections: MockSubsection[];
};

export const MOCK_SECTIONS: MockSection[] = [
  {
    id: 1,
    index: 0,
    title: 'Tabliczka mnożenia i dzielenia',
    description: 'Mnożenie i dzielenie w pamięci, od podstaw do biegłości.',
    subsections: [
      { id: 101, title: 'Zrozumienie mnożenia', description: 'Wizualizacje, mnożenie jako powtarzanie dodawania.', solvedTasks: 6, totalTasks: 6 },
      { id: 102, title: 'Łatwe mnożenie', description: 'Opanowywanie najprostszych przypadków tabliczki mnożenia, szukanie wzorców, liczby 1-5 oraz 0 i 10.', solvedTasks: 6, totalTasks: 6 },
      { id: 103, title: 'Trudniejsze mnożenie i ćwiczenia pamięciowe', description: 'Mnożenie liczb 6-9 bardziej w formie pamięciowej, mnemotechniki na trudniejsze równania.', solvedTasks: 4, totalTasks: 6 },
      { id: 104, title: 'Zrozumienie dzielenia', description: 'Dzielenie jako rozdawanie i odwrotność mnożenia.', solvedTasks: 0, totalTasks: 6 },
      { id: 105, title: 'Dzielenie w praktyce', description: 'Nauka dzielenia w zakresie 100 w formie pamięciowej.', solvedTasks: 0, totalTasks: 6 },
    ],
  },
  {
    id: 2,
    index: 1,
    title: 'Ułamki proste',
    description: 'Czym są ułamki, ich rodzaje i podstawowe działania.',
    subsections: [
      { id: 201, title: 'Kawałki całości', description: 'Czym jest ułamek? Poznanie na przykładach.', solvedTasks: 6, totalTasks: 6 },
      { id: 202, title: 'Jak wygląda ułamek?', description: 'Pojęcie licznika, mianownika i kreski ułamkowej (część teoretyczna).', solvedTasks: 3, totalTasks: 6 },
      { id: 203, title: 'Rodzaje ułamków', description: 'Ułamki właściwe, niewłaściwe, zamiana na całości i na ułamki dziesiętne.', solvedTasks: 0, totalTasks: 6 },
      { id: 204, title: 'Liczby mieszane', description: 'Rozbijanie na całości i reszty.', solvedTasks: 0, totalTasks: 6 },
      { id: 205, title: 'Skracanie i rozszerzanie ułamków', description: 'Upraszczanie ułamków, doprowadzanie do wspólnego mianownika.', solvedTasks: 0, totalTasks: 6 },
      { id: 206, title: 'Mnożenie i dzielenie', description: 'Mnożenie ułamków oraz dzielenie ułamków, jako mnożenie przez odwrotność.', solvedTasks: 0, totalTasks: 6 },
      { id: 207, title: 'Dodawanie i odejmowanie', description: 'Działania na ułamkach o tych samych i różnych mianownikach.', solvedTasks: 0, totalTasks: 6 },
    ],
  },
  {
    id: 3,
    index: 2,
    title: 'Ułamki dziesiętne',
    description: 'Zapis dziesiętny, porównywanie i działania z przecinkiem.',
    subsections: [
      { id: 301, title: 'Wprowadzenie do "przecinka"', description: 'Poznanie części dziesiętnych, setnych i tysięcznych na codziennych przykładach, rola przecinka i dodawania zer.', solvedTasks: 0, totalTasks: 6 },
      { id: 302, title: 'Porównywanie i oś liczbowa', description: 'Który ułamek jest większy? Umiejscawianie ułamków na osi liczbowej.', solvedTasks: 0, totalTasks: 6 },
      { id: 303, title: 'Dodawanie i odejmowanie', description: 'Działania na ułamkach dziesiętnych z zasadą przecinek pod przecinkiem.', solvedTasks: 0, totalTasks: 6 },
      { id: 304, title: 'Mnożenie i dzielenie', description: 'Działania przez 10, 100, 1000, czyli przesuwanie przecinka oraz działania pisemne.', solvedTasks: 0, totalTasks: 6 },
    ],
  },
  {
    id: 4,
    index: 3,
    title: 'Procenty',
    description: 'Procent jako ułamek, obliczenia procentowe i rabaty.',
    subsections: [
      { id: 401, title: 'Czym są procenty?', description: 'Procent a ułamek.', solvedTasks: 0, totalTasks: 6 },
      { id: 402, title: 'Zamiana ról', description: 'Jak zamienić procent na ułamek i na odwrót, nauka pamięciowa typowych rozwiązań.', solvedTasks: 0, totalTasks: 6 },
      { id: 403, title: 'Procent z liczby', description: 'Obliczanie procentu z danej liczby.', solvedTasks: 0, totalTasks: 6 },
      { id: 404, title: 'Szukanie całości i zniżki', description: 'Obliczanie całej liczby, gdy znamy jedynie jej procent, i obliczanie ceny po podwyżce/obniżce procentowej.', solvedTasks: 0, totalTasks: 6 },
    ],
  },
];

export function sectionTotals(section: MockSection) {
  const solvedTasks = section.subsections.reduce((sum, s) => sum + s.solvedTasks, 0);
  const totalTasks = section.subsections.reduce((sum, s) => sum + s.totalTasks, 0);
  return { solvedTasks, totalTasks };
}

export const MOCK_STATS = {
  solvedTasks: 128,
  accuracy: 82,
  startedSections: 2,
};

export const MOCK_CURRENT = {
  sectionId: 1,
  sectionIndex: 0,
  sectionTitle: 'Tabliczka mnożenia i dzielenia',
  subsectionId: 101,
  subsectionTitle: 'Zrozumienie mnożenia',
  solvedTasks: 6,
  totalTasks: 6,
};

export const MOCK_LEVELING_HISTORY = [
  { completedAt: '2026-08-10T10:00:00Z', score: 9, total: 12 },
  { completedAt: '2026-06-10T10:00:00Z', score: 7, total: 12 },
  { completedAt: '2026-04-10T10:00:00Z', score: 2, total: 12 },
];
