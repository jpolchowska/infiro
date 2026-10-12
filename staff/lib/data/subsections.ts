import { apiFetch, fetchOrUndefined } from "@/lib/api";
import type { Subsection, SubsectionDetail } from "@/lib/types";
import { mapTask, type RawTask } from "./tasks";

export type RawSubsection = {
  id: number;
  section_id: number;
  title: string;
  description: string | null;
  task_count: number;
};

type RawSubsectionDetail = RawSubsection & {
  tasks: RawTask[];
  ebook: { id: number; title: string } | null;
};

export function mapSubsection(raw: RawSubsection): Subsection {
  return {
    id: raw.id,
    sectionId: raw.section_id,
    title: raw.title,
    description: raw.description,
    taskCount: raw.task_count,
  };
}

export async function getSubsection(
  token: string,
  id: number
): Promise<SubsectionDetail | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawSubsectionDetail>(`/api/admin/subsections/${id}`, { token });
    return {
      ...mapSubsection(raw),
      tasks: raw.tasks.map(mapTask),
      ebook: raw.ebook,
    };
  });
}

export async function createSubsection(
  token: string,
  sectionId: number,
  data: { title: string; description: string }
): Promise<Subsection> {
  const raw = await apiFetch<RawSubsection>(`/api/admin/sections/${sectionId}/subsections`, {
    token,
    method: "POST",
    json: data,
  });
  return mapSubsection(raw);
}

export async function updateSubsection(
  token: string,
  id: number,
  data: { title: string; description: string }
): Promise<Subsection> {
  const raw = await apiFetch<RawSubsection>(`/api/admin/subsections/${id}`, {
    token,
    method: "PATCH",
    json: data,
  });
  return mapSubsection(raw);
}

export async function deleteSubsection(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/admin/subsections/${id}`, { token, method: "DELETE" });
}
