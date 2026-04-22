import type { Page, Route } from '@playwright/test';

type UserRole = 'student' | 'teacher' | 'admin';
type ExamStatus = 'draft' | 'published' | 'completed';
type SubmissionStatus = 'submitted' | 'graded';

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
  department?: string;
  phone?: string;
  bio?: string;
};

type ClassRecord = {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  studentIds: string[];
  code: string;
  createdAt: string;
  description?: string;
};

type Question = {
  id: string;
  text: string;
  type: 'mcq' | 'short_answer' | 'essay';
  topic?: string | null;
  options?: string[];
  correctAnswer?: string;
  marks: number;
};

type Exam = {
  id: string;
  title: string;
  description: string;
  classId: string;
  teacherId: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  questions: Question[];
  createdAt: string;
  extraTimeMinutes?: number;
  attemptLimit?: number;
  attemptsUsed?: number;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  accessibilityPreferences?: string[];
};

type Submission = {
  id: string;
  examId: string;
  studentId: string;
  answers: Array<{ questionId: string; answer: string; marksAwarded?: number }>;
  totalScore?: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  status: SubmissionStatus;
};

type AllData = {
  users: User[];
  exams: Exam[];
  classes: ClassRecord[];
  submissions: Submission[];
};

export const users = {
  student: {
    id: 'student-1',
    name: 'Sofia Student',
    email: 'student@example.com',
    role: 'student',
    joinedAt: '2026-04-01T09:00:00Z',
    department: 'Computer Science',
  } satisfies User,
  studentTwo: {
    id: 'student-2',
    name: 'Marco Student',
    email: 'marco@example.com',
    role: 'student',
    joinedAt: '2026-04-01T09:00:00Z',
    department: 'Computer Science',
  } satisfies User,
  teacher: {
    id: 'teacher-1',
    name: 'Theo Teacher',
    email: 'teacher@example.com',
    role: 'teacher',
    joinedAt: '2026-03-15T09:00:00Z',
    department: 'Mathematics',
  } satisfies User,
  admin: {
    id: 'admin-1',
    name: 'Ada Admin',
    email: 'admin@example.com',
    role: 'admin',
    joinedAt: '2026-03-01T09:00:00Z',
    department: 'Operations',
  } satisfies User,
};

export const classes = {
  discreteMath: {
    id: 'class-1',
    name: 'Discrete Mathematics A',
    subject: 'Discrete Mathematics',
    teacherId: users.teacher.id,
    studentIds: [users.student.id, users.studentTwo.id],
    code: 'DISC-A1',
    createdAt: '2026-04-01T09:00:00Z',
    description: 'Core logic and proofs',
  } satisfies ClassRecord,
};

export const exams = {
  logicMidterm: {
    id: 'exam-1',
    title: 'Logic Midterm',
    description: 'A mixed exam covering logic, truth tables, and short proofs.',
    classId: classes.discreteMath.id,
    teacherId: users.teacher.id,
    duration: 60,
    totalMarks: 100,
    passingMarks: 50,
    startDate: '2026-04-20T08:00',
    endDate: '2026-04-30T18:00',
    status: 'published',
    createdAt: '2026-04-10T09:00:00Z',
    questions: [
      {
        id: 'q-1',
        text: 'Which statement is logically equivalent to p → q?',
        type: 'mcq',
        topic: 'Logic',
        options: ['¬p ∨ q', 'p ∨ q', 'p ∧ q', '¬q'],
        correctAnswer: '¬p ∨ q',
        marks: 10,
      },
      {
        id: 'q-2',
        text: 'Explain why a contradiction cannot be true in any valuation.',
        type: 'essay',
        topic: 'Proof',
        marks: 90,
      },
    ],
  } satisfies Exam,
};

export function createAllData(overrides: Partial<AllData> = {}): AllData {
  return {
    users: [users.student, users.studentTwo, users.teacher, users.admin],
    exams: [exams.logicMidterm],
    classes: [classes.discreteMath],
    submissions: [],
    ...overrides,
  };
}

