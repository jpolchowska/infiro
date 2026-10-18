import { apiFetch, fetchOrUndefined } from "@/lib/api";
import type {
  AnsweredQuestion,
  AttemptSummary,
  FinalTestAttemptDetail,
  LevelingTestAttempt,
  LevelingTestAttemptDetail,
  LevelingTestStatus,
  SectionScore,
  Student,
  StudentDetail,
  TaskReference,
  TaskType,
  Teacher,
  TestScore,
} from "@/lib/types";

type RawTestScore = { score: number; total: number; completedAt: string | null };
type RawAttemptSummary = RawTestScore & { id: number };
type RawSectionScore = { section_id: number | null; section_title: string; score: number; total: number };

type RawStudent = {
  id: number;
  username: string | null;
  interest: string | null;
  joined_at: string | null;
  teacher_id: number | null;
  teacher_username: string | null;
  teacher_name: string | null;
  solved_tasks: number;
  total_tasks: number;
  accuracy: number | null;
  total_attempts: number;
  correct_attempts: number;
  last_activity: string | null;
  leveling_test: {
    status: LevelingTestStatus;
    last_completed_at: string | null;
    due_at: string | null;
    deadline_at: string | null;
  };
  last_leveling_test: { score: number; total: number; completed_at: string | null } | null;
};

type RawTaskReference = {
  task_id: number;
  content_key: string | null;
  type: TaskType;
  prompt: string;
  subsection_title: string | null;
  section_title: string | null;
};

type RawStudentDetail = RawStudent & {
  current_subsection: {
    subsection_id: number;
    subsection_title: string;
    section_title: string;
    solved_tasks: number;
    total_tasks: number;
  } | null;
  activity: {
    answers_last_7_days: number;
    answers_last_30_days: number;
    active_days_last_30_days: number;
  };
  sections: {
    section_id: number;
    section_title: string;
    solved_tasks: number;
    total_tasks: number;
    subsections: {
      subsection_id: number;
      subsection_title: string;
      solved_tasks: number;
      total_tasks: number;
      unlocked_level: number;
    }[];
    final_test: {
      question_count: number;
      attempts: number;
      best_score: number | null;
      last_score: number | null;
      max_score: number | null;
      last_completed_at: string | null;
      history: RawAttemptSummary[];
    } | null;
  }[];
  needs_practice: (RawTaskReference & { attempt_number: number })[];
  recent_activity: (RawTaskReference & { is_correct: boolean; attempt_number: number; submitted_at: string | null })[];
  leveling_tests: (RawAttemptSummary & { per_section: RawSectionScore[] })[];
};

type RawAnsweredQuestion = {
  content_key: string | null;
  type: TaskType;
  prompt: string;
  is_correct: boolean;
  given_answer: string | null;
  correct_answer: string | null;
};

type RawLevelingTestAttemptDetail = RawAttemptSummary & {
  per_section: RawSectionScore[];
  answers: RawAnsweredQuestion[];
};

type RawFinalTestAttemptDetail = RawAttemptSummary & {
  section_id: number;
  answers: RawAnsweredQuestion[];
};

function mapTestScore(raw: RawTestScore): TestScore {
  return { score: raw.score, total: raw.total, completedAt: raw.completedAt };
}

function mapAttemptSummary(raw: RawAttemptSummary): AttemptSummary {
  return { ...mapTestScore(raw), id: raw.id };
}

function mapSectionScore(raw: RawSectionScore): SectionScore {
  return { sectionId: raw.section_id, sectionTitle: raw.section_title, score: raw.score, total: raw.total };
}

function mapLevelingTestAttempt(raw: RawAttemptSummary & { per_section: RawSectionScore[] }): LevelingTestAttempt {
  return { ...mapAttemptSummary(raw), perSection: raw.per_section.map(mapSectionScore) };
}

function mapTaskReference(raw: RawTaskReference): TaskReference {
  return {
    taskId: raw.task_id,
    contentKey: raw.content_key,
    type: raw.type,
    prompt: raw.prompt,
    subsectionTitle: raw.subsection_title,
    sectionTitle: raw.section_title,
  };
}

function mapAnsweredQuestion(raw: RawAnsweredQuestion): AnsweredQuestion {
  return {
    contentKey: raw.content_key,
    type: raw.type,
    prompt: raw.prompt,
    isCorrect: raw.is_correct,
    givenAnswer: raw.given_answer,
    correctAnswer: raw.correct_answer,
  };
}

