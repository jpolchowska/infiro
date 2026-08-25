import type {
  Section,
  SectionDetail,
  Subsection,
  SubsectionDetail,
  Task,
  TaskOption,
  Material,
  Student,
  StudentDetail,
} from "./types";
import { apiFetch, ApiError } from "./api";

type RawSection = {
  id: number;
  title: string;
  description: string | null;
  subsection_count: number;
  task_count: number;
};

type RawSectionDetail = RawSection & {
  subsections: RawSubsection[];
  materials: RawMaterial[];
};

type RawSubsection = {
  id: number;
  section_id: number;
  title: string;
  description: string | null;
  task_count: number;
};

type RawSubsectionDetail = RawSubsection & {
  tasks: RawTask[];
  materials: RawMaterial[];
};

type RawMaterial = {
  id: number;
  section_id: number | null;
  subsection_id: number | null;
  type: Material["type"];
  title: string;
  content_text: string | null;
  file_url: string | null;
};

type RawTaskOption = {
  id: number;
  option_text: string;
  is_correct: boolean;
  order_index: number;
};

type RawTask = {
  id: number;
  subsection_id: number;
  title: string;
  body_text: string;
  image_url: string | null;
  difficulty_level: number;
  options: RawTaskOption[];
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

function mapSubsection(raw: RawSubsection): Subsection {
  return {
    id: raw.id,
    sectionId: raw.section_id,
    title: raw.title,
    description: raw.description,
    taskCount: raw.task_count,
  };
}

function mapMaterial(raw: RawMaterial): Material {
  return {
    id: raw.id,
    sectionId: raw.section_id,
    subsectionId: raw.subsection_id,
    type: raw.type,
    title: raw.title,
    contentText: raw.content_text,
    fileUrl: raw.file_url,
  };
}

function mapTaskOption(raw: RawTaskOption): TaskOption {
  return {
    id: raw.id,
    optionText: raw.option_text,
    isCorrect: raw.is_correct,
    orderIndex: raw.order_index,
  };
}

function mapTask(raw: RawTask): Task {
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

async function getOrUndefined<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function getSections(token: string): Promise<Section[]> {
  const raw = await apiFetch<RawSection[]>("/api/admin/sections", { token });
  return raw.map(mapSection);
}

export async function getSection(token: string, id: number): Promise<SectionDetail | undefined> {
  return getOrUndefined(async () => {
    const raw = await apiFetch<RawSectionDetail>(`/api/admin/sections/${id}`, { token });
    return {
      ...mapSection(raw),
      subsections: raw.subsections.map(mapSubsection),
      materials: raw.materials.map(mapMaterial),
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

export async function getSubsection(
  token: string,
  id: number
): Promise<SubsectionDetail | undefined> {
  return getOrUndefined(async () => {
    const raw = await apiFetch<RawSubsectionDetail>(`/api/admin/subsections/${id}`, { token });
    return {
      ...mapSubsection(raw),
      tasks: raw.tasks.map(mapTask),
      materials: raw.materials.map(mapMaterial),
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

export async function createMaterial(
  token: string,
  target: { sectionId: number } | { subsectionId: number },
  data: { title: string; contentText?: string; file?: File }
): Promise<Material> {
  const form = new FormData();
  form.set("title", data.title);
  if (data.contentText) form.set("content_text", data.contentText);
  if (data.file) form.set("file", data.file);

  const path =
    "sectionId" in target
      ? `/api/admin/sections/${target.sectionId}/materials`
      : `/api/admin/subsections/${target.subsectionId}/materials`;

  const raw = await apiFetch<RawMaterial>(path, { token, method: "POST", body: form });
  return mapMaterial(raw);
}

export async function updateMaterial(
  token: string,
  id: number,
  data: { title: string; contentText?: string }
): Promise<Material> {
  const raw = await apiFetch<RawMaterial>(`/api/admin/materials/${id}`, {
    token,
    method: "PATCH",
    json: { title: data.title, content_text: data.contentText },
  });
  return mapMaterial(raw);
}

export async function deleteMaterial(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/admin/materials/${id}`, { token, method: "DELETE" });
}

export async function importTasks(
  token: string,
  payload: unknown
): Promise<{ task_count: number }> {
  return apiFetch<{ task_count: number }>("/api/admin/tasks/import", {
    token,
    method: "POST",
    json: payload,
  });
}

type RawStudent = {
  id: number;
  name: string | null;
  email: string | null;
  solved_tasks: number;
  total_tasks: number;
  accuracy: number | null;
  total_attempts: number;
  last_activity: string | null;
};

type RawStudentDetail = RawStudent & {
  section_progress: { section_title: string; solved_tasks: number; total_tasks: number }[];
  needs_practice: { task_title: string; subsection_title: string; attempt_number: number }[];
  recent_activity: {
    task_title: string;
    subsection_title: string;
    is_correct: boolean;
    attempt_number: number;
    submitted_at: string;
  }[];
};

function mapStudent(raw: RawStudent): Student {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    solvedTasks: raw.solved_tasks,
    totalTasks: raw.total_tasks,
    accuracy: raw.accuracy,
    totalAttempts: raw.total_attempts,
    lastActivity: raw.last_activity,
  };
}

export async function getStudents(token: string): Promise<Student[]> {
  const raw = await apiFetch<RawStudent[]>("/api/admin/students", { token });
  return raw.map(mapStudent);
}

export async function getStudentDetail(
  token: string,
  id: number
): Promise<StudentDetail | undefined> {
  return getOrUndefined(async () => {
    const raw = await apiFetch<RawStudentDetail>(`/api/admin/students/${id}`, { token });
    return {
      ...mapStudent(raw),
      sectionProgress: raw.section_progress.map((sp) => ({
        sectionTitle: sp.section_title,
        solvedTasks: sp.solved_tasks,
        totalTasks: sp.total_tasks,
      })),
      needsPractice: raw.needs_practice.map((np) => ({
        taskTitle: np.task_title,
        subsectionTitle: np.subsection_title,
        attemptNumber: np.attempt_number,
      })),
      recentActivity: raw.recent_activity.map((ra) => ({
        taskTitle: ra.task_title,
        subsectionTitle: ra.subsection_title,
        isCorrect: ra.is_correct,
        attemptNumber: ra.attempt_number,
        submittedAt: ra.submitted_at,
      })),
    };
  });
}
