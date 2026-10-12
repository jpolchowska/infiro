import { apiFetch } from "@/lib/api";
import type { Task, TaskOption } from "@/lib/types";

type RawTaskOption = {
  id: number;
  option_text: string;
  is_correct: boolean;
  order_index: number;
};

export type RawTask = {
  id: number;
  subsection_id: number;
  title: string;
  body_text: string;
  image_url: string | null;
  difficulty_level: number;
  options: RawTaskOption[];
};

function mapTaskOption(raw: RawTaskOption): TaskOption {
  return {
    id: raw.id,
    optionText: raw.option_text,
    isCorrect: raw.is_correct,
    orderIndex: raw.order_index,
  };
}

export function mapTask(raw: RawTask): Task {
  return {
    id: raw.id,
    subsectionId: raw.subsection_id,
    title: raw.title,
    bodyText: raw.body_text,
    imageUrl: raw.image_url,
    difficulty: raw.difficulty_level as Task["difficulty"],
    options: (raw.options ?? []).map(mapTaskOption),
  };
}

export async function createTask(
  token: string,
  subsectionId: number,
  data: {
    title: string;
    bodyText: string;
    difficultyLevel: number;
    options: { text: string; correct: boolean }[];
  }
): Promise<Task> {
  const raw = await apiFetch<RawTask>(`/api/admin/subsections/${subsectionId}/tasks`, {
    token,
    method: "POST",
    json: {
      title: data.title,
      body_text: data.bodyText,
      difficulty_level: data.difficultyLevel,
      options: data.options,
    },
  });
  return mapTask(raw);
}

export async function updateTask(
  token: string,
  id: number,
  data: {
    title: string;
    bodyText: string;
    difficultyLevel: number;
    options: { text: string; correct: boolean }[];
  }
): Promise<Task> {
  const raw = await apiFetch<RawTask>(`/api/admin/tasks/${id}`, {
    token,
    method: "PATCH",
    json: {
      title: data.title,
      body_text: data.bodyText,
      difficulty_level: data.difficultyLevel,
      options: data.options,
    },
  });
  return mapTask(raw);
}

export async function deleteTask(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/admin/tasks/${id}`, { token, method: "DELETE" });
}
