"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { BackLink } from "@/components/ui/BackLink";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TrashIcon } from "@/components/ui/TrashIcon";
import { DifficultyMeter } from "@/components/ui/DifficultyMeter";
import { TaskTypeBadge } from "@/components/ui/TaskTypeBadge";
import { LoadState } from "@/components/ui/LoadState";
import { TaskContentView } from "@/components/tasks/TaskContentView";
import { deleteTask, getTask } from "@/lib/data";
import { themeLabel } from "@/lib/labels";
import { pluralize } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";
import { useSubmit } from "@/hooks/useSubmit";

const VARIANT_WORDS = ["wariant", "warianty", "wariantów"] as const;
const DELETE_ERROR = "Nie udało się usunąć zadania. Spróbuj ponownie.";

function ContentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-infiro-border bg-white">
      <h3 className="border-b border-gray-100 px-6 py-4 text-sm font-semibold text-infiro-navy">{title}</h3>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const { submitting, error, submit } = useSubmit();
  const { state } = useApiData((token) => getTask(token, Number(taskId)), taskId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const task = state.data;
  if (!task) notFound();

  const subsectionPath = `/sections/${task.sectionId}/${task.subsectionId}`;
  const id = task.id;

  async function confirmDelete() {
    await submit(async (token) => {
      await deleteTask(token, id);
      router.push(subsectionPath);
    }, DELETE_ERROR);
  }

  return (
    <div>
      <BackLink href={subsectionPath}>
        {task.sectionTitle} / {task.subsectionTitle}
      </BackLink>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-infiro-navy">Zadanie {task.orderIndex}</h1>
        {role === "admin" && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="relative inline-flex items-center gap-1.5 text-sm font-medium text-tone-bad after:absolute after:left-[2.5px] after:right-0 after:bottom-[3px] after:h-px after:bg-current after:opacity-0 hover:after:opacity-100"
          >
            <TrashIcon />
            Usuń zadanie
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <TaskTypeBadge type={task.type} />
        <DifficultyMeter level={task.difficulty} />
      </div>

      <div className="mt-6">
        <ContentCard title={themeLabel("default")}>
          <TaskContentView type={task.type} content={task} />
        </ContentCard>
      </div>

      {task.variants.length > 0 && (
        <>
          <div className="mt-10 flex items-baseline gap-3">
            <h2 className="text-sm font-semibold text-infiro-navy">Warianty pod zainteresowania</h2>
            <span className="text-sm text-gray-500">{pluralize(task.variants.length, VARIANT_WORDS)}</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {task.variants.map((variant) => (
              <ContentCard key={variant.theme} title={themeLabel(variant.theme)}>
                <TaskContentView type={task.type} content={variant} />
              </ContentCard>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirming}
        title={`Usunąć zadanie ${task.orderIndex}?`}
        confirmLabel="Usuń zadanie"
        busy={submitting}
        error={error}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      >
        Odpowiedzi uczniów na to zadanie też zostaną usunięte. Tej operacji nie można cofnąć, a zadanie wróci tylko
        wtedy, gdy będzie w następnym imporcie.
      </ConfirmDialog>
    </div>
  );
}
