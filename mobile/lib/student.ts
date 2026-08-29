import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./api";
import { getGivenName } from "../utils/decodeToken";
import {
  MOCK_CURRENT,
  MOCK_LEVELING_HISTORY,
  MOCK_SECTIONS,
  MOCK_STATS,
  sectionTotals,
} from "./mockStudentData";

// Klucz zawiera id ucznia -- bez tego jedno konto widziałoby zainteresowanie
// zapisane wcześniej przez INNE konto zalogowane na tym samym telefonie.
function interestKey(userId: number) {
  return `student_interest_${userId}`;
}

export type StudentMe = {
  id: number;
  role: string;
  name: string | null;
  levelingTestCompleted: boolean;
  interest: string | null;
};

// Backend dziś zwraca tylko te trzy pola -- reszta (imię, zainteresowanie)
// jest dociągana z innych, realnie dostępnych źródeł poniżej.
type RawMe = {
  id: number;
  role: string;
  leveling_test_completed: boolean;
};

export async function getMe(): Promise<StudentMe> {
  const raw = await apiFetch<RawMe>("/api/student/me");
  const token = await SecureStore.getItemAsync("access_token");
  const name = token ? getGivenName(token) : null;
  const interest = await SecureStore.getItemAsync(interestKey(raw.id));

  return {
    id: raw.id,
    role: raw.role,
    name,
    levelingTestCompleted: raw.leveling_test_completed,
    interest,
  };
}

// TODO(backend): nie ma jeszcze endpointu do zapisu zainteresowania
// (PATCH /api/student/interest) -- trzymamy wybór lokalnie na urządzeniu,
// żeby ekran działał już teraz. Podmienić na apiFetch, jak endpoint powstanie.
export async function saveInterest(userId: number, interest: string | null): Promise<void> {
  const key = interestKey(userId);
  if (interest === null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, interest);
  }
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

// TODO(backend): brak GET /api/student/stats -- zamockowane pod dashboard
// z prototypu (Claude Design). Podmienić na realny fetch, jak endpoint powstanie
// (kształt oczekiwany po stronie frontu opisany w notatce dla backendu).
export async function getStats(): Promise<DashboardStats> {
  const totalTasks = MOCK_SECTIONS.reduce((sum, s) => sum + sectionTotals(s).totalTasks, 0);
  const recentSections: RecentSection[] = MOCK_SECTIONS.filter((s) =>
    s.subsections.some((sub) => sub.solvedTasks > 0)
  ).map((s) => {
    const totals = sectionTotals(s);
    return {
      sectionId: s.id,
      sectionTitle: s.title,
      sectionIndex: s.index,
      solvedTasks: totals.solvedTasks,
      totalTasks: totals.totalTasks,
    };
  });

  return {
    solvedTasks: MOCK_STATS.solvedTasks,
    totalTasks,
    accuracy: MOCK_STATS.accuracy,
    startedSections: MOCK_STATS.startedSections,
    current: {
      subsectionId: MOCK_CURRENT.subsectionId,
      subsectionTitle: MOCK_CURRENT.subsectionTitle,
      sectionTitle: MOCK_CURRENT.sectionTitle,
      sectionIndex: MOCK_CURRENT.sectionIndex,
      solvedTasks: MOCK_CURRENT.solvedTasks,
      totalTasks: MOCK_CURRENT.totalTasks,
    },
    recentSections,
    lastLevelingTest: MOCK_LEVELING_HISTORY[0]
      ? {
          completedAt: MOCK_LEVELING_HISTORY[0].completedAt,
          score: MOCK_LEVELING_HISTORY[0].score,
          total: MOCK_LEVELING_HISTORY[0].total,
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

// TODO(backend): brak GET /api/student/sections -- zamockowane, patrz
// lib/mockStudentData.ts.
export async function getSections(): Promise<SectionSummary[]> {
  return MOCK_SECTIONS.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    index: s.index,
    subsections: s.subsections.map((sub) => ({
      id: sub.id,
      title: sub.title,
      description: sub.description,
      solvedTasks: sub.solvedTasks,
      totalTasks: sub.totalTasks,
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

// TODO(backend): brak GET /api/student/subsections/<id>/tasks -- zamockowane:
// dorabiamy `solvedTasks` zadań ze statusem "done", jedno "current" (jeśli
// zostały jakieś nierozwiązane), reszta "todo". Realny endpoint ma zwracać
// prawdziwy status per zadanie (patrz notatka dla backendu).
export async function getSubsectionTasks(subsectionId: number): Promise<SubsectionDetail> {
  for (const section of MOCK_SECTIONS) {
    const idx = section.subsections.findIndex((s) => s.id === subsectionId);
    if (idx === -1) continue;
    const sub = section.subsections[idx];
    const next = section.subsections[idx + 1] ?? null;

    const tasks: SubsectionTaskSummary[] = Array.from({ length: sub.totalTasks }, (_, i) => {
      const status: SubsectionTaskStatus =
        i < sub.solvedTasks ? "done" : i === sub.solvedTasks ? "current" : "todo";
      return {
        id: sub.id * 100 + i,
        title: `${sub.title} — zadanie ${i + 1}`,
        difficulty: ((i % 3) + 1) as 1 | 2 | 3,
        status,
      };
    });

    return {
      id: sub.id,
      title: sub.title,
      description: sub.description,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionIndex: section.index,
      nextSubsectionId: next ? next.id : null,
      tasks,
    };
  }

  throw new Error(`Unknown subsection: ${subsectionId}`);
}

// TODO(backend): brak GET /api/student/leveling-test/history i tabeli pod nią
// (dziś jest tylko jedna kolumna leveling_test_completed_at, nie historia
// wielu podejść) -- zamockowane, patrz lib/mockStudentData.ts.
export async function getLevelingTestHistory(): Promise<LastLevelingTest[]> {
  return MOCK_LEVELING_HISTORY.map((a) => ({ ...a }));
}
