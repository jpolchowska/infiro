import { apiFetch } from "@/lib/api";

export async function importTasks(token: string, payload: unknown): Promise<{ taskCount: number }> {
  const raw = await apiFetch<{ task_count: number }>("/api/admin/tasks/import", {
    token,
    method: "POST",
    json: payload,
  });
  return { taskCount: raw.task_count };
}

export async function importEbook(token: string, file: File): Promise<{ title: string }> {
  const form = new FormData();
  form.set("file", file);
  const raw = await apiFetch<{ title: string }>("/api/admin/ebooks/import", { token, method: "POST", body: form });
  return { title: raw.title };
}

export async function importFinalTest(
  token: string,
  sectionId: number,
  payload: unknown
): Promise<{ questionCount: number }> {
  const raw = await apiFetch<{ question_count: number }>(`/api/admin/sections/${sectionId}/final-test/import`, {
    token,
    method: "POST",
    json: payload,
  });
  return { questionCount: raw.question_count };
}
