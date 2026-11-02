import { apiFetch } from "@/lib/api";
import type { TaskImportSummary } from "@/lib/types";

type RawTaskImportSummary = {
  tasks: {
    created: number;
    updated: number;
    deleted: { id: number; prompt: string; section_title: string; subsection_title: string; answer_count: number }[];
  };
  subsections: {
    created: { section_title: string; title: string }[];
    deleted: {
      id: number;
      section_title: string;
      title: string;
      task_count: number;
      answer_count: number;
      has_ebook: boolean;
    }[];
  };
  sections: {
    created: string[];
    deleted: {
      id: number;
      title: string;
      subsection_count: number;
      task_count: number;
      answer_count: number;
      has_final_test: boolean;
    }[];
  };
};

function mapSummary(raw: RawTaskImportSummary): TaskImportSummary {
  return {
    createdTasks: raw.tasks.created,
    updatedTasks: raw.tasks.updated,
    deletedTasks: raw.tasks.deleted.map((task) => ({
      id: task.id,
      prompt: task.prompt,
      sectionTitle: task.section_title,
      subsectionTitle: task.subsection_title,
      answerCount: task.answer_count,
    })),
    createdSubsections: raw.subsections.created.length,
    deletedSubsections: raw.subsections.deleted.map((subsection) => ({
      id: subsection.id,
      sectionTitle: subsection.section_title,
      title: subsection.title,
      taskCount: subsection.task_count,
      answerCount: subsection.answer_count,
      hasEbook: subsection.has_ebook,
    })),
    createdSections: raw.sections.created.length,
    deletedSections: raw.sections.deleted.map((section) => ({
      id: section.id,
      title: section.title,
      subsectionCount: section.subsection_count,
      taskCount: section.task_count,
      answerCount: section.answer_count,
      hasFinalTest: section.has_final_test,
    })),
  };
}

export async function previewTaskImport(token: string, payload: unknown): Promise<TaskImportSummary> {
  const raw = await apiFetch<{ summary: RawTaskImportSummary }>("/api/admin/tasks/import?dry_run=true", {
    token,
    method: "POST",
    json: payload,
  });
  return mapSummary(raw.summary);
}

export async function importTasks(token: string, payload: unknown): Promise<TaskImportSummary> {
  const raw = await apiFetch<{ summary: RawTaskImportSummary }>("/api/admin/tasks/import", {
    token,
    method: "POST",
    json: payload,
  });
  return mapSummary(raw.summary);
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
