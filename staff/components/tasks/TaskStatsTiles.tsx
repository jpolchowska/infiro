import { StatTile } from "@/components/ui/StatTile";
import { formatPercent } from "@/lib/format";
import type { TaskStats } from "@/lib/types";

export function TaskStatsTiles({ stats }: { stats: TaskStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile value={stats.studentsAttempted} label="Uczniów próbowało" />
      <StatTile value={stats.studentsSolved} label="Uczniów rozwiązało" />
      <StatTile value={stats.attempts} label="Wszystkie próby" />
      <StatTile value={formatPercent(stats.accuracy)} label="Celność" />
    </div>
  );
}
