"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { LoadState } from "@/components/ui/LoadState";
import { StatTile } from "@/components/ui/StatTile";
import { LevelingTestPanel } from "@/components/student/LevelingTestPanel";
import { SectionProgressList } from "@/components/student/SectionProgressList";
import { NeedsPracticeList, RecentActivityTable } from "@/components/student/TaskActivity";
import { getStudentDetail } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { themeLabel } from "@/lib/labels";
import { useApiData } from "@/hooks/useApiData";

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { state } = useApiData((token) => getStudentDetail(token, Number(studentId)), studentId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const student = state.data;
  if (!student) notFound();

  return (
    <div>
      <Link href="/students" className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wszyscy uczniowie
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{student.name ?? "Uczeń bez imienia"}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {student.email ?? "—"} · zainteresowanie: {themeLabel(student.interest)} · dołączył(a){" "}
        {formatDate(student.joinedAt)} · nauczyciel: {student.teacherName ?? "brak"}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={`${student.solvedTasks}/${student.totalTasks}`} label="Rozwiązane zadania" />
        <StatTile value={formatPercent(student.accuracy)} label="Celność" />
        <StatTile
          value={`${student.activity.answersLast7Days} / ${student.activity.answersLast30Days}`}
          label="Odpowiedzi: 7 / 30 dni"
        />
        <StatTile value={student.activity.activeDaysLast30Days} label="Aktywne dni (30 dni)" />
      </div>

      {student.currentSubsection && (
        <p className="mt-4 text-sm text-gray-700">
          Teraz uczy się: <span className="font-medium">{student.currentSubsection.sectionTitle}</span> /{" "}
          {student.currentSubsection.subsectionTitle} ({student.currentSubsection.solvedTasks}/
          {student.currentSubsection.totalTasks})
        </p>
      )}

      <div className="mt-10">
        <LevelingTestPanel studentId={student.id} state={student.levelingTest} attempts={student.levelingTests} />
      </div>

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Postęp w kursie</h2>
      <SectionProgressList studentId={student.id} sections={student.sections} />

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Do powtórki</h2>
      <NeedsPracticeList items={student.needsPractice} />

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Ostatnia aktywność</h2>
      <RecentActivityTable items={student.recentActivity} />
    </div>
  );
}
