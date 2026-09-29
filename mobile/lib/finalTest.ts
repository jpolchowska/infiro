import { apiFetch } from "./api";

type FinalTestQuestionBase = {
  questionId: number;
  prompt: string;
};

export type FinalTestChoiceQuestion = FinalTestQuestionBase & {
  type: 'single_choice';
  options: { id: number; text: string }[];
};

export type FinalTestShortAnswerQuestion = FinalTestQuestionBase & {
  type: 'short_answer';
};

export type FinalTestQuestion = FinalTestChoiceQuestion | FinalTestShortAnswerQuestion;

type RawFinalTestQuestion = {
  question_id: number;
  type: 'single_choice' | 'short_answer';
  prompt: string;
  options?: { id: number; text: string }[];
};
type RawFinalTestResponse = {
  section_id: number;
  section_title: string;
  questions: RawFinalTestQuestion[];
};

export type FinalTest = {
  sectionId: number;
  sectionTitle: string;
  questions: FinalTestQuestion[];
};

export async function fetchFinalTest(sectionId: number): Promise<FinalTest> {
  const data = await apiFetch<RawFinalTestResponse>(`/api/student/sections/${sectionId}/final-test`);

  const questions: FinalTestQuestion[] = data.questions.map((q) => {
    const base: FinalTestQuestionBase = { questionId: q.question_id, prompt: q.prompt };
    return q.type === 'short_answer'
      ? { ...base, type: 'short_answer' }
      : { ...base, type: 'single_choice', options: q.options ?? [] };
  });

  return { sectionId: data.section_id, sectionTitle: data.section_title, questions };
}

export type FinalTestAnswer = {
  questionId: number;
  selectedOptionId?: number;
  answerText?: string;
};

export type FinalTestResult = { score: number; maxScore: number };

export async function submitFinalTest(
  sectionId: number,
  answers: FinalTestAnswer[]
): Promise<FinalTestResult> {
  const raw = await apiFetch<{ score: number; max_score: number }>(
    `/api/student/sections/${sectionId}/final-test/submit`,
    {
      method: "POST",
      json: {
        answers: answers.map((a) => ({
          question_id: a.questionId,
          ...(a.selectedOptionId != null ? { selected_option_id: a.selectedOptionId } : {}),
          ...(a.answerText != null ? { answer_text: a.answerText } : {}),
        })),
      },
    }
  );
  return { score: raw.score, maxScore: raw.max_score };
}

export type FinalTestAttempt = { score: number; total: number; completedAt: string };

export async function getFinalTestHistory(sectionId: number): Promise<FinalTestAttempt[]> {
  return apiFetch<FinalTestAttempt[]>(`/api/student/sections/${sectionId}/final-test/history`);
}
