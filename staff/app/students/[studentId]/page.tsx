"use client";

import { notFound, useParams } from "next/navigation";
import { LoadState } from "@/components/ui/LoadState";
import { StatTile } from "@/components/ui/StatTile";
import { LevelingTestPanel } from "@/components/student/LevelingTestPanel";
import { SectionProgressList } from "@/components/student/SectionProgressList";
import { NeedsPracticeList, RecentActivityTable } from "@/components/student/TaskActivity";
import { getStudentDetail } from "@/lib/data";
import { formatAccount, formatDate, formatPercent, studentLabel } from "@/lib/format";
import { themeLabel } from "@/lib/labels";
import { pluralForm } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";
import { BackLink } from "@/components/ui/BackLink";

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { state } = useApiData((token) => getStudentDetail(token, Number(studentId)), studentId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const student = state.data;
  if (!student) notFound();

  return (
    <div>
      <BackLink href="/students">Wszyscy uczniowie</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{studentLabel(student)}</h1>
      <p className="mt-1 text-sm text-gray-500">
        zainteresowanie: {themeLabel(student.interest)} · dołączył(a) {formatDate(student.joinedAt)} · nauczyciel:{" "}
        {formatAccount(student.teacherUsername, student.teacherName) ?? "brak"}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={`${student.solvedTasks}/${student.totalTasks}`} label="Rozwiązane zadania" />
        <StatTile value={formatPercent(student.accuracy)} label="Celność" />
        <StatTile
          value={`${student.activity.answersLast7Days} / ${student.activity.answersLast30Days}`}
          label="Odpowiedzi: 7 / 30 dni"
        />
        <StatTile
          value={student.activity.activeDaysLast30Days}
          label={`${pluralForm(student.activity.activeDaysLast30Days, ["Aktywny dzień", "Aktywne dni", "Aktywnych dni"])} (30 dni)`}
        />
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
