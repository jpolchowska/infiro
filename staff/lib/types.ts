export type Section = {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
  subsectionCount: number;
  taskCount: number;
  finalTestQuestionCount: number;
};

export type SectionDetail = Section & {
  subsections: Subsection[];
};

export type Subsection = {
  id: number;
  sectionId: number;
  title: string;
  description: string | null;
  orderIndex: number;
  taskCount: number;
};

export type SubsectionDetail = Subsection & {
  tasks: TaskSummary[];
  ebook: { id: number; title: string } | null;
};

export type TaskType = "single_choice" | "short_answer" | "memory";

export type TaskDifficulty = 1 | 2 | 3;

export type AnswerOption = {
  id: number;
  text: string;
  isCorrect: boolean;
};

export type MemoryPair = {
  a: string;
  b: string;
};

export type TaskContent = {
  prompt: string;
  options: AnswerOption[];
  acceptedAnswers: string[];
  memoryPairs: MemoryPair[];
};

export type TaskStats = {
  attempts: number;
  correctAttempts: number;
  studentsAttempted: number;
  studentsSolved: number;
  accuracy: number | null;
};

export type TaskSummary = TaskContent & {
  id: number;
  subsectionId: number;
  contentKey: string | null;
  type: TaskType;
  difficulty: TaskDifficulty | null;
  orderIndex: number;
  themes: string[];
  stats: TaskStats;
};

export type TaskVariant = TaskContent & {
  theme: string;
};

export type TaskDetail = TaskSummary & {
  sectionId: number;
  sectionTitle: string;
  subsectionTitle: string;
  variants: TaskVariant[];
};

export type FinalTestQuestion = TaskContent & {
  id: number;
  contentKey: string | null;
  type: TaskType;
  orderIndex: number;
  themes: string[];
};

export type FinalTestPreview = {
  sectionId: number;
  sectionTitle: string;
  questions: FinalTestQuestion[];
  attempts: number;
  studentsAttempted: number;
};

export type CalloutStyle = "zapamietaj" | "wskazowka" | "uwaga" | "definicja";

export type EbookBlock =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; file: string; alt: string; width: number; height: number }
  | { type: "callout"; style: CalloutStyle; text: string };

export type Ebook = {
  id: number;
  subsectionId: number;
  title: string;
  intro: string | null;
  blocks: EbookBlock[];
};

export type Teacher = {
  id: number;
  name: string | null;
  email: string | null;
};

export type LevelingTestStatus = "not_taken" | "up_to_date" | "due" | "overdue";

export type LevelingTestState = {
  status: LevelingTestStatus;
  lastCompletedAt: string | null;
  dueAt: string | null;
  deadlineAt: string | null;
};

export type TestScore = {
  score: number;
  total: number;
  completedAt: string | null;
};

export type AttemptSummary = TestScore & {
  id: number;
};

export type Student = {
  id: number;
  name: string | null;
  email: string | null;
  interest: string | null;
  joinedAt: string | null;
  teacherId: number | null;
  teacherName: string | null;
  solvedTasks: number;
  totalTasks: number;
  accuracy: number | null;
  totalAttempts: number;
  correctAttempts: number;
  lastActivity: string | null;
  levelingTest: LevelingTestState;
  lastLevelingTest: TestScore | null;
};

export type CurrentSubsection = {
  subsectionId: number;
  subsectionTitle: string;
  sectionTitle: string;
  solvedTasks: number;
  totalTasks: number;
};

export type StudentActivity = {
  answersLast7Days: number;
  answersLast30Days: number;
  activeDaysLast30Days: number;
};

export type SubsectionProgress = {
  subsectionId: number;
  subsectionTitle: string;
  solvedTasks: number;
  totalTasks: number;
  unlockedLevel: number;
};

export type FinalTestSummary = {
  questionCount: number;
  attempts: number;
  bestScore: number | null;
  lastScore: number | null;
  maxScore: number | null;
  lastCompletedAt: string | null;
  history: AttemptSummary[];
};

export type SectionProgress = {
  sectionId: number;
  sectionTitle: string;
  solvedTasks: number;
  totalTasks: number;
  subsections: SubsectionProgress[];
  finalTest: FinalTestSummary | null;
};

export type TaskReference = {
  taskId: number;
  contentKey: string | null;
  type: TaskType;
  prompt: string;
  subsectionTitle: string | null;
  sectionTitle: string | null;
};

export type PracticeItem = TaskReference & {
  attemptNumber: number;
};

export type ActivityItem = TaskReference & {
  isCorrect: boolean;
  attemptNumber: number;
  submittedAt: string | null;
};

export type SectionScore = {
  sectionId: number | null;
  sectionTitle: string;
  score: number;
  total: number;
};

export type LevelingTestAttempt = AttemptSummary & {
  perSection: SectionScore[];
};

export type StudentDetail = Student & {
  currentSubsection: CurrentSubsection | null;
  activity: StudentActivity;
  sections: SectionProgress[];
  needsPractice: PracticeItem[];
  recentActivity: ActivityItem[];
  levelingTests: LevelingTestAttempt[];
};

export type AnsweredQuestion = {
  contentKey: string | null;
  type: TaskType;
  prompt: string;
  isCorrect: boolean;
  givenAnswer: string | null;
  correctAnswer: string | null;
};

export type LevelingTestAttemptDetail = LevelingTestAttempt & {
  answers: AnsweredQuestion[];
};

export type FinalTestAttemptDetail = AttemptSummary & {
  sectionId: number;
  answers: AnsweredQuestion[];
};

export type LevelingTestSettings = {
  questionsPerSection: number;
  intervalDays: number;
  completionWindowDays: number;
  sectionCount: number;
  options: {
    questionsPerSection: number[];
    intervalDays: number[];
    completionWindowDays: { min: number; max: number };
  };
};
