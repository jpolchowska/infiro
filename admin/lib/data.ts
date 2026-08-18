import type { Section, Subsection, Task, Student, StudentDetail } from "./types";

const SUBSECTIONS: Subsection[] = [
  { id: 1, sectionId: 1, title: "Dodawanie i odejmowanie", description: "Dodawanie i odejmowanie liczb całkowitych.", taskCount: 14 },
  { id: 2, sectionId: 1, title: "Mnożenie i dzielenie", description: "Mnożenie i dzielenie liczb całkowitych.", taskCount: 10 },
  { id: 3, sectionId: 1, title: "Ułamki", description: "Dodawanie i odejmowanie ułamków.", taskCount: 10 },
  { id: 4, sectionId: 1, title: "Liczby dziesiętne", description: "Dodawanie i odejmowanie liczb dziesiętnych.", taskCount: 10 },

  { id: 5, sectionId: 2, title: "Wyrażenia i zmienne", description: "Obliczanie wartości wyrażeń algebraicznych.", taskCount: 10 },
  { id: 6, sectionId: 2, title: "Równania liniowe", description: "Rozwiązywanie równań postaci ax + b = c.", taskCount: 22 },
  { id: 7, sectionId: 2, title: "Nierówności", description: "Wyrażenia z >, < i ≥.", taskCount: 10 },
  { id: 8, sectionId: 2, title: "Potęgi", description: "Działania na potęgach liczb.", taskCount: 10 },

  { id: 9, sectionId: 3, title: "Figury i kąty", description: "Szukanie brakujących kątów w trójkątach.", taskCount: 10 },
  { id: 10, sectionId: 3, title: "Obwód i pole", description: "Obliczanie obwodu i pola prostokątów.", taskCount: 10 },
  { id: 11, sectionId: 3, title: "Okręgi i koła", description: "Pole i obwód koła.", taskCount: 10 },
  { id: 12, sectionId: 3, title: "Objętość i pole powierzchni", description: "Objętość i pole powierzchni prostopadłościanów.", taskCount: 10 },

  { id: 13, sectionId: 4, title: "Jednostki i przeliczenia", description: "Przeliczanie jednostek miary.", taskCount: 10 },
  { id: 14, sectionId: 4, title: "Średnie i statystyka", description: "Obliczanie średniej arytmetycznej.", taskCount: 10 },
  { id: 15, sectionId: 4, title: "Proporcje", description: "Rozwiązywanie proporcji.", taskCount: 10 },
  { id: 16, sectionId: 4, title: "Prawdopodobieństwo", description: "Obliczanie szansy zdarzenia.", taskCount: 10 },

  { id: 17, sectionId: 5, title: "Pieniądze i zakupy", description: "Obliczanie sum i kosztów.", taskCount: 10 },
  { id: 18, sectionId: 5, title: "Czas i prędkość", description: "Zależności między drogą, prędkością i czasem.", taskCount: 10 },
  { id: 19, sectionId: 5, title: "Zadania mieszane", description: "Czytanie i rozwiązywanie zadań tekstowych.", taskCount: 10 },
  { id: 20, sectionId: 5, title: "Zagadki logiczne", description: "Rozpoznawanie wzorców.", taskCount: 10 },
];

const SECTIONS: Section[] = [
  {
    id: 1,
    title: "Liczby i działania",
    description: "Cztery podstawowe działania, ułamki i liczby dziesiętne.",
    subsectionCount: 4,
    taskCount: 44,
  },
  {
    id: 2,
    title: "Algebra",
    description: "Zmienne, wyrażenia i równania.",
    subsectionCount: 4,
    taskCount: 52,
  },
  {
    id: 3,
    title: "Geometria",
    description: "Figury, kąty i pomiary w 2D i 3D.",
    subsectionCount: 4,
    taskCount: 40,
  },
  {
    id: 4,
    title: "Pomiary i dane",
    description: "Jednostki, średnie, proporcje i prawdopodobieństwo.",
    subsectionCount: 4,
    taskCount: 40,
  },
  {
    id: 5,
    title: "Zadania tekstowe",
    description: "Zastosowanie matematyki w sytuacjach z życia.",
    subsectionCount: 4,
    taskCount: 40,
  },
];

