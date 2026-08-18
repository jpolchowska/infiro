export type Section = {
  id: number;
  title: string;
  description: string;
  subsectionCount: number;
  taskCount: number;
};

export type Subsection = {
  id: number;
  sectionId: number;
  title: string;
  description: string;
  taskCount: number;
};

export type TaskDifficulty = 1 | 2 | 3 | 4 | 5;

export type Task = {
  id: number;
  subsectionId: number;
  title: string;
  bodyText: string;
  difficulty: TaskDifficulty;
  correctAnswer: string;
  variantCount: number;
};

export type Student = {
  id: number;
  name: string;
  email: string;
  solvedTasks: number;
  totalTasks: number;
  accuracy: number | null;
  totalAttempts: number;
  lastActivity: string | null;
};

export type SectionProgress = {
  sectionTitle: string;
  solvedTasks: number;
  totalTasks: number;
};

export type NeedsPracticeItem = {
  taskTitle: string;
  subsectionTitle: string;
  attemptNumber: number;
};

export type ActivityItem = {
  taskTitle: string;
  subsectionTitle: string;
  isCorrect: boolean;
  attemptNumber: number;
  submittedAt: string;
};

export type StudentDetail = Student & {
  sectionProgress: SectionProgress[];
  needsPractice: NeedsPracticeItem[];
  recentActivity: ActivityItem[];
};
