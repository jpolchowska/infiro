import { apiFetch } from "./api";

export type TimedQuestion =
  | { taskId: number; type: "single_choice"; prompt: string; options: { id: number; text: string }[] }
  | { taskId: number; type: "short_answer"; prompt: string };

export type TimedSet = {
  durationSeconds: number;
  questions: TimedQuestion[];
};

type RawTimedQuestion = {
  task_id: number;
  type: "single_choice" | "short_answer";
  prompt: string;
  options?: { id: number; text: string }[];
};

type RawTimedSet = {
  duration_seconds: number;
  questions: RawTimedQuestion[];
};

function mapQuestion(raw: RawTimedQuestion): TimedQuestion {
  if (raw.type === "short_answer") {
    return { taskId: raw.task_id, type: "short_answer", prompt: raw.prompt };
  }
  return { taskId: raw.task_id, type: "single_choice", prompt: raw.prompt, options: raw.options ?? [] };
}

export async function getTimedSet(subsectionId: number): Promise<TimedSet> {
  const raw = await apiFetch<RawTimedSet>(`/api/student/subsections/${subsectionId}/timed`);
  return {
    durationSeconds: raw.duration_seconds,
    questions: raw.questions.map(mapQuestion),
  };
}

export type TimedAnswer = { taskId: number; selectedOptionId: number } | { taskId: number; answerText: string };

export type TimedResult = { correct: number; answered: number; total: number };

export async function submitTimedSet(
  subsectionId: number,
  answers: TimedAnswer[],
  elapsedSeconds: number
): Promise<TimedResult> {
  return apiFetch<TimedResult>(`/api/student/subsections/${subsectionId}/timed/submit`, {
    method: "POST",
    json: {
      answers: answers.map((a) =>
        "answerText" in a
          ? { task_id: a.taskId, answer_text: a.answerText }
          : { task_id: a.taskId, selected_option_id: a.selectedOptionId }
      ),
      elapsed_seconds: elapsedSeconds,
    },
  });
}
