"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/FormField";

type OptionDraft = { text: string };

export default function NewTaskPage() {
  const router = useRouter();
  const { id, subsectionId } = useParams<{ id: string; subsectionId: string }>();
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [difficulty, setDifficulty] = useState("1");
  const [options, setOptions] = useState<OptionDraft[]>([{ text: "" }, { text: "" }]);
  const [correctIndex, setCorrectIndex] = useState(0);

  function updateOption(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { text } : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, { text: "" }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("create task", {
      sectionId: id,
      subsectionId,
      title,
      bodyText,
      difficulty: Number(difficulty),
      options,
      correctIndex,
    });
    router.push(`/sections/${id}/${subsectionId}`);
  }

  return (
    <div>
      <Link
        href={`/sections/${id}/${subsectionId}`}
        className="text-sm text-gray-500 hover:text-infiro-navy"
      >
        &larr; Wróć do podsekcji
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Nowe zadanie</h1>

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
            <option value="3">Średni</option>
            <option value="5">Trudny</option>
          </select>
        </FormField>

        <FormField label="Załącznik (opcjonalnie)">
          <input type="file" accept=".png,.jpg,.jpeg,.gif,.pdf" className={inputClass} />
        </FormField>

        <fieldset className="rounded-md border border-gray-200 p-4">
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
          className="mt-2 self-start rounded-md bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Utwórz zadanie
        </button>
      </form>
    </div>
  );
}
