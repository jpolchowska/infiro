import { apiFetch, fetchOrUndefined } from "@/lib/api";
import type { Section, SectionDetail } from "@/lib/types";
import { mapSubsection, type RawSubsection } from "./subsections";

type RawSection = {
  id: number;
  title: string;
  description: string | null;
  subsection_count: number;
  task_count: number;
};

type RawSectionDetail = RawSection & {
  subsections: RawSubsection[];
};

function mapSection(raw: RawSection): Section {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    subsectionCount: raw.subsection_count,
    taskCount: raw.task_count,
  };
}

export async function getSections(token: string): Promise<Section[]> {
  const raw = await apiFetch<RawSection[]>("/api/admin/sections", { token });
  return raw.map(mapSection);
}

export async function getSection(token: string, id: number): Promise<SectionDetail | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawSectionDetail>(`/api/admin/sections/${id}`, { token });
    return {
      ...mapSection(raw),
      subsections: raw.subsections.map(mapSubsection),
    };
  });
}

export async function createSection(
  token: string,
  data: { title: string; description: string }
): Promise<Section> {
  const raw = await apiFetch<RawSection>("/api/admin/sections", { token, method: "POST", json: data });
  return mapSection(raw);
}

export async function updateSection(
  token: string,
  id: number,
  data: { title: string; description: string }
): Promise<Section> {
  const raw = await apiFetch<RawSection>(`/api/admin/sections/${id}`, {
    token,
    method: "PATCH",
    json: data,
  });
  return mapSection(raw);
}

export async function deleteSection(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/admin/sections/${id}`, { token, method: "DELETE" });
}
