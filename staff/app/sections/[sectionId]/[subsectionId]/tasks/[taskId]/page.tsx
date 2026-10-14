"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { LoadState } from "@/components/ui/LoadState";
import { TaskContentView } from "@/components/tasks/TaskContentView";
import { TaskStatsTiles } from "@/components/tasks/TaskStatsTiles";
import { getTask } from "@/lib/data";
import { difficultyLabel, taskTypeLabel, themeLabel } from "@/lib/labels";
import { useApiData } from "@/hooks/useApiData";

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { state } = useApiData((token) => getTask(token, Number(taskId)), taskId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const task = state.data;
  if (!task) notFound();

  const difficulty = difficultyLabel(task.difficulty);

  return (
    <div>
      <Link
        href={`/sections/${task.sectionId}/${task.subsectionId}`}
        className="text-sm text-gray-500 hover:text-infiro-navy"
      >
        &larr; {task.sectionTitle} / {task.subsectionTitle}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-infiro-navy">Zadanie {task.orderIndex}</h1>
        <Badge>{taskTypeLabel(task.type)}</Badge>
        <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
      </div>
      {task.contentKey && <p className="mt-1 font-mono text-xs text-gray-400">{task.contentKey}</p>}

      <section className="mt-6 max-w-2xl rounded-sm border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">{themeLabel("default")}</h2>
        <TaskContentView type={task.type} content={task} />
      </section>

      {task.variants.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Warianty pod zainteresowania</h2>
          <div className="mt-4 flex max-w-2xl flex-col gap-4">
            {task.variants.map((variant) => (
              <section key={variant.theme} className="rounded-sm border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {themeLabel(variant.theme)}
                </h3>
                <TaskContentView type={task.type} content={variant} />
              </section>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Statystyki</h2>
      <p className="mt-1 text-xs text-gray-500">Tylko odpowiedzi z nauki, bez testu poziomującego.</p>
      <div className="mt-4">
        <TaskStatsTiles stats={task.stats} />
      </div>
    </div>
  );
}
