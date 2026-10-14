import { apiFetch } from "@/lib/api";
import type { LevelingTestSettings } from "@/lib/types";

type RawLevelingTestSettings = {
  questions_per_section: number;
  interval_days: number;
  completion_window_days: number;
  section_count: number;
  options: {
    questions_per_section: number[];
    interval_days: number[];
    completion_window_days: { min: number; max: number };
  };
};

const PATH = "/api/admin/settings/leveling-test";

function mapSettings(raw: RawLevelingTestSettings): LevelingTestSettings {
  return {
    questionsPerSection: raw.questions_per_section,
    intervalDays: raw.interval_days,
    completionWindowDays: raw.completion_window_days,
    sectionCount: raw.section_count,
    options: {
      questionsPerSection: raw.options.questions_per_section,
      intervalDays: raw.options.interval_days,
      completionWindowDays: raw.options.completion_window_days,
    },
  };
}

export async function getLevelingTestSettings(token: string): Promise<LevelingTestSettings> {
  return mapSettings(await apiFetch<RawLevelingTestSettings>(PATH, { token }));
}

export async function updateLevelingTestSettings(
  token: string,
  data: { questionsPerSection: number; intervalDays: number; completionWindowDays: number }
): Promise<LevelingTestSettings> {
  const raw = await apiFetch<RawLevelingTestSettings>(PATH, {
    token,
    method: "PATCH",
    json: {
      questions_per_section: data.questionsPerSection,
      interval_days: data.intervalDays,
      completion_window_days: data.completionWindowDays,
    },
  });
  return mapSettings(raw);
}
