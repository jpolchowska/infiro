import { apiFetch, fetchOrUndefined } from "@/lib/api";
import type { Student, StudentDetail, Teacher } from "@/lib/types";

type RawStudent = {
  id: number;
  name: string | null;
  email: string | null;
  teacher_id: number | null;
  solved_tasks: number;
  total_tasks: number;
  accuracy: number | null;
  total_attempts: number;
  correct_attempts: number;
  last_activity: string | null;
  leveling_test_completed_at: string | null;
};

type RawStudentDetail = RawStudent & {
  section_progress: { section_title: string; solved_tasks: number; total_tasks: number }[];
  needs_practice: { task_title: string; subsection_title: string; attempt_number: number }[];
  recent_activity: {
    task_title: string;
    subsection_title: string;
    is_correct: boolean;
    attempt_number: number;
    submitted_at: string;
  }[];
};

function mapStudent(raw: RawStudent): Student {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    teacherId: raw.teacher_id,
    solvedTasks: raw.solved_tasks,
    totalTasks: raw.total_tasks,
    accuracy: raw.accuracy,
    totalAttempts: raw.total_attempts,
    correctAttempts: raw.correct_attempts,
    lastActivity: raw.last_activity,
    levelingTestCompletedAt: raw.leveling_test_completed_at,
  };
}

export async function getStudents(token: string): Promise<Student[]> {
  const raw = await apiFetch<RawStudent[]>("/api/admin/students", { token });
  return raw.map(mapStudent);
}

export async function getTeachers(token: string): Promise<Teacher[]> {
  return apiFetch<Teacher[]>("/api/admin/teachers", { token });
}

export async function updateStudentTeacher(
  token: string,
  studentId: number,
  teacherId: number | null
): Promise<Student> {
  const raw = await apiFetch<RawStudent>(`/api/admin/students/${studentId}`, {
    token,
    method: "PATCH",
    json: { teacher_id: teacherId },
  });
  return mapStudent(raw);
}

export async function getStudentDetail(
  token: string,
  id: number
): Promise<StudentDetail | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawStudentDetail>(`/api/admin/students/${id}`, { token });
    return {
      ...mapStudent(raw),
      sectionProgress: raw.section_progress.map((sp) => ({
        sectionTitle: sp.section_title,
        solvedTasks: sp.solved_tasks,
        totalTasks: sp.total_tasks,
      })),
      needsPractice: raw.needs_practice.map((np) => ({
        taskTitle: np.task_title,
        subsectionTitle: np.subsection_title,
        attemptNumber: np.attempt_number,
      })),
      recentActivity: raw.recent_activity.map((ra) => ({
        taskTitle: ra.task_title,
        subsectionTitle: ra.subsection_title,
        isCorrect: ra.is_correct,
        attemptNumber: ra.attempt_number,
        submittedAt: ra.submitted_at,
      })),
    };
  });
}
