"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/FormField";
import { useAuth } from "@/components/AuthContext";
import { getSubsection, updateTask } from "@/lib/data";

type OptionDraft = { text: string };

export default function EditTaskPage() {
  const router = useRouter();
  const { id, subsectionId, taskId } = useParams<{
    id: string;
    subsectionId: string;
    taskId: string;
  }>();
  const { getToken } = useAuth();
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [difficulty, setDifficulty] = useState("1");
  const [options, setOptions] = useState<OptionDraft[]>([{ text: "" }, { text: "" }]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [loaded, setLoaded] = useState<boolean | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      const subsection = await getSubsection(token ?? "", Number(subsectionId));
      if (!active) return;
      const task = subsection?.tasks.find((t) => t.id === Number(taskId));
      if (!task) {
        setLoaded(false);
        return;
      }
      setTitle(task.title);
      setBodyText(task.bodyText);
      setDifficulty(String(task.difficulty));
      setOptions(task.options.map((o) => ({ text: o.optionText })));
      setCorrectIndex(Math.max(0, task.options.findIndex((o) => o.isCorrect)));
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subsectionId, taskId]);

  function updateOption(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { text } : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, { text: "" }]);
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSubmitting(true);
    const token = await getToken();
    await updateTask(token ?? "", Number(taskId), {
      title,
      bodyText,
      difficultyLevel: Number(difficulty),
      options: options.map((o, i) => ({ text: o.text, correct: i === correctIndex })),
    });
    router.push(`/sections/${id}/${subsectionId}`);
  }

  if (loaded === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
  }
  if (loaded === false) notFound();

  return (
    <div>
      <Link
        href={`/sections/${id}/${subsectionId}`}
        className="text-sm text-gray-500 hover:text-infiro-navy"
      >
        &larr; Wróć do podsekcji
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Edytuj zadanie</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-lg flex-col gap-4">
        <FormField label="Tytuł">
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="Treść pytania">
          <textarea
            rows={3}
            required
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="Poziom trudności">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={inputClass}
          >
            <option value="1">Łatwy</option>
            <option value="2">Średni</option>
            <option value="3">Trudny</option>
          </select>
        </FormField>

        <fieldset className="rounded-sm border border-gray-200 p-4">
          <legend className="px-1 text-xs font-medium text-gray-500">Opcje odpowiedzi</legend>
          <div className="flex flex-col gap-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct-option"
                  checked={correctIndex === index}
                  onChange={() => setCorrectIndex(index)}
                />
                <input
                  type="text"
                  required
                  placeholder={`Opcja ${index + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-3 text-sm font-medium text-infiro-navy hover:underline"
          >
            + Dodaj opcję
          </button>
          <p className="mt-3 text-xs text-gray-500">
            Zaznacz kółko obok poprawnej odpowiedzi.
          </p>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </form>
    </div>
  );
}
