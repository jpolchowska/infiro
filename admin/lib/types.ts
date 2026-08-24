export type Section = {
  id: number;
  title: string;
  description: string | null;
  subsectionCount: number;
  taskCount: number;
};

export type SectionDetail = Section & {
  subsections: Subsection[];
  materials: Material[];
};

export type Subsection = {
  id: number;
  sectionId: number;
  title: string;
  description: string | null;
  taskCount: number;
};

export type SubsectionDetail = Subsection & {
  tasks: Task[];
  materials: Material[];
};

export type TaskDifficulty = 1 | 2 | 3 | 4 | 5;

export type TaskOption = {
  id: number;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
};

export type Task = {
  id: number;
  subsectionId: number;
  title: string;
  bodyText: string;
  imageUrl: string | null;
  difficulty: TaskDifficulty;
  options: TaskOption[];
};

export type MaterialType = "text" | "pdf" | "image";

export type Material = {
  id: number;
  sectionId: number | null;
  subsectionId: number | null;
  type: MaterialType;
  title: string;
  contentText: string | null;
  fileUrl: string | null;
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
