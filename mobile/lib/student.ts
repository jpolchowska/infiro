import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./api";
import { getGivenName } from "../utils/decodeToken";

export type StudentMe = {
  id: number;
  role: string;
  name: string | null;
  levelingTestCompleted: boolean;
  interest: string | null;
};

type RawMe = {
  id: number;
  role: string;
  leveling_test_completed: boolean;
  interest: string | null;
};

export async function getMe(): Promise<StudentMe> {
  const raw = await apiFetch<RawMe>("/api/student/me");
  const token = await SecureStore.getItemAsync("access_token");
  // Imię bierzemy wprost z tokena Keycloaka -- backend go nie zwraca.
  const name = token ? getGivenName(token) : null;

  return {
    id: raw.id,
    role: raw.role,
    name,
    levelingTestCompleted: raw.leveling_test_completed,
    interest: raw.interest,
  };
}

// interest === null czyści wybór.
export async function saveInterest(interest: string | null): Promise<void> {
  await apiFetch<void>("/api/student/interest", {
    method: "PATCH",
    json: { interest },
  });
}

export type CurrentSubsection = {
  subsectionId: number;
  subsectionTitle: string;
  sectionTitle: string;
  sectionIndex: number;
  solvedTasks: number;
  totalTasks: number;
};

export type RecentSection = {
  sectionId: number;
  sectionTitle: string;
  sectionIndex: number;
  solvedTasks: number;
  totalTasks: number;
};

export type LastLevelingTest = {
  completedAt: string;
  score: number;
  total: number;
};

export type DashboardStats = {
  solvedTasks: number;
  totalTasks: number;
  accuracy: number | null;
  startedSections: number;
  current: CurrentSubsection | null;
  recentSections: RecentSection[];
  lastLevelingTest: LastLevelingTest | null;
};

type RawCurrentSubsection = {
  subsection_id: number;
  subsection_title: string;
  section_title: string;
  section_index: number;
  solved_tasks: number;
  total_tasks: number;
};

type RawRecentSection = {
  section_id: number;
  section_title: string;
  section_index: number;
  solved_tasks: number;
  total_tasks: number;
};

type RawDashboardStats = {
  solved_tasks: number;
  total_tasks: number;
  accuracy: number | null;
  started_sections: number;
  current: RawCurrentSubsection | null;
  recent_sections: RawRecentSection[];
  last_leveling_test: { completed_at: string; score: number; total: number } | null;
};

export async function getStats(): Promise<DashboardStats> {
  const raw = await apiFetch<RawDashboardStats>("/api/student/stats");

  return {
    solvedTasks: raw.solved_tasks,
    totalTasks: raw.total_tasks,
    accuracy: raw.accuracy,
    startedSections: raw.started_sections,
    current: raw.current
      ? {
          subsectionId: raw.current.subsection_id,
          subsectionTitle: raw.current.subsection_title,
          sectionTitle: raw.current.section_title,
          sectionIndex: raw.current.section_index,
          solvedTasks: raw.current.solved_tasks,
          totalTasks: raw.current.total_tasks,
        }
      : null,
    recentSections: raw.recent_sections.map((s) => ({
      sectionId: s.section_id,
      sectionTitle: s.section_title,
      sectionIndex: s.section_index,
      solvedTasks: s.solved_tasks,
      totalTasks: s.total_tasks,
    })),
    lastLevelingTest: raw.last_leveling_test
      ? {
          completedAt: raw.last_leveling_test.completed_at,
          score: raw.last_leveling_test.score,
          total: raw.last_leveling_test.total,
        }
      : null,
  };
}

export type SectionSubsectionSummary = {
  id: number;
  title: string;
  description: string | null;
  solvedTasks: number;
  totalTasks: number;
};

export type SectionSummary = {
  id: number;
  title: string;
  description: string | null;
  index: number;
  subsections: SectionSubsectionSummary[];
};

type RawSectionSubsection = {
  id: number;
  title: string;
  description: string | null;
  solved_tasks: number;
  total_tasks: number;
};

type RawSection = {
  id: number;
  title: string;
  description: string | null;
  index: number;
  subsections: RawSectionSubsection[];
};

export async function getSections(): Promise<SectionSummary[]> {
  const raw = await apiFetch<RawSection[]>("/api/student/sections");

  return raw.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    index: s.index,
    subsections: s.subsections.map((sub) => ({
      id: sub.id,
      title: sub.title,
      description: sub.description,
      solvedTasks: sub.solved_tasks,
      totalTasks: sub.total_tasks,
    })),
  }));
}

export type SubsectionTaskStatus = "done" | "current" | "todo" | "locked";

export type SubsectionTaskSummary = {
  id: number;
  title: string;
  difficulty: 1 | 2 | 3;
  status: SubsectionTaskStatus;
};

export type SubsectionDetail = {
  id: number;
  title: string;
  description: string | null;
  sectionId: number;
  sectionTitle: string;
  sectionIndex: number;
  // Kolejna podsekcja w tym samym dziale (null = ostatnia) -- pod przycisk
  // "Dalej" po ukończeniu wszystkich zadań.
  nextSubsectionId: number | null;
  tasks: SubsectionTaskSummary[];
};

type RawSubsectionTask = {
  id: number;
  title: string;
  difficulty_level: number;
  status: SubsectionTaskStatus;
};

type RawSubsectionDetail = {
  id: number;
  title: string;
  description: string | null;
  section_id: number;
  section_title: string;
  section_index: number;
  next_subsection_id: number | null;
  tasks: RawSubsectionTask[];
};

export async function getSubsectionTasks(subsectionId: number): Promise<SubsectionDetail> {
  const raw = await apiFetch<RawSubsectionDetail>(
    `/api/student/subsections/${subsectionId}/tasks`
  );

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    sectionId: raw.section_id,
    sectionTitle: raw.section_title,
    sectionIndex: raw.section_index,
    nextSubsectionId: raw.next_subsection_id,
    tasks: raw.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      difficulty: (t.difficulty_level as 1 | 2 | 3),
      status: t.status,
    })),
  };
}

// Backend zwraca tu już camelCase (`completedAt`) -- bez mapowania.
export async function getLevelingTestHistory(): Promise<LastLevelingTest[]> {
  return apiFetch<LastLevelingTest[]>("/api/student/leveling-test/history");
}
