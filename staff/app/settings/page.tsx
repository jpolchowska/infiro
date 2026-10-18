"use client";

import { useState, type SubmitEvent } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { inputClass } from "@/components/ui/FormField";
import { LoadState } from "@/components/ui/LoadState";
import { getLevelingTestSettings, updateLevelingTestSettings } from "@/lib/data";
import type { LevelingTestSettings } from "@/lib/types";
import { pluralize, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";
import { SAVE_ERROR, useSubmit } from "@/hooks/useSubmit";

const INTERVAL_LABELS: Record<number, string> = {
  14: "co 2 tygodnie",
  30: "co miesiąc",
  60: "co 2 miesiące",
  90: "co 3 miesiące",
};

const DAY_WORDS = ["dzień", "dni", "dni"] as const;

const SETTINGS_SECTIONS = [
  { id: "leveling-test", label: "Test poziomujący" },
  { id: "about", label: "O aplikacji" },
] as const;

type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

function intervalLabel(days: number): string {
  return INTERVAL_LABELS[days] ?? `co ${days} dni`;
}

export default function SettingsPage() {
  const { role } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("leveling-test");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Ustawienia</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">Ustawienia działają dla wszystkich uczniów w aplikacji.</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[13rem_1fr]">
        <nav className="flex gap-1 lg:flex-col" aria-label="Kategorie ustawień">
          {SETTINGS_SECTIONS.map((section) => {
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-sm border-l-2 px-3 py-2 text-left text-sm font-medium ${
                  isActive
                    ? "border-infiro-navy bg-white text-infiro-navy"
                    : "border-transparent text-gray-600 hover:bg-white/60 hover:text-infiro-navy"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </nav>

        <div>
          <div hidden={activeSection !== "leveling-test"}>
            {role === "admin" ? (
              <SettingsLoader />
            ) : (
              <p className="text-sm text-gray-600">Ustawienia testu poziomującego może zmieniać tylko administrator.</p>
            )}
          </div>
          <div hidden={activeSection !== "about"}>
            <AboutCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsLoader() {
  const { state } = useApiData(getLevelingTestSettings);

  if (state.status !== "ready") return <LoadState state={state} />;

  return <LevelingTestSettingsForm initial={state.data} />;
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-[1fr_18rem] md:items-center md:gap-8">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function AboutCard() {
  return (
    <section className="overflow-hidden rounded-sm border border-infiro-border bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-base font-semibold text-infiro-navy">O aplikacji</h2>
      </div>
      <div className="divide-y divide-gray-100">
        <SettingRow label="Wersja">
          <p className="text-sm text-gray-900">Wersja testowa</p>
        </SettingRow>
        <SettingRow label="Język">
          <p className="text-sm text-gray-900">Polski</p>
        </SettingRow>
      </div>
    </section>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="bg-background/50 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
      {children}
    </h3>
  );
}

function ScheduleStep({ title, detail }: { title: string; detail: string }) {
  return (
    <li className="flex-1 rounded-sm bg-white px-4 py-3 ring-1 ring-infiro-border">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="mt-0.5 text-xs text-gray-500">{detail}</p>
    </li>
  );
}

function LevelingTestSettingsForm({ initial }: { initial: LevelingTestSettings }) {
  const [settings, setSettings] = useState(initial);
  const [questionsPerSection, setQuestionsPerSection] = useState(initial.questionsPerSection);
  const [intervalDays, setIntervalDays] = useState(initial.intervalDays);
  const [completionWindowDays, setCompletionWindowDays] = useState(String(initial.completionWindowDays));
  const [saved, setSaved] = useState(false);
  const { submitting, error, submit } = useSubmit();
  const { min, max } = settings.options.completionWindowDays;
  const windowDays = Number(completionWindowDays);

  const isDirty =
    questionsPerSection !== settings.questionsPerSection ||
    intervalDays !== settings.intervalDays ||
    windowDays !== settings.completionWindowDays;

  function markChanged() {
    setSaved(false);
  }

  function reset() {
    setQuestionsPerSection(settings.questionsPerSection);
    setIntervalDays(settings.intervalDays);
    setCompletionWindowDays(String(settings.completionWindowDays));
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSaved(false);
    await submit(async (token) => {
      const updated = await updateLevelingTestSettings(token, {
        questionsPerSection,
        intervalDays,
        completionWindowDays: windowDays,
      });
      setSettings(updated);
      setSaved(true);
    }, SAVE_ERROR);
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-sm border border-infiro-border bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-base font-semibold text-infiro-navy">Test poziomujący</h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-600">
          Test wraca do ucznia po ustawionym czasie. Przez wybraną liczbę dni uczeń widzi przypomnienie, a po terminie
          aplikacja jest zablokowana do czasu rozwiązania testu.
        </p>
      </div>

      <GroupHeading>Zakres testu</GroupHeading>
      <div className="divide-y divide-gray-100">
        <SettingRow
          label="Pytań na dział"
          description={`Łącznie ${pluralize(questionsPerSection * settings.sectionCount, WORDS.question)} (${pluralize(settings.sectionCount, WORDS.section)}).`}
        >
          <select
            value={questionsPerSection}
            onChange={(e) => {
              setQuestionsPerSection(Number(e.target.value));
              markChanged();
            }}
            className={inputClass}
          >
            {settings.options.questionsPerSection.map((value) => (
              <option key={value} value={value}>
                {value} (po {value / 3} z każdego poziomu)
              </option>
            ))}
          </select>
        </SettingRow>
      </div>

      <GroupHeading>Harmonogram</GroupHeading>
      <div className="divide-y divide-gray-100">
        <SettingRow label="Test wraca" description="Po tym czasie od ostatniego testu uczeń zaczyna widzieć przypomnienie.">
          <select
            value={intervalDays}
            onChange={(e) => {
              setIntervalDays(Number(e.target.value));
              markChanged();
            }}
            className={inputClass}
          >
            {settings.options.intervalDays.map((value) => (
              <option key={value} value={value}>
                {intervalLabel(value)}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow
          label="Dni na wykonanie"
          description={`Ile dni uczeń ma na rozwiązanie testu, zanim aplikacja się zablokuje (od ${min} do ${max}).`}
        >
          <input
            type="number"
            required
            min={min}
            max={max}
            step={1}
            value={completionWindowDays}
            onChange={(e) => {
              setCompletionWindowDays(e.target.value);
              markChanged();
            }}
            className={inputClass}
          />
        </SettingRow>

        <div className="px-6 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">Jak to wygląda dla ucznia</p>
          <ol className="mt-3 flex flex-col gap-2 md:flex-row">
            <ScheduleStep title="Test rozwiązany" detail="uczeń korzysta z aplikacji normalnie" />
            <ScheduleStep title={`Przypomnienie ${intervalLabel(intervalDays)}`} detail="karta „Czas na test” na ekranie głównym" />
            <ScheduleStep
              title={`${Number.isFinite(windowDays) ? pluralize(windowDays, DAY_WORDS) : "—"} na wykonanie`}
              detail="test można zrobić w dowolnej chwili"
            />
            <ScheduleStep title="Blokada" detail="aplikacja wymaga rozwiązania testu" />
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-background/40 px-6 py-4">
        {error && (
          <div className="mr-auto">
            <ErrorMessage message={error} />
          </div>
        )}
        {saved && !isDirty && <span className="mr-auto text-sm text-tone-good">Zapisano.</span>}
        {isDirty && (
          <button
            type="button"
            onClick={reset}
            disabled={submitting}
            className="rounded-sm px-4 py-2 text-sm font-medium text-gray-600 hover:text-infiro-navy disabled:opacity-50"
          >
            Cofnij
          </button>
        )}
        <button
          type="submit"
          disabled={!isDirty || submitting}
          className="rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </div>
    </form>
  );
}
