import { apiFetch } from "./api";

export type TaskType = "single_choice" | "short_answer" | "memory";
export type Difficulty = 1 | 2 | 3;

export type TaskOption = { id: number; text: string };
export type MemoryPair = { id: number; a: string; b: string };

export type TaskSolution =
  | { correctOptionId: number }
  | { answers: string[] }
  | null;

type TaskBase = { id: number; prompt: string };

type RetryState = {
  attemptsUsed: number;
  maxAttempts: number;
  solution: TaskSolution;
};

export type SingleChoiceTask = TaskBase &
  RetryState & {
    type: "single_choice";
    difficulty: Difficulty;
    options: TaskOption[];
  };

export type ShortAnswerTask = TaskBase &
  RetryState & {
    type: "short_answer";
    difficulty: Difficulty;
  };

export type MemoryTask = TaskBase & {
  type: "memory";
  difficulty: null;
  pairs: MemoryPair[];
};

export type Task = SingleChoiceTask | ShortAnswerTask | MemoryTask;

type RawTaskSolution =
  | { correct_option_id: number }
  | { answers: string[] }
  | null;

type RawTask = {
  id: number;
  type: TaskType;
  difficulty_level: number | null;
  prompt: string;
  options?: { id: number; text: string }[];
  pairs?: { id: number; a: string; b: string }[];
  attempts_used?: number;
  max_attempts?: number;
  solution?: RawTaskSolution;
};

function mapSolution(raw: RawTaskSolution | undefined): TaskSolution {
  if (!raw) return null;
  if ("correct_option_id" in raw) return { correctOptionId: raw.correct_option_id };
  if ("answers" in raw) return { answers: raw.answers };
  return null;
}

export async function getTask(taskId: number): Promise<Task> {
  const raw = await apiFetch<RawTask>(`/api/student/tasks/${taskId}`);

  if (raw.type === "memory") {
    return {
      id: raw.id,
      type: "memory",
      difficulty: null,
      prompt: raw.prompt,
      pairs: raw.pairs ?? [],
    };
  }

  const retry: RetryState = {
    attemptsUsed: raw.attempts_used ?? 0,
    maxAttempts: raw.max_attempts ?? 3,
    solution: mapSolution(raw.solution),
  };
  const difficulty = (raw.difficulty_level ?? 1) as Difficulty;

  if (raw.type === "short_answer") {
    return { id: raw.id, type: "short_answer", prompt: raw.prompt, difficulty, ...retry };
  }

  return {
    id: raw.id,
    type: "single_choice",
    prompt: raw.prompt,
    difficulty,
    options: raw.options ?? [],
    ...retry,
  };
}

export type TaskAnswerInput =
  | { selectedOptionId: number }
  | { answerText: string }
  | { memoryCompleted: true };

export type TaskAnswerResult = {
  isCorrect: boolean;
  attemptNumber: number;
  attemptsLeft: number | null;
  solution: TaskSolution;
};

type RawTaskAnswerResult = {
  is_correct: boolean;
  attempt_number: number;
  attempts_left: number | null;
  solution?: RawTaskSolution;
};

export async function submitTaskAnswer(
  taskId: number,
  input: TaskAnswerInput
): Promise<TaskAnswerResult> {
  let body: Record<string, unknown>;
  if ("selectedOptionId" in input) {
    body = { selected_option_id: input.selectedOptionId };
  } else if ("answerText" in input) {
    body = { answer_text: input.answerText };
  } else {
    body = { completed: true };
  }

  const raw = await apiFetch<RawTaskAnswerResult>(`/api/student/tasks/${taskId}/answers`, {
    method: "POST",
    json: body,
  });

  return {
    isCorrect: raw.is_correct,
    attemptNumber: raw.attempt_number,
    attemptsLeft: raw.attempts_left,
    solution: mapSolution(raw.solution),
  };
}
