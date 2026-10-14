import { apiFetch, fetchOrUndefined } from "@/lib/api";
import type { Ebook, EbookBlock, Subsection, SubsectionDetail } from "@/lib/types";
import { mapTaskSummary, type RawTaskSummary } from "./tasks";

export type RawSubsection = {
  id: number;
  section_id: number;
  title: string;
  description: string | null;
  order_index: number;
  task_count: number;
};

type RawSubsectionDetail = RawSubsection & {
  tasks: RawTaskSummary[];
  ebook: { id: number; title: string } | null;
};

type RawEbook = {
  id: number;
  subsection_id: number;
  title: string;
  intro: string | null;
  blocks: EbookBlock[];
};

export function mapSubsection(raw: RawSubsection): Subsection {
  return {
    id: raw.id,
    sectionId: raw.section_id,
    title: raw.title,
    description: raw.description,
    orderIndex: raw.order_index,
    taskCount: raw.task_count,
  };
}

export async function getSubsection(token: string, id: number): Promise<SubsectionDetail | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawSubsectionDetail>(`/api/admin/subsections/${id}`, { token });
    return {
      ...mapSubsection(raw),
      tasks: raw.tasks.map(mapTaskSummary),
      ebook: raw.ebook,
    };
  });
}

export async function getEbook(token: string, subsectionId: number): Promise<Ebook | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawEbook>(`/api/admin/subsections/${subsectionId}/ebook`, { token });
    return {
      id: raw.id,
      subsectionId: raw.subsection_id,
      title: raw.title,
      intro: raw.intro,
      blocks: raw.blocks,
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
