"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { BackLink } from "@/components/ui/BackLink";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadState } from "@/components/ui/LoadState";
import { COLUMN_HEADER, TABLE_ROW, TableCard } from "@/components/ui/TableCard";
import { DELETE_LINK, TrashIcon } from "@/components/ui/TrashIcon";
import { deleteEbook, deleteTasks, getSection, getSubsection } from "@/lib/data";
import { difficultyLabel, taskTypeLabel } from "@/lib/labels";
import { pluralize, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";
import { useSubmit } from "@/hooks/useSubmit";

const DELETE_ERROR = "Nie udało się usunąć zadań. Spróbuj ponownie.";
const LINK_BUTTON = "inline-flex items-center gap-1.5 text-sm font-medium hover:underline";
const NAVY_LINK = `${LINK_BUTTON} text-infiro-navy`;
const MUTED_LINK = `${LINK_BUTTON} text-gray-500`;
const CHECKBOX = "block h-4 w-4 cursor-pointer accent-infiro-navy";

function SelectAllCheckbox({ total, selectedCount, onToggle }: {
  total: number;
  selectedCount: number;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const allSelected = total > 0 && selectedCount === total;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = selectedCount > 0 && !allSelected;
  }, [selectedCount, allSelected]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Zaznacz wszystkie zadania"
      checked={allSelected}
      onChange={onToggle}
      className={CHECKBOX}
    />
  );
}

export default function SubsectionPage() {
  const { sectionId, subsectionId } = useParams<{ sectionId: string; subsectionId: string }>();
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [version, setVersion] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [confirmingEbook, setConfirmingEbook] = useState(false);
  const { submitting, error, submit } = useSubmit();
  const ebookDeletion = useSubmit();
  const { state } = useApiData(async (token) => {
    const [section, subsection] = await Promise.all([
      getSection(token, Number(sectionId)),
      getSubsection(token, Number(subsectionId)),
    ]);
    return { section, subsection };
  }, `${sectionId}/${subsectionId}/${version}`);

  if (state.status !== "ready") return <LoadState state={state} />;

  const { section, subsection } = state.data;
  if (!section || !subsection || subsection.sectionId !== section.id) notFound();

  const basePath = `/sections/${section.id}/${subsection.id}`;
  const tasks = subsection.tasks;
  const allSelected = tasks.length > 0 && selected.size === tasks.length;

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(tasks.map((task) => task.id)));
  }

  function toggle(taskId: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  async function confirmDelete() {
    await submit(async (token) => {
      await deleteTasks(token, [...selected]);
      setConfirming(false);
      stopSelecting();
      setVersion((current) => current + 1);
    }, DELETE_ERROR);
  }

  async function confirmEbookDelete() {
    await ebookDeletion.submit(async (token) => {
      await deleteEbook(token, Number(subsectionId));
      setConfirmingEbook(false);
      setVersion((current) => current + 1);
    }, "Nie udało się usunąć e-booka. Spróbuj ponownie.");
  }

  const selectButton =
    isAdmin && tasks.length > 0 ? (
      <button
        type="button"
        onClick={() => setSelecting(true)}
        className={NAVY_LINK}
      >
        Wybierz
      </button>
    ) : undefined;

  const selectionToolbar = selecting ? (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-3.5">
      <span className="text-sm font-semibold text-infiro-navy">
        {selected.size > 0 ? `Zaznaczono ${pluralize(selected.size, WORDS.task)}` : "Zaznacz zadania"}
      </span>
      <div className="ml-auto flex items-center gap-5">
        <button
          type="button"
          onClick={toggleAll}
          className={NAVY_LINK}
        >
          {allSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={selected.size === 0}
          className={DELETE_LINK}
        >
          <TrashIcon />
          Usuń
        </button>
        <button type="button" onClick={stopSelecting} className={MUTED_LINK}>
          Anuluj
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <div>
      <BackLink href={`/sections/${section.id}`}>{section.title}</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{subsection.title}</h1>
      <p className="mt-2 text-sm text-gray-600">{subsection.description}</p>

      <section className="mt-8 rounded-sm border border-infiro-border bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-infiro-navy">E-book</h2>
            <p className="mt-0.5 text-sm text-gray-600">{subsection.ebook ? subsection.ebook.title : "Brak e-booka."}</p>
          </div>
          {subsection.ebook && (
            <div className="flex shrink-0 items-center gap-5">
              {isAdmin && (
                <button type="button" onClick={() => setConfirmingEbook(true)} className={DELETE_LINK}>
                  <TrashIcon />
                  Usuń
                </button>
              )}
              <Link href={`${basePath}/ebook`} className="text-sm font-medium text-infiro-navy hover:underline">
                Podgląd &rsaquo;
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mt-6">
        <TableCard
          title="Zadania"
          count={pluralize(tasks.length, WORDS.task)}
          actions={selectButton}
          toolbar={selectionToolbar}
        >
          <thead className="bg-background/50">
            <tr className="border-b border-gray-100 text-left">
              {selecting && (
                <th className="w-10 py-3 pl-6 align-middle">
                  <SelectAllCheckbox total={tasks.length} selectedCount={selected.size} onToggle={toggleAll} />
                </th>
              )}
              <th className={COLUMN_HEADER}>Zadanie</th>
              <th className={COLUMN_HEADER}>Treść</th>
              <th className={COLUMN_HEADER}>Typ</th>
              <th className={COLUMN_HEADER}>Poziom</th>
              {!selecting && <th className={COLUMN_HEADER} />}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Brak zadań w tej podsekcji.
                </td>
              </tr>
            )}
            {tasks.map((task, index) => {
              const difficulty = difficultyLabel(task.difficulty);
              const isSelected = selected.has(task.id);
              return (
                <tr
                  key={task.id}
                  onClick={selecting ? () => toggle(task.id) : undefined}
                  className={`${TABLE_ROW} ${selecting ? "cursor-pointer select-none" : ""} ${isSelected ? "bg-background/60" : ""}`}
                >
                  {selecting && (
                    <td className="w-10 py-4 pl-6 align-middle">
                      <input
                        type="checkbox"
                        aria-label={`Zaznacz zadanie ${index + 1}`}
                        checked={isSelected}
                        onChange={() => toggle(task.id)}
                        onClick={(event) => event.stopPropagation()}
                        className={CHECKBOX}
                      />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">Zadanie {index + 1}</td>
                  <td className="max-w-md px-6 py-4 text-gray-600">
                    <span className="line-clamp-2">{task.prompt}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">{taskTypeLabel(task.type)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
                  </td>
                  {!selecting && (
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link href={`${basePath}/tasks/${task.id}`} className="font-medium text-infiro-navy hover:underline">
                        Podgląd &rsaquo;
                      </Link>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Usunąć ${pluralize(selected.size, WORDS.task)}?`}
        confirmLabel="Usuń"
        busy={submitting}
        error={error}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      >
        Odpowiedzi uczniów na te zadania też zostaną usunięte. Tej operacji nie można cofnąć, a zadania wrócą tylko
        wtedy, gdy będą w następnym imporcie.
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmingEbook}
        title="Usunąć e-book?"
        confirmLabel="Usuń"
        busy={ebookDeletion.submitting}
        error={ebookDeletion.error}
        onConfirm={confirmEbookDelete}
        onCancel={() => setConfirmingEbook(false)}
      >
        E-book „{subsection.ebook?.title}” zniknie z tej podsekcji razem z obrazkami, a uczniowie przestaną go widzieć.
        Zadania zostają. E-book można później zaimportować ponownie.
      </ConfirmDialog>
    </div>
  );
}
