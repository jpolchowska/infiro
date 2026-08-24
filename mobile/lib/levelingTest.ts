export type TopicId = 'mnozenie' | 'ulamki-zwykle' | 'ulamki-dziesietne' | 'procenty';

export type Difficulty = 1 | 2 | 3;

export const TOPICS: { id: TopicId; label: string }[] = [
  { id: 'mnozenie', label: 'Tabliczka mnożenia' },
  { id: 'ulamki-zwykle', label: 'Ułamki zwykłe' },
  { id: 'ulamki-dziesietne', label: 'Ułamki dziesiętne' },
  { id: 'procenty', label: 'Procenty' },
];

export function topicLabel(topic: TopicId): string {
  return TOPICS.find((t) => t.id === topic)?.label ?? topic;
}

export const TOPIC_ACCENT: Record<
  TopicId,
  { text: string; bg: string; bgSoft: string; bgDisabled: string; border: string }
> = {
  mnozenie: {
    text: 'text-infiro-coral',
    bg: 'bg-infiro-coral',
    bgSoft: 'bg-infiro-coral/10',
    bgDisabled: 'bg-infiro-coral/40',
    border: 'border-infiro-coral',
  },
  'ulamki-zwykle': {
    text: 'text-infiro-purple',
    bg: 'bg-infiro-purple',
    bgSoft: 'bg-infiro-purple/10',
    bgDisabled: 'bg-infiro-purple/40',
    border: 'border-infiro-purple',
  },
  'ulamki-dziesietne': {
    text: 'text-infiro-peach',
    bg: 'bg-infiro-peach',
    bgSoft: 'bg-infiro-peach/15',
    bgDisabled: 'bg-infiro-peach/40',
    border: 'border-infiro-peach',
  },
  procenty: {
    text: 'text-infiro-navy',
    bg: 'bg-infiro-navy',
    bgSoft: 'bg-infiro-navy/10',
    bgDisabled: 'bg-infiro-navy/40',
    border: 'border-infiro-navy',
  },
};

type BaseQuestion = {
  id: string;
  topic: TopicId;
  difficulty: Difficulty;
};

