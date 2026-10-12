import { apiFetch } from "@/lib/api";

export async function importTasks(
  token: string,
  payload: unknown
): Promise<{ task_count: number; tasks: unknown[]; data: unknown[] }> {
  return apiFetch<{ task_count: number; tasks: unknown[]; data: unknown[] }>("/api/admin/tasks/import", {
    token,
    method: "POST",
    json: payload,
  });
}

export async function uploadImagesZip(
  token: string,
  file: File
): Promise<{ file_count: number; files: string[] }> {
  const form = new FormData();
  form.set("file", file);
  return apiFetch<{ file_count: number; files: string[] }>("/api/admin/uploads/images", {
    token,
    method: "POST",
    body: form,
  });
}

export async function importEbook(
  token: string,
  file: File
): Promise<{ subsection_id: number; title: string }> {
  const form = new FormData();
  form.set("file", file);
  return apiFetch<{ subsection_id: number; title: string }>(
    "/api/admin/ebooks/import",
    { token, method: "POST", body: form }
  );
}

export async function importFinalTest(
  token: string,
  sectionId: number,
  payload: unknown
): Promise<{ question_count: number; questions: unknown[]; data: unknown[] }> {
  return apiFetch<{ question_count: number; questions: unknown[]; data: unknown[] }>(
    `/api/admin/sections/${sectionId}/final-test/import`,
    { token, method: "POST", json: payload }
  );
}
