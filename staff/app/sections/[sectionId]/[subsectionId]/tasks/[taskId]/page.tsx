"use client";

import { notFound, useParams } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { DifficultyMeter } from "@/components/ui/DifficultyMeter";
import { TaskTypeBadge } from "@/components/ui/TaskTypeBadge";
import { LoadState } from "@/components/ui/LoadState";
import { TaskContentView } from "@/components/tasks/TaskContentView";
import { getTask } from "@/lib/data";
import { themeLabel } from "@/lib/labels";
import { pluralize } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";

const VARIANT_WORDS = ["wariant", "warianty", "wariantów"] as const;

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
  const { state } = useApiData((token) => getTask(token, Number(taskId)), taskId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const task = state.data;
  if (!task) notFound();

  return (
    <div>
      <BackLink href={`/sections/${task.sectionId}/${task.subsectionId}`}>
        {task.sectionTitle} / {task.subsectionTitle}
      </BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Zadanie {task.orderIndex}</h1>
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
    </div>
  );
}
