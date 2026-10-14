"use client";

import { useState, type SubmitEvent } from "react";
import { useAuth } from "@/components/AuthContext";
import { ErrorMessage } from "@/components/ErrorMessage";
import { FormField, inputClass } from "@/components/FormField";
import { LoadState } from "@/components/LoadState";
import { getLevelingTestSettings, updateLevelingTestSettings } from "@/lib/data";
import type { LevelingTestSettings } from "@/lib/types";
import { useApiData } from "@/hooks/useApiData";
import { SAVE_ERROR, useSubmit } from "@/hooks/useSubmit";

const INTERVAL_LABELS: Record<number, string> = {
  14: "co 2 tygodnie",
  30: "co miesiąc",
  60: "co 2 miesiące",
  90: "co 3 miesiące",
};

export default function SettingsPage() {
  const { role } = useAuth();

  if (role !== "admin") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-infiro-navy">Ustawienia</h1>
        <p className="mt-2 text-sm text-gray-600">Ustawienia może zmieniać tylko administrator.</p>
      </div>
    );
  }

  return <SettingsLoader />;
}

function SettingsLoader() {
  const { state } = useApiData(getLevelingTestSettings);

  if (state.status !== "ready") return <LoadState state={state} />;

  return <LevelingTestSettingsForm initial={state.data} />;
}

function LevelingTestSettingsForm({ initial }: { initial: LevelingTestSettings }) {
  const [settings, setSettings] = useState(initial);
  const [questionsPerSection, setQuestionsPerSection] = useState(initial.questionsPerSection);
  const [intervalDays, setIntervalDays] = useState(initial.intervalDays);
  const [completionWindowDays, setCompletionWindowDays] = useState(String(initial.completionWindowDays));
  const [saved, setSaved] = useState(false);
  const { submitting, error, submit } = useSubmit();
  const { min, max } = settings.options.completionWindowDays;

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSaved(false);
    await submit(async (token) => {
      const updated = await updateLevelingTestSettings(token, {
        questionsPerSection,
        intervalDays,
        completionWindowDays: Number(completionWindowDays),
      });
      setSettings(updated);
      setSaved(true);
    }, SAVE_ERROR);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Ustawienia</h1>
      <h2 className="mt-8 text-sm font-semibold text-infiro-navy">Test poziomujący</h2>
      <p className="mt-1 max-w-2xl text-sm text-gray-600">
        Test wraca do ucznia po ustawionym czasie. Przez wybraną liczbę dni uczeń widzi przypomnienie, a po
        terminie aplikacja jest zablokowana do czasu rozwiązania testu.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-lg flex-col gap-4">
        <FormField label="Pytań na dział">
          <select
            value={questionsPerSection}
            onChange={(e) => setQuestionsPerSection(Number(e.target.value))}
            className={inputClass}
          >
            {settings.options.questionsPerSection.map((value) => (
              <option key={value} value={value}>
                {value} (po {value / 3} z każdego poziomu)
              </option>
            ))}
          </select>
        </FormField>
        <p className="-mt-2 text-xs text-gray-500">
          Łącznie {questionsPerSection * settings.sectionCount} pytań ({settings.sectionCount} działów).
        </p>

        <FormField label="Test wraca">
          <select value={intervalDays} onChange={(e) => setIntervalDays(Number(e.target.value))} className={inputClass}>
            {settings.options.intervalDays.map((value) => (
              <option key={value} value={value}>
                {INTERVAL_LABELS[value] ?? `co ${value} dni`}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={`Dni na wykonanie (${min}–${max})`}>
          <input
            type="number"
            required
            min={min}
            max={max}
            step={1}
            value={completionWindowDays}
            onChange={(e) => setCompletionWindowDays(e.target.value)}
            className={inputClass}
          />
        </FormField>

        {error && <ErrorMessage message={error} />}
        {saved && <p className="text-sm text-green-700">Zapisano ustawienia.</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Zapisywanie…" : "Zapisz ustawienia"}
        </button>
      </form>
    </div>
  );
}