export type ChoiceQuestion = BaseQuestion & {
  type: 'choice';
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type InputQuestion = BaseQuestion & {
  type: 'input';
  prompt: string;
  correctAnswer: string;
};

export type MemoryQuestion = BaseQuestion & {
  type: 'memory';
  pairs: { left: string; right: string }[];
};

export type LevelingQuestion = ChoiceQuestion | InputQuestion | MemoryQuestion;

// Memory na razie odłożone na później

const MNOZENIE_POOL: LevelingQuestion[] = [
  // Poziom 1 — proste, dobrze znane fakty.
  { id: 'mn-e1', topic: 'mnozenie', difficulty: 1, type: 'choice', prompt: 'Ile to 2 × 4?', options: ['6', '8', '9', '10'], correctIndex: 1 },
  { id: 'mn-e2', topic: 'mnozenie', difficulty: 1, type: 'choice', prompt: 'Ile to 5 × 5?', options: ['20', '25', '30', '15'], correctIndex: 1 },
  { id: 'mn-e3', topic: 'mnozenie', difficulty: 1, type: 'input', prompt: 'Oblicz: 3 × 3 = ___', correctAnswer: '9' },
  // Poziom 2 — "trudne" tabliczki (6–9).
  { id: 'mn-1', topic: 'mnozenie', difficulty: 2, type: 'choice', prompt: 'Ile to 7 × 6?', options: ['36', '42', '48', '49'], correctIndex: 1 },
  { id: 'mn-2', topic: 'mnozenie', difficulty: 2, type: 'choice', prompt: 'Ile to 8 × 7?', options: ['54', '56', '64', '63'], correctIndex: 1 },
  { id: 'mn-3', topic: 'mnozenie', difficulty: 2, type: 'choice', prompt: 'Ile to 9 × 6?', options: ['45', '52', '54', '56'], correctIndex: 2 },
  { id: 'mn-4', topic: 'mnozenie', difficulty: 2, type: 'input', prompt: 'Oblicz: 8 × 7 = ___', correctAnswer: '56' },
  { id: 'mn-5', topic: 'mnozenie', difficulty: 2, type: 'input', prompt: 'Oblicz: 6 × 9 = ___', correctAnswer: '54' },
  { id: 'mn-6', topic: 'mnozenie', difficulty: 2, type: 'input', prompt: 'Oblicz: 9 × 8 = ___', correctAnswer: '72' },
  // Poziom 3 — mnożenie liczb dwucyfrowych.
  { id: 'mn-h1', topic: 'mnozenie', difficulty: 3, type: 'input', prompt: 'Oblicz: 13 × 4 = ___', correctAnswer: '52' },
  { id: 'mn-h2', topic: 'mnozenie', difficulty: 3, type: 'input', prompt: 'Oblicz: 12 × 7 = ___', correctAnswer: '84' },
  { id: 'mn-h3', topic: 'mnozenie', difficulty: 3, type: 'choice', prompt: 'Ile to 14 × 3?', options: ['32', '42', '48', '52'], correctIndex: 1 },
];

const ULAMKI_ZWYKLE_POOL: LevelingQuestion[] = [
  // Poziom 1 — proste, "ładne" ułamki, bez treści z życia.
  {
    id: 'uz-e1',
    topic: 'ulamki-zwykle',
    difficulty: 1,
    type: 'choice',
    prompt: 'Ile to 1/2 z 10?',
    options: ['2', '4', '5', '6'],
    correctIndex: 2,
  },
  {
    id: 'uz-e2',
    topic: 'ulamki-zwykle',
    difficulty: 1,
    type: 'choice',
    prompt: 'Który ułamek jest największy?',
    options: ['1/4', '1/2', '3/4', '1/8'],
    correctIndex: 2,
  },
  {
    id: 'uz-4',
    topic: 'ulamki-zwykle',
    difficulty: 1,
    type: 'choice',
    prompt: 'Ile to 1/2 z 18?',
    options: ['6', '9', '12', '18'],
    correctIndex: 1,
  },
  { id: 'uz-i1', topic: 'ulamki-zwykle', difficulty: 1, type: 'input', prompt: 'Ile to 1/2 z 8? Wpisz liczbę.', correctAnswer: '4' },
  // Poziom 2 — ułamek z liczby w zadaniu z treścią (jeden krok).
  {
    id: 'uz-1',
    topic: 'ulamki-zwykle',
    difficulty: 2,
    type: 'choice',
    prompt: 'W schronisku jest 20 psów. 3/4 z nich to szczeniaki. Ile jest szczeniąt?',
    options: ['5', '15', '16', '20'],
    correctIndex: 1,
  },
  {
    id: 'uz-2',
    topic: 'ulamki-zwykle',
    difficulty: 2,
    type: 'choice',
    prompt: 'Basia miała 12 cukierków i zjadła 1/3 z nich. Ile cukierków zjadła?',
    options: ['3', '4', '6', '9'],
    correctIndex: 1,
  },
  {
    id: 'uz-5',
    topic: 'ulamki-zwykle',
    difficulty: 2,
    type: 'choice',
    prompt: 'W klasie jest 24 uczniów. 1/4 z nich gra na instrumencie. Ilu uczniów gra na instrumencie?',
    options: ['4', '6', '8', '12'],
    correctIndex: 1,
  },
  {
    id: 'uz-i2',
    topic: 'ulamki-zwykle',
    difficulty: 2,
    type: 'input',
    prompt: 'Zosia miała 15 zł i wydała 1/3 tej kwoty. Ile złotych wydała? Wpisz liczbę.',
    correctAnswer: '5',
  },
  // Poziom 3 — dodawanie ułamków o różnych mianownikach albo zadanie dwuetapowe.
  {
    id: 'uz-h1',
    topic: 'ulamki-zwykle',
    difficulty: 3,
    type: 'choice',
    prompt: 'Ile to 1/4 + 1/2?',
    options: ['3/4', '2/6', '1/6', '3/6'],
    correctIndex: 0,
  },
  {
    id: 'uz-h2',
    topic: 'ulamki-zwykle',
    difficulty: 3,
    type: 'choice',
    prompt: 'W sklepie było 40 jabłek. Sprzedano 3/5 z nich. Ile jabłek zostało?',
    options: ['16', '24', '30', '10'],
    correctIndex: 0,
  },
  {
    id: 'uz-i3',
    topic: 'ulamki-zwykle',
    difficulty: 3,
    type: 'input',
    prompt: 'W autobusie było 36 pasażerów. 2/3 z nich wysiadło na przystanku. Ilu pasażerów zostało? Wpisz liczbę.',
    correctAnswer: '12',
  },
];

const ULAMKI_DZIESIETNE_POOL: LevelingQuestion[] = [
  // Poziom 1 — najbardziej znane odpowiedniki i proste porównania.
  { id: 'ud-4', topic: 'ulamki-dziesietne', difficulty: 1, type: 'input', prompt: 'Zamień na ułamek dziesiętny: 1/2 = ___', correctAnswer: '0,5' },
  { id: 'ud-3', topic: 'ulamki-dziesietne', difficulty: 1, type: 'choice', prompt: 'Która liczba jest największa?', options: ['0,45', '0,5', '0,4', '0,05'], correctIndex: 1 },
  { id: 'ud-e1', topic: 'ulamki-dziesietne', difficulty: 1, type: 'choice', prompt: 'Która liczba jest największa?', options: ['0,3', '0,8', '0,08', '0,03'], correctIndex: 1 },
  // Poziom 2 — mniej oczywiste zamiany i proste dodawanie.
  { id: 'ud-1', topic: 'ulamki-dziesietne', difficulty: 2, type: 'input', prompt: 'Zamień na ułamek dziesiętny: 3/4 = ___', correctAnswer: '0,75' },
  { id: 'ud-5', topic: 'ulamki-dziesietne', difficulty: 2, type: 'choice', prompt: 'Ile to 1,2 + 0,3?', options: ['1,5', '1,4', '1,6', '1,3'], correctIndex: 0 },
  { id: 'ud-2', topic: 'ulamki-dziesietne', difficulty: 2, type: 'input', prompt: 'Ile to 0,5 + 0,25?', correctAnswer: '0,75' },
  { id: 'ud-m1', topic: 'ulamki-dziesietne', difficulty: 2, type: 'input', prompt: 'Zamień na ułamek dziesiętny: 1/4 = ___', correctAnswer: '0,25' },
  // Poziom 3 — odejmowanie z pożyczaniem / dodawanie liczb o różnej liczbie miejsc po przecinku.
  { id: 'ud-h1', topic: 'ulamki-dziesietne', difficulty: 3, type: 'input', prompt: 'Oblicz: 5 − 2,35 = ___', correctAnswer: '2,65' },
  { id: 'ud-h2', topic: 'ulamki-dziesietne', difficulty: 3, type: 'input', prompt: 'Oblicz: 3,4 + 2,75 = ___', correctAnswer: '6,15' },
  { id: 'ud-h3', topic: 'ulamki-dziesietne', difficulty: 3, type: 'choice', prompt: 'Ile to 4 − 1,65?', options: ['2,35', '2,45', '3,35', '2,25'], correctIndex: 0 },
];

const PROCENTY_POOL: LevelingQuestion[] = [
  // Poziom 1 — najczęściej spotykane odpowiedniki procentowe.
  { id: 'pr-2', topic: 'procenty', difficulty: 1, type: 'input', prompt: 'Uzupełnij: 0,5 = ___ %', correctAnswer: '50' },
  { id: 'pr-5', topic: 'procenty', difficulty: 1, type: 'input', prompt: 'Zamień na procent: 0,1 = ___ %', correctAnswer: '10' },
  { id: 'pr-e1', topic: 'procenty', difficulty: 1, type: 'input', prompt: 'Uzupełnij: 0,2 = ___ %', correctAnswer: '20' },
  { id: 'pr-e2', topic: 'procenty', difficulty: 1, type: 'choice', prompt: 'Ile to 10% z 50?', options: ['5', '10', '15', '20'], correctIndex: 0 },
  // Poziom 2 — "ładny" procent z liczby, jeden krok rachunkowy.
  { id: 'pr-1', topic: 'procenty', difficulty: 2, type: 'input', prompt: 'Uzupełnij: 0,25 = ___ %', correctAnswer: '25' },
  { id: 'pr-4', topic: 'procenty', difficulty: 2, type: 'choice', prompt: 'Ile to 50% z 40?', options: ['10', '20', '25', '15'], correctIndex: 1 },
  { id: 'pr-m1', topic: 'procenty', difficulty: 2, type: 'choice', prompt: 'Ile to 25% z 60?', options: ['12', '15', '20', '25'], correctIndex: 1 },
  // Poziom 3 — mniej oczywisty procent albo większe liczby.
  { id: 'pr-3', topic: 'procenty', difficulty: 3, type: 'choice', prompt: 'Ile to 15% z 60?', options: ['6', '9', '12', '15'], correctIndex: 1 },
  { id: 'pr-h1', topic: 'procenty', difficulty: 3, type: 'choice', prompt: 'Ile to 75% z 200?', options: ['100', '125', '150', '175'], correctIndex: 2 },
  { id: 'pr-h2', topic: 'procenty', difficulty: 3, type: 'input', prompt: 'Uzupełnij: 0,15 = ___ %', correctAnswer: '15' },
];

const TOPIC_POOLS: LevelingQuestion[][] = [
  MNOZENIE_POOL,
  ULAMKI_ZWYKLE_POOL,
  ULAMKI_DZIESIETNE_POOL,
  PROCENTY_POOL,
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleChoiceOptions(question: ChoiceQuestion): ChoiceQuestion {
  const correctOption = question.options[question.correctIndex];
  const shuffledOptions = shuffle(question.options);
  return {
    ...question,
    options: shuffledOptions,
    correctIndex: shuffledOptions.indexOf(correctOption),
  };
}

function pickOnePerDifficulty(pool: LevelingQuestion[]): LevelingQuestion[] {
  return ([1, 2, 3] as Difficulty[]).map((level) => {
    const candidates = pool.filter((question) => question.difficulty === level);
    const question = shuffle(candidates)[0];
    return question.type === 'choice' ? shuffleChoiceOptions(question) : question;
  });
}

export function buildLevelingTest(): LevelingQuestion[] {
  return TOPIC_POOLS.flatMap((pool) => pickOnePerDifficulty(pool));
}

function normalizeAnswer(value: string): string {
  return value.trim().replace('.', ',').replace(/\s+/g, '');
}

export function isInputAnswerCorrect(question: InputQuestion, value: string): boolean {
  return normalizeAnswer(value) === normalizeAnswer(question.correctAnswer);
}

export type LevelingAnswer = {
  topic: TopicId;
  correct: boolean;
};

export type LevelingResult = {
  total: number;
  maxTotal: number;
  perTopic: Record<TopicId, number>;
  levelLabel: string;
  encouragement: string;
  recommendedTopic: TopicId;
};

const LEVEL_ENCOURAGEMENT: Record<string, string> = {
  Podstawy: 'Dobry początek! Zaczniemy od podstaw, żeby wszystko było jasne — a potem pójdzie z górki.',
  'Dobry start': 'Świetnie Ci poszło! Trzymaj tak dalej, zaraz zmierzymy się z odrobinę trudniejszymi zadaniami.',
  'Pewny start': 'Naprawdę mocny wynik! Widać, że dużo już umiesz — czas na prawdziwe wyzwania.',
};

export function calculateResult(answers: LevelingAnswer[]): LevelingResult {
  const perTopic = TOPICS.reduce((acc, topic) => {
    acc[topic.id] = 0;
    return acc;
  }, {} as Record<TopicId, number>);

  answers.forEach((answer) => {
    if (answer.correct) {
      perTopic[answer.topic] += 1;
    }
  });

  const total = Object.values(perTopic).reduce((sum, score) => sum + score, 0);

  let levelLabel = 'Podstawy';
  if (total >= 9) {
    levelLabel = 'Pewny start';
  } else if (total >= 5) {
    levelLabel = 'Dobry start';
  }

  let weakTopic = TOPICS[0].id;
  TOPICS.forEach((topic) => {
    if (perTopic[topic.id] < perTopic[weakTopic]) weakTopic = topic.id;
  });

  return {
    total,
    maxTotal: TOPICS.length * 3,
    perTopic,
    levelLabel,
    encouragement: LEVEL_ENCOURAGEMENT[levelLabel],
    recommendedTopic: weakTopic,
  };
}
