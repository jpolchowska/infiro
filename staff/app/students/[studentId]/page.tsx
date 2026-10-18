"use client";

import { notFound, useParams } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { LoadState } from "@/components/ui/LoadState";
import { StatTile } from "@/components/ui/StatTile";
import { CourseProgressCard } from "@/components/student/CourseProgressCard";
import { LevelingTestCard } from "@/components/student/LevelingTestCard";
import { PracticeCard } from "@/components/student/PracticeCard";
import { getStudentDetail } from "@/lib/data";
import { formatAccount, formatDate, formatPercent, formatRelativeDate, studentLabel } from "@/lib/format";
import { themeLabel } from "@/lib/labels";
import { useApiData } from "@/hooks/useApiData";

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { state } = useApiData((token) => getStudentDetail(token, Number(studentId)), studentId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const student = state.data;
  if (!student) notFound();

  const details = [
    ["Nauczyciel", formatAccount(student.teacherUsername, student.teacherName) ?? "brak"],
    ["Motyw", themeLabel(student.interest)],
    ["Dołączył(a)", formatDate(student.joinedAt)],
  ];

  return (
    <div>
      <BackLink href="/students">Wszyscy uczniowie</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{studentLabel(student)}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {details.map(([label, value], index) => (
          <span key={label}>
            {index > 0 && <span className="mx-2 text-gray-300">·</span>}
            {label}: <span className="text-gray-900">{value}</span>
          </span>
        ))}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile value={`${student.solvedTasks} z ${student.totalTasks}`} label="Rozwiązane zadania" />
        <StatTile value={formatPercent(student.accuracy)} label="Celność" />
        <StatTile value={formatRelativeDate(student.lastActivity)} label="Ostatnia aktywność" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CourseProgressCard studentId={student.id} sections={student.sections} current={student.currentSubsection} />
        </div>
        <div className="flex flex-col gap-6">
          <LevelingTestCard studentId={student.id} state={student.levelingTest} attempts={student.levelingTests} />
          <PracticeCard items={student.needsPractice} />
        </div>
      </div>
    </div>
  );
}