function jsonOk(route: Route, payload: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

export async function seedSession(page: Page, user: User, token = 'playwright-token') {
  await page.addInitScript(
    ({ currentUser, authToken }) => {
      window.localStorage.setItem('examhub_user', JSON.stringify(currentUser));
      window.localStorage.setItem('examhub_token', authToken);
    },
    { currentUser: user, authToken: token },
  );
}

export async function mockDataAll(page: Page, data: AllData) {
  await page.route('**/api/data/all', route => jsonOk(route, data));
}

export async function mockLogin(page: Page, user: User, data: AllData) {
  await page.route('**/api/auth/login', async route => {
    await jsonOk(route, { token: 'playwright-token', user });
  });
  await mockDataAll(page, data);
}

export async function mockRegister(page: Page, user: User, data: AllData) {
  await page.route('**/api/auth/register', async route => {
    await jsonOk(route, { token: 'playwright-token', user });
  });
  await mockDataAll(page, data);
}

export async function mockSubmitExam(page: Page) {
  await page.route('**/api/results/submit', async route => {
    const body = route.request().postDataJSON();
    await jsonOk(route, {
      id: 'submission-1',
      examId: body.examId,
      studentId: users.student.id,
      answers: body.answers ?? [],
      submittedAt: body.submittedAt,
      status: 'submitted',
    });
  });
}

export async function mockViolationReports(page: Page) {
  await page.route('**/api/exams/*/violations', async route => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      await jsonOk(route, {
        id: Date.now(),
        exam_id: exams.logicMidterm.id,
        student_id: users.student.id,
        violation_no: 1,
        violation_type: body.type,
        details: body.details ?? null,
        occurred_at: '2026-04-22T10:00:00Z',
      });
      return;
    }

    await jsonOk(route, []);
  });
}

export async function mockTeacherViolationQueue(page: Page) {
  await page.route('**/api/exams/*/violations', async route => {
    await jsonOk(route, [
      {
        id: 1,
        exam_id: exams.logicMidterm.id,
        student_id: users.student.id,
        violation_no: 1,
        violation_type: 'tab_switch',
        details: 'Violation #1 detected during exam',
        occurred_at: '2026-04-22T10:03:00Z',
      },
      {
        id: 2,
        exam_id: exams.logicMidterm.id,
        student_id: users.student.id,
        violation_no: 2,
        violation_type: 'right_click',
        details: 'Violation #2 detected during exam',
        occurred_at: '2026-04-22T10:05:00Z',
      },
    ]);
  });

  await page.route('**/api/exams/*/violation-cases', async route => {
    if (route.request().method() === 'GET') {
      await jsonOk(route, [
        {
          id: 'case-1',
          examId: exams.logicMidterm.id,
          studentId: users.student.id,
          studentName: users.student.name,
          studentEmail: users.student.email,
          severity: 'medium',
          outcome: 'pending',
          teacherNotes: null,
          reviewedBy: null,
          reviewerName: null,
          reviewedAt: null,
          createdAt: '2026-04-22T10:06:00Z',
          updatedAt: '2026-04-22T10:06:00Z',
        },
      ]);
      return;
    }

    await jsonOk(route, {
      id: 'case-1',
      examId: exams.logicMidterm.id,
      studentId: users.student.id,
      studentName: users.student.name,
      studentEmail: users.student.email,
      severity: 'high',
      outcome: 'warned',
      teacherNotes: 'Reviewed in Playwright',
      reviewedBy: users.teacher.id,
      reviewerName: users.teacher.name,
      reviewedAt: '2026-04-22T10:10:00Z',
      createdAt: '2026-04-22T10:06:00Z',
      updatedAt: '2026-04-22T10:10:00Z',
    });
  });
}

export async function mockDocsVerify(page: Page) {
  await page.route('**/api/docs/verify', async route => {
    await jsonOk(route, {
      generatedAt: '2026-04-22T10:12:00Z',
      summary: {
        required: 13,
        matched: 13,
        missing: 0,
      },
      checks: [
        {
          group: 'Auth',
          method: 'POST',
          path: '/api/auth/login',
          exists: true,
          matchedRoute: '/auth/login',
          canonicalPath: '/api/auth/login',
          sourceFile: 'backend/src/Routing/Routes/ApiRouteRegistry.php',
        },
      ],
    });
  });
}
