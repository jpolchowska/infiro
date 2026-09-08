import { apiFetch } from "./api";

export type SectionId = string;
export type Difficulty = 1 | 2 | 3;

type QuestionBase = {
  taskId: number;
  sectionId: SectionId;
  sectionTitle: string;
  sectionIndex: number;
  difficulty: Difficulty;
  prompt: string;
};

export type ChoiceQuestion = QuestionBase & {
  type: 'single_choice';
  options: { id: number; text: string }[];
};

export type ShortAnswerQuestion = QuestionBase & {
  type: 'short_answer';
};

export type LevelingQuestion = ChoiceQuestion | ShortAnswerQuestion;

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

type RawQuestion = {
  task_id: number;
  type: 'single_choice' | 'short_answer';
  difficulty_level: number;
  prompt: string;
  options?: { id: number; text: string }[];
};
type RawSection = { section_id: number; section_title: string; questions: RawQuestion[] };
type RawLevelingTestResponse = { sections: RawSection[] };

export async function fetchLevelingTest(): Promise<LevelingQuestion[]> {
  const data = await apiFetch<RawLevelingTestResponse>("/api/student/leveling-test");

  const questions: LevelingQuestion[] = [];
  data.sections.forEach((section, sectionIndex) => {
    section.questions.forEach((q) => {
      const base: QuestionBase = {
        taskId: q.task_id,
        sectionId: String(section.section_id),
        sectionTitle: section.section_title,
        sectionIndex,
        difficulty: q.difficulty_level as Difficulty,
        prompt: q.prompt,
      };
      if (q.type === 'short_answer') {
        questions.push({ ...base, type: 'short_answer' });
      } else {
        questions.push({ ...base, type: 'single_choice', options: q.options ?? [] });
      }
    });
  });
  return questions;
}

export type LevelingAnswer = {
  taskId: number;
  selectedOptionId?: number;
  answerText?: string;
};

export type LevelingSectionResult = {
  sectionId: SectionId;
  sectionTitle: string;
  score: number;
  total: number;
};

export type LevelingResult = {
  total: number;
  maxTotal: number;
  perSection: LevelingSectionResult[];
  levelLabel: string;
  encouragement: string;
};

const LEVEL_ENCOURAGEMENT: Record<string, string> = {
  Podstawy: 'Dobry początek! Zaczniemy od podstaw, żeby wszystko było jasne — a potem pójdzie z górki.',
  'Dobry start': 'Świetnie Ci poszło! Trzymaj tak dalej, zaraz zmierzymy się z odrobinę trudniejszymi zadaniami.',
  'Pewny start': 'Naprawdę mocny wynik! Widać, że dużo już umiesz — czas na prawdziwe wyzwania.',
};

function levelLabelFor(score: number): string {
  if (score >= 9) return 'Pewny start';
  if (score >= 5) return 'Dobry start';
  return 'Podstawy';
}

type RawSubmitResponse = {
  score: number;
  max_score: number;
  per_section: { section_id: number; section_title: string; score: number; total: number }[];
};

export async function submitLevelingTest(answers: LevelingAnswer[]): Promise<LevelingResult> {
  const raw = await apiFetch<RawSubmitResponse>("/api/student/leveling-test/submit", {
    method: "POST",
    json: {
      answers: answers.map((a) => ({
        task_id: a.taskId,
        ...(a.selectedOptionId != null ? { selected_option_id: a.selectedOptionId } : {}),
        ...(a.answerText != null ? { answer_text: a.answerText } : {}),
      })),
    },
  });

  const levelLabel = levelLabelFor(raw.score);
  return {
    total: raw.score,
    maxTotal: raw.max_score,
    perSection: raw.per_section.map((s) => ({
      sectionId: String(s.section_id),
      sectionTitle: s.section_title,
      score: s.score,
      total: s.total,
    })),
    levelLabel,
    encouragement: LEVEL_ENCOURAGEMENT[levelLabel],
  };
}
