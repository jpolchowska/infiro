import { apiFetch } from "./api";

export type SectionId = string;

export type TaskOption = {
  id: number;
  text: string;
  isCorrect: boolean;
};

export type Difficulty = 1 | 2 | 3;

export type ChoiceQuestion = {
  taskId: number;
  sectionId: SectionId;
  sectionTitle: string;
  sectionIndex: number;
  difficulty: Difficulty;
  type: 'choice';
  prompt: string;
  options: TaskOption[];
};

export type LevelingQuestion = ChoiceQuestion;

export type Accent = { text: string; bg: string; bgSoft: string; bgDisabled: string; border: string };

export const ACCENT_PALETTE: Accent[] = [
  { text: 'text-infiro-coral', bg: 'bg-infiro-coral', bgSoft: 'bg-infiro-coral/10', bgDisabled: 'bg-infiro-coral/40', border: 'border-infiro-coral' },
  { text: 'text-infiro-purple', bg: 'bg-infiro-purple', bgSoft: 'bg-infiro-purple/10', bgDisabled: 'bg-infiro-purple/40', border: 'border-infiro-purple' },
  { text: 'text-infiro-peach', bg: 'bg-infiro-peach', bgSoft: 'bg-infiro-peach/15', bgDisabled: 'bg-infiro-peach/40', border: 'border-infiro-peach' },
  { text: 'text-infiro-navy', bg: 'bg-infiro-navy', bgSoft: 'bg-infiro-navy/10', bgDisabled: 'bg-infiro-navy/40', border: 'border-infiro-navy' },
];

export function getAccent(index: number): Accent {
  return ACCENT_PALETTE[index % ACCENT_PALETTE.length];
}

type RawOption = { id: number; option_text: string; is_correct: boolean };
type RawQuestion = {
  task_id: number;
  difficulty_level: number;
  title: string;
  body_text: string;
  image_url: string | null;
  options: RawOption[];
};
type RawSection = { section_id: number; section_title: string; questions: RawQuestion[] };
type RawLevelingTestResponse = { sections: RawSection[] };

export async function fetchLevelingTest(): Promise<LevelingQuestion[]> {
  const data = await apiFetch<RawLevelingTestResponse>("/api/student/leveling-test");

  const questions: LevelingQuestion[] = [];
  data.sections.forEach((section, sectionIndex) => {
    section.questions.forEach((q) => {
      questions.push({
        taskId: q.task_id,
        sectionId: String(section.section_id),
        sectionTitle: section.section_title,
        sectionIndex,
        difficulty: q.difficulty_level as Difficulty,
        type: 'choice',
        prompt: q.body_text,
        options: q.options.map((o) => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct })),
      });
    });
  });
  return questions;
}

export type LevelingAnswer = {
  sectionId: SectionId;
  sectionTitle: string;
  taskId: number;
  selectedOptionId: number;
  correct: boolean;
};

export async function submitLevelingTest(answers: LevelingAnswer[]): Promise<void> {
  await apiFetch("/api/student/leveling-test/submit", {
    method: "POST",
    json: {
      answers: answers.map((a) => ({ task_id: a.taskId, selected_option_id: a.selectedOptionId })),
    },
  });
}

export type SectionProgress = {
  sectionId: SectionId;
  sectionTitle: string;
  score: number;
  total: number;
};

export type LevelingResult = {
  total: number;
  maxTotal: number;
  perSection: SectionProgress[];
  levelLabel: string;
  encouragement: string;
  recommendedSectionId: SectionId;
};

const LEVEL_ENCOURAGEMENT: Record<string, string> = {
  Podstawy: 'Dobry początek! Zaczniemy od podstaw, żeby wszystko było jasne — a potem pójdzie z górki.',
  'Dobry start': 'Świetnie Ci poszło! Trzymaj tak dalej, zaraz zmierzymy się z odrobinę trudniejszymi zadaniami.',
  'Pewny start': 'Naprawdę mocny wynik! Widać, że dużo już umiesz — czas na prawdziwe wyzwania.',
};

export function calculateResult(answers: LevelingAnswer[]): LevelingResult {
  const sectionOrder: SectionId[] = [];
  const sectionTitles: Record<SectionId, string> = {};
  const perSectionScore: Record<SectionId, number> = {};
  const perSectionTotal: Record<SectionId, number> = {};

  answers.forEach((a) => {
    if (!(a.sectionId in perSectionScore)) {
      sectionOrder.push(a.sectionId);
      sectionTitles[a.sectionId] = a.sectionTitle;
      perSectionScore[a.sectionId] = 0;
      perSectionTotal[a.sectionId] = 0;
    }
    perSectionTotal[a.sectionId] += 1;
    if (a.correct) perSectionScore[a.sectionId] += 1;
  });

  const perSection: SectionProgress[] = sectionOrder.map((id) => ({
    sectionId: id,
    sectionTitle: sectionTitles[id],
    score: perSectionScore[id],
    total: perSectionTotal[id],
  }));

  const total = answers.filter((a) => a.correct).length;
  const maxTotal = answers.length;

  let levelLabel = 'Podstawy';
  if (total >= 9) {
    levelLabel = 'Pewny start';
  } else if (total >= 5) {
    levelLabel = 'Dobry start';
  }

  let weakSectionId = sectionOrder[0] ?? '';
  sectionOrder.forEach((id) => {
    if (perSectionScore[id] < perSectionScore[weakSectionId]) weakSectionId = id;
  });

  return {
    total,
    maxTotal,
    perSection,
    levelLabel,
    encouragement: LEVEL_ENCOURAGEMENT[levelLabel],
    recommendedSectionId: weakSectionId,
  };
}
