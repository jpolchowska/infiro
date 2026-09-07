import { apiFetch } from "./api";

export type TimedQuestion = {
  taskId: number;
  prompt: string;
  options: { id: number; text: string }[];
};

export type TimedSet = {
  durationSeconds: number;
  questions: TimedQuestion[];
};

type RawTimedSet = {
  duration_seconds: number;
  questions: { task_id: number; prompt: string; options: { id: number; text: string }[] }[];
};

export async function getTimedSet(subsectionId: number): Promise<TimedSet> {
  const raw = await apiFetch<RawTimedSet>(`/api/student/subsections/${subsectionId}/timed`);
  return {
    durationSeconds: raw.duration_seconds,
    questions: raw.questions.map((q) => ({
      taskId: q.task_id,
      prompt: q.prompt,
      options: q.options,
    })),
  };
}

export type TimedAnswer = { taskId: number; selectedOptionId: number };

export type TimedResult = { correct: number; answered: number; total: number };

export async function submitTimedSet(
  subsectionId: number,
  answers: TimedAnswer[],
  elapsedSeconds: number
): Promise<TimedResult> {
  return apiFetch<TimedResult>(`/api/student/subsections/${subsectionId}/timed/submit`, {
    method: "POST",
    json: {
      answers: answers.map((a) => ({ task_id: a.taskId, selected_option_id: a.selectedOptionId })),
      elapsed_seconds: elapsedSeconds,
    },
  });
}
