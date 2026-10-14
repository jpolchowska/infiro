import { apiFetch, fetchOrUndefined } from "@/lib/api";
import type {
  AnswerOption,
  MemoryPair,
  TaskContent,
  TaskDetail,
  TaskDifficulty,
  TaskSummary,
  TaskType,
} from "@/lib/types";

export type RawContent = {
  prompt: string;
  options?: { id: number; text: string; is_correct: boolean }[];
  accepted_answers?: string[];
  memory_pairs?: MemoryPair[];
};

type RawTaskStats = {
  attempts: number;
  correct_attempts: number;
  students_attempted: number;
  students_solved: number;
  accuracy: number | null;
};

export type RawTaskSummary = RawContent & {
  id: number;
  subsection_id: number;
  content_key: string | null;
  type: TaskType;
  difficulty_level: TaskDifficulty | null;
  order_index: number;
  themes: string[];
  stats: RawTaskStats;
};

type RawTaskDetail = RawTaskSummary & {
  section_id: number;
  section_title: string;
  subsection_title: string;
  variants: (RawContent & { theme: string })[];
};

function mapOption(raw: { id: number; text: string; is_correct: boolean }): AnswerOption {
  return { id: raw.id, text: raw.text, isCorrect: raw.is_correct };
}

export function mapContent(raw: RawContent): TaskContent {
  return {
    prompt: raw.prompt,
    options: (raw.options ?? []).map(mapOption),
    acceptedAnswers: raw.accepted_answers ?? [],
    memoryPairs: raw.memory_pairs ?? [],
  };
}

export function mapTaskSummary(raw: RawTaskSummary): TaskSummary {
  return {
    ...mapContent(raw),
    id: raw.id,
    subsectionId: raw.subsection_id,
    contentKey: raw.content_key,
    type: raw.type,
    difficulty: raw.difficulty_level,
    orderIndex: raw.order_index,
    themes: raw.themes,
    stats: {
      attempts: raw.stats.attempts,
      correctAttempts: raw.stats.correct_attempts,
      studentsAttempted: raw.stats.students_attempted,
      studentsSolved: raw.stats.students_solved,
      accuracy: raw.stats.accuracy,
    },
  };
}

export async function getTask(token: string, id: number): Promise<TaskDetail | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawTaskDetail>(`/api/admin/tasks/${id}`, { token });
    return {
      ...mapTaskSummary(raw),
      sectionId: raw.section_id,
      sectionTitle: raw.section_title,
      subsectionTitle: raw.subsection_title,
      variants: raw.variants.map((variant) => ({ ...mapContent(variant), theme: variant.theme })),
    };
  });
}
