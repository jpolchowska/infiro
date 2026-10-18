import type { Student } from "./types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type TeacherStats = {
  studentCount: number;
  averageAccuracy: number | null;
  activeThisWeek: number;
  overdueLevelingTests: number;
};

export function teacherStats(students: Student[]): TeacherStats {
  const accuracies = students.map((student) => student.accuracy).filter((accuracy): accuracy is number => accuracy !== null);
  const weekAgo = Date.now() - WEEK_MS;

  return {
    studentCount: students.length,
    averageAccuracy: accuracies.length
      ? Math.round(accuracies.reduce((sum, accuracy) => sum + accuracy, 0) / accuracies.length)
      : null,
    activeThisWeek: students.filter(
      (student) => student.lastActivity !== null && new Date(student.lastActivity).getTime() >= weekAgo
    ).length,
    overdueLevelingTests: students.filter((student) => student.levelingTest.status === "overdue").length,
  };
}
