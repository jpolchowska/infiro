import { apiFetch, fetchOrUndefined } from "@/lib/api";
import type { FinalTestPreview, Section, SectionDetail, TaskType } from "@/lib/types";
import { mapSubsection, type RawSubsection } from "./subsections";
import { mapContent, type RawContent } from "./tasks";

type RawSection = {
  id: number;
  title: string;
  description: string | null;
  order_index: number;
  subsection_count: number;
  task_count: number;
  final_test_question_count: number;
};

type RawSectionDetail = RawSection & {
  subsections: RawSubsection[];
};

type RawFinalTestPreview = {
  section_id: number;
  section_title: string;
  questions: (RawContent & {
    id: number;
    content_key: string | null;
    type: TaskType;
    order_index: number;
    themes: string[];
  })[];
  attempts: number;
  students_attempted: number;
};

function mapSection(raw: RawSection): Section {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    orderIndex: raw.order_index,
    subsectionCount: raw.subsection_count,
    taskCount: raw.task_count,
    finalTestQuestionCount: raw.final_test_question_count,
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

export async function getFinalTestPreview(token: string, sectionId: number): Promise<FinalTestPreview | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawFinalTestPreview>(`/api/admin/sections/${sectionId}/final-test`, { token });
    return {
      sectionId: raw.section_id,
      sectionTitle: raw.section_title,
      questions: raw.questions.map((question) => ({
        ...mapContent(question),
        id: question.id,
        contentKey: question.content_key,
        type: question.type,
        orderIndex: question.order_index,
        themes: question.themes,
      })),
      attempts: raw.attempts,
      studentsAttempted: raw.students_attempted,
    };
  });
}