const TASKS: Task[] = [
  { id: 1, subsectionId: 1, title: "Znajdź różnicę", bodyText: "Ile to jest 4 − 2?", difficulty: 1, correctAnswer: "2", variantCount: 1 },
  { id: 2, subsectionId: 2, title: "Pomnóż", bodyText: "Ile to jest 2 × 2?", difficulty: 1, correctAnswer: "4", variantCount: 1 },
  { id: 3, subsectionId: 3, title: "Dodaj ułamki", bodyText: "Ile to jest 2/3 + 2/3? Podaj wynik jako ułamek nieskracalny.", difficulty: 1, correctAnswer: "1 1/3", variantCount: 1 },
  { id: 4, subsectionId: 4, title: "Dodaj liczby dziesiętne", bodyText: "Ile to jest 0,5 + 0,9?", difficulty: 1, correctAnswer: "1,4", variantCount: 1 },
  { id: 5, subsectionId: 5, title: "Oblicz wartość wyrażenia", bodyText: "Ile wynosi 1x + 6 dla x = 3?", difficulty: 1, correctAnswer: "9", variantCount: 1 },
  { id: 6, subsectionId: 6, title: "Rozwiąż równanie", bodyText: "Rozwiąż: 1x + 7 = 11", difficulty: 1, correctAnswer: "x = 4", variantCount: 3 },
  { id: 7, subsectionId: 9, title: "Znajdź brakujący kąt", bodyText: "Dwa kąty trójkąta mają 42° i 47°. Ile wynosi trzeci kąt?", difficulty: 1, correctAnswer: "91°", variantCount: 1 },
  { id: 8, subsectionId: 17, title: "Oblicz koszt całkowity", bodyText: "Jabłko kosztuje 6,02 zł. Ile kosztują 3 jabłka?", difficulty: 1, correctAnswer: "18,06 zł", variantCount: 1 },
];

const STUDENTS: Student[] = [
  { id: 1, name: "Zosia Kowalska", email: "zosia.kowalska@example.com", solvedTasks: 92, totalTasks: 216, accuracy: 82, totalAttempts: 210, lastActivity: "dzisiaj" },
  { id: 2, name: "Jan Nowak", email: "jan.nowak@example.com", solvedTasks: 45, totalTasks: 216, accuracy: 54, totalAttempts: 96, lastActivity: "2 dni temu" },
];

export async function getSections(): Promise<Section[]> {
  return SECTIONS;
}

export async function getSection(id: number): Promise<Section | undefined> {
  return SECTIONS.find((s) => s.id === id);
}

export async function getSubsections(sectionId: number): Promise<Subsection[]> {
  return SUBSECTIONS.filter((s) => s.sectionId === sectionId);
}

export async function getSubsection(id: number): Promise<Subsection | undefined> {
  return SUBSECTIONS.find((s) => s.id === id);
}

export async function getTasks(subsectionId: number): Promise<Task[]> {
  return TASKS.filter((t) => t.subsectionId === subsectionId);
}

export async function getStudents(): Promise<Student[]> {
  return STUDENTS;
}

export async function getStudent(id: number): Promise<Student | undefined> {
  return STUDENTS.find((s) => s.id === id);
}

const STUDENT_DETAILS: Record<number, Pick<StudentDetail, "sectionProgress" | "needsPractice" | "recentActivity">> = {
  1: {
    sectionProgress: [
      { sectionTitle: "Liczby i działania", solvedTasks: 40, totalTasks: 44 },
      { sectionTitle: "Algebra", solvedTasks: 30, totalTasks: 52 },
      { sectionTitle: "Geometria", solvedTasks: 22, totalTasks: 40 },
    ],
    needsPractice: [
      { taskTitle: "Rozwiąż równanie z ułamkiem", subsectionTitle: "Równania liniowe", attemptNumber: 2 },
    ],
    recentActivity: [
      { taskTitle: "Znajdź różnicę", subsectionTitle: "Dodawanie i odejmowanie", isCorrect: true, attemptNumber: 1, submittedAt: "dziś, 14:02" },
      { taskTitle: "Pole trójkąta", subsectionTitle: "Figury i kąty", isCorrect: false, attemptNumber: 2, submittedAt: "wczoraj" },
    ],
  },
  2: {
    sectionProgress: [
      { sectionTitle: "Liczby i działania", solvedTasks: 20, totalTasks: 44 },
      { sectionTitle: "Algebra", solvedTasks: 15, totalTasks: 52 },
    ],
    needsPractice: [],
    recentActivity: [
      { taskTitle: "Pomnóż", subsectionTitle: "Mnożenie i dzielenie", isCorrect: true, attemptNumber: 1, submittedAt: "2 dni temu" },
    ],
  },
};

export async function getStudentDetail(id: number): Promise<StudentDetail | undefined> {
  const student = STUDENTS.find((s) => s.id === id);
  if (!student) return undefined;
  const extra = STUDENT_DETAILS[id] ?? { sectionProgress: [], needsPractice: [], recentActivity: [] };
  return { ...student, ...extra };
}
