import { StatTile } from "@/components/ui/StatTile";
import { formatPercent } from "@/lib/format";
import type { TaskStats } from "@/lib/types";
import { pluralForm } from "@/lib/pluralize";

export function TaskStatsTiles({ stats }: { stats: TaskStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile
        value={stats.studentsAttempted}
        label={pluralForm(stats.studentsAttempted, [
          "Uczeń próbował",
          "Uczniowie próbowali",
          "Uczniów próbowało",
          "Uczniów próbowało",
        ])}
      />
      <StatTile
        value={stats.studentsSolved}
        label={pluralForm(stats.studentsSolved, [
          "Uczeń rozwiązał",
          "Uczniowie rozwiązali",
          "Uczniów rozwiązało",
          "Uczniów rozwiązało",
        ])}
      />
      <StatTile value={stats.attempts} label={pluralForm(stats.attempts, ["Próba", "Próby", "Prób"])} />
      <StatTile value={formatPercent(stats.accuracy)} label="Celność" />
    </div>
  );
}