function mapStudent(raw: RawStudent): Student {
  return {
    id: raw.id,
    username: raw.username,
    interest: raw.interest,
    joinedAt: raw.joined_at,
    teacherId: raw.teacher_id,
    teacherUsername: raw.teacher_username,
    teacherName: raw.teacher_name,
    solvedTasks: raw.solved_tasks,
    totalTasks: raw.total_tasks,
    accuracy: raw.accuracy,
    totalAttempts: raw.total_attempts,
    correctAttempts: raw.correct_attempts,
    lastActivity: raw.last_activity,
    levelingTest: {
      status: raw.leveling_test.status,
      lastCompletedAt: raw.leveling_test.last_completed_at,
      dueAt: raw.leveling_test.due_at,
      deadlineAt: raw.leveling_test.deadline_at,
    },
    lastLevelingTest: raw.last_leveling_test
      ? {
          score: raw.last_leveling_test.score,
          total: raw.last_leveling_test.total,
          completedAt: raw.last_leveling_test.completed_at,
        }
      : null,
  };
}

export async function getStudents(token: string): Promise<Student[]> {
  const raw = await apiFetch<RawStudent[]>("/api/admin/students", { token });
  return raw.map(mapStudent);
}

export async function getStudentDetail(token: string, id: number): Promise<StudentDetail | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawStudentDetail>(`/api/admin/students/${id}`, { token });
    return {
      ...mapStudent(raw),
      currentSubsection: raw.current_subsection
        ? {
            subsectionId: raw.current_subsection.subsection_id,
            subsectionTitle: raw.current_subsection.subsection_title,
            sectionTitle: raw.current_subsection.section_title,
            solvedTasks: raw.current_subsection.solved_tasks,
            totalTasks: raw.current_subsection.total_tasks,
          }
        : null,
      activity: {
        answersLast7Days: raw.activity.answers_last_7_days,
        answersLast30Days: raw.activity.answers_last_30_days,
        activeDaysLast30Days: raw.activity.active_days_last_30_days,
      },
      sections: raw.sections.map((section) => ({
        sectionId: section.section_id,
        sectionTitle: section.section_title,
        solvedTasks: section.solved_tasks,
        totalTasks: section.total_tasks,
        subsections: section.subsections.map((subsection) => ({
          subsectionId: subsection.subsection_id,
          subsectionTitle: subsection.subsection_title,
          solvedTasks: subsection.solved_tasks,
          totalTasks: subsection.total_tasks,
          unlockedLevel: subsection.unlocked_level,
        })),
        finalTest: section.final_test
          ? {
              questionCount: section.final_test.question_count,
              attempts: section.final_test.attempts,
              bestScore: section.final_test.best_score,
              lastScore: section.final_test.last_score,
              maxScore: section.final_test.max_score,
              lastCompletedAt: section.final_test.last_completed_at,
              history: section.final_test.history.map(mapAttemptSummary),
            }
          : null,
      })),
      needsPractice: raw.needs_practice.map((item) => ({
        ...mapTaskReference(item),
        attemptNumber: item.attempt_number,
      })),
      recentActivity: raw.recent_activity.map((item) => ({
        ...mapTaskReference(item),
        isCorrect: item.is_correct,
        attemptNumber: item.attempt_number,
        submittedAt: item.submitted_at,
      })),
      levelingTests: raw.leveling_tests.map(mapLevelingTestAttempt),
    };
  });
}

export async function getLevelingTestAttempt(
  token: string,
  studentId: number,
  attemptId: number
): Promise<LevelingTestAttemptDetail | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawLevelingTestAttemptDetail>(
      `/api/admin/students/${studentId}/leveling-tests/${attemptId}`,
      { token }
    );
    return { ...mapLevelingTestAttempt(raw), answers: raw.answers.map(mapAnsweredQuestion) };
  });
}

export async function getFinalTestAttempt(
  token: string,
  studentId: number,
  attemptId: number
): Promise<FinalTestAttemptDetail | undefined> {
  return fetchOrUndefined(async () => {
    const raw = await apiFetch<RawFinalTestAttemptDetail>(
      `/api/admin/students/${studentId}/final-tests/${attemptId}`,
      { token }
    );
    return {
      ...mapAttemptSummary(raw),
      sectionId: raw.section_id,
      answers: raw.answers.map(mapAnsweredQuestion),
    };
  });
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
