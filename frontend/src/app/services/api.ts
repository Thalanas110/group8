/**
 * ExamHub API Service (PHP backend only).
 */

// â”€â”€â”€ Backend URLs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const envPhpBaseUrl = (import.meta.env.VITE_PHP_BASE_URL as string | undefined)?.trim();
export const PHP_BASE_URL = envPhpBaseUrl && envPhpBaseUrl !== ''
  ? envPhpBaseUrl
  : 'http://localhost/group8/api';


// â”€â”€â”€ Core HTTP Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = false,
): Promise<T> {
  const baseUrl = PHP_BASE_URL;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('examhub_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? err.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// â”€â”€â”€ Auth  POST /auth/register  POST /auth/login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  department?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string; name: string; email: string;
    role: 'student' | 'teacher' | 'admin';
    joinedAt: string; department?: string; phone?: string; bio?: string;
  };
}

export const authApi = {
  /** POST /api/auth/register */
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('POST', '/auth/register', payload),

  /** POST /api/auth/login */
  login: (payload: LoginPayload) =>
    request<AuthResponse>('POST', '/auth/login', payload),

  /** DELETE /api/auth/logout */
  logout: () =>
    request<{ success: boolean }>('DELETE', '/auth/logout', undefined, true),
};

// â”€â”€â”€ Profile  GET /users/profile  PUT /users/profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface UserProfile {
  id: string; name: string; email: string;
  role: 'student' | 'teacher' | 'admin';
  department?: string; phone?: string; bio?: string; joinedAt: string;
}

export const userApi = {
  /** GET /api/users/profile */
  getProfile: () =>
    request<UserProfile>('GET', '/users/profile', undefined, true),

  /** PUT /api/users/profile */
  updateProfile: (payload: Partial<Pick<UserProfile, 'name' | 'department' | 'phone' | 'bio'>>) =>
    request<UserProfile>('PUT', '/users/profile', payload, true),

  /** GET /api/users  (admin) */
  getAll: () =>
    request<UserProfile[]>('GET', '/users', undefined, true),

  /** POST /api/users  (admin) */
  create: (payload: unknown) =>
    request<UserProfile>('POST', '/users', payload, true),

  /** PUT /api/users/:id  (admin) */
  update: (id: string, payload: unknown) =>
    request<UserProfile>('PUT', `/users/${id}`, payload, true),

  /** DELETE /api/users/:id  (admin) */
  remove: (id: string) =>
    request<{ success: boolean }>('DELETE', `/users/${id}`, undefined, true),
};

// â”€â”€â”€ Exams  POST /exams  GET /exams  GET /exams/{id} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ExamPayload {
  title: string; description: string; classId: string;
  duration: number; totalMarks: number; passingMarks: number;
  startDate: string; endDate: string;
  status: 'draft' | 'published' | 'completed';
  questions: {
    text: string; type: 'mcq' | 'short_answer' | 'essay';
    topic?: string | null;
    options?: string[]; correctAnswer?: string; marks: number;
  }[];
}

export interface ExamResponse {
  id: string; title: string; description: string; classId: string;
  teacherId: string; duration: number; totalMarks: number; passingMarks: number;
  startDate: string; endDate: string;
  status: 'draft' | 'published' | 'completed';
  questions: {
    id: string; text: string; type: 'mcq' | 'short_answer' | 'essay';
    topic?: string | null;
    options?: string[]; correctAnswer?: string; marks: number;
  }[];
  createdAt: string;
}

export const examApi = {
  /** POST /api/exams */
  create: (payload: unknown) =>
    request<ExamResponse>('POST', '/exams', payload, true),

  /** GET /api/exams */
  getAll: () =>
    request<ExamResponse[]>('GET', '/exams', undefined, true),

  /** GET /api/exams/{exam_id} */
  getById: (examId: string) =>
    request<ExamResponse>('GET', `/exams/${examId}`, undefined, true),

  /** PUT /api/exams/:id */
  update: (id: string, payload: unknown) =>
    request<ExamResponse>('PUT', `/exams/${id}`, payload, true),

  /** DELETE /api/exams/:id */
  remove: (id: string) =>
    request<{ success: boolean }>('DELETE', `/exams/${id}`, undefined, true),
};

// â”€â”€â”€ Results  POST /results/submit  GET /results/student/{id} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface SubmitResultPayload {
  examId: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: string;
  questionTelemetry?: {
    questionId: string;
    topic?: string | null;
    timeSpentSeconds: number;
    visitCount: number;
    answerChangeCount: number;
  }[];
  id?: string;
}

export interface ResultResponse {
  id: string; examId: string; studentId: string;
  answers: { questionId: string; answer: string; marksAwarded?: number }[];
  totalScore?: number; percentage?: number; grade?: string;
  feedback?: string; submittedAt: string; gradedAt?: string;
  status: 'submitted' | 'graded';
}

export const resultApi = {
  /** POST /api/results/submit */
  submit: (payload: SubmitResultPayload) =>
    request<ResultResponse>('POST', '/results/submit', payload, true),

  /** GET /api/results/student/{student_id} */
  getByStudent: (studentId: string) =>
    request<ResultResponse[]>('GET', `/results/student/${studentId}`, undefined, true),

  /** PUT /api/results/:id/grade */
  grade: (id: string, grades: { questionId: string; marksAwarded: number }[], feedback: string) =>
    request<ResultResponse>('PUT', `/results/${id}/grade`, { grades, feedback }, true),
};

// â”€â”€â”€ Admin  GET /admin/exams  GET /admin/results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const adminApi = {
  /** GET /api/admin/exams */
  getExams: () =>
    request<(ExamResponse & { submissionCount: number; averageScore: number })[]>(
      'GET', '/admin/exams', undefined, true,
    ),

  /** GET /api/admin/results */
  getResults: () =>
    request<(ResultResponse & { studentName: string; examTitle: string })[]>(
      'GET', '/admin/results', undefined, true,
    ),
};

// â”€â”€â”€ Reports  GET /reports/exam-performance  GET /reports/pass-fail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ExamPerformanceReport {
  examId: string; examTitle: string; classId: string; className: string;
  totalSubmissions: number; averageScore: number;
  highestScore: number; lowestScore: number; passCount: number; failCount: number;
}

export interface PassFailReport {
  overall: { total: number; passed: number; failed: number; passRate: number };
  byExam: { examId: string; examTitle: string; passed: number; failed: number; passRate: number }[];
  byClass: { classId: string; className: string; passed: number; failed: number; passRate: number }[];
}

export interface QuestionAnalyticsCoverage {
  totalSubmissions: number;
  telemetryEnabledSubmissions: number;
  totalQuestions: number;
  topicTaggedQuestions: number;
}

export interface QuestionAnalyticsQuestion {
  examId: string;
  examTitle: string;
  classId: string;
  className: string;
  questionId: string;
  questionText: string;
  questionType: 'mcq' | 'short_answer' | 'essay' | string;
  topic?: string | null;
  attemptCount: number;
  gradedCount: number;
  averageScorePct?: number | null;
  correctRatePct?: number | null;
  averageTimeSpentSeconds?: number | null;
  telemetryCount: number;
}

export interface CommonWrongAnswerReport {
  examId: string;
  examTitle: string;
  classId: string;
  className: string;
  questionId: string;
  questionText: string;
  topic?: string | null;
  option: string;
  count: number;
  shareOfIncorrectPct: number;
}

export interface WeakTopicByClassReport {
  classId: string;
  className: string;
  topic: string;
  questionCount: number;
  gradedResponseCount: number;
  averageScorePct: number;
  averageTimeSpentSeconds?: number | null;
  telemetryCount: number;
}

export interface QuestionAnalyticsReport {
  generatedAt: string;
  coverage: QuestionAnalyticsCoverage;
  questions: QuestionAnalyticsQuestion[];
  hardestQuestions: QuestionAnalyticsQuestion[];
  slowestQuestions: QuestionAnalyticsQuestion[];
  commonWrongAnswers: CommonWrongAnswerReport[];
  weakTopicsByClass: WeakTopicByClassReport[];
}

export const reportApi = {
  /** GET /api/reports/exam-performance */
  getExamPerformance: () =>
    request<ExamPerformanceReport[]>('GET', '/reports/exam-performance', undefined, true),

  /** GET /api/reports/pass-fail */
  getPassFail: () =>
    request<PassFailReport>('GET', '/reports/pass-fail', undefined, true),

  /** GET /api/reports/question-analytics */
  getQuestionAnalytics: () =>
    request<QuestionAnalyticsReport>('GET', '/reports/question-analytics', undefined, true),
};

// â”€â”€â”€ Classes CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const classApi = {
  getAll: () => request<unknown[]>('GET', '/classes', undefined, true),
  create: (payload: unknown) => request<unknown>('POST', '/classes', payload, true),
  update: (id: string, payload: unknown) => request<unknown>('PUT', `/classes/${id}`, payload, true),
  remove: (id: string) => request<{ success: boolean }>('DELETE', `/classes/${id}`, undefined, true),
  join: (code: string) => request<unknown>('POST', '/classes/join', { code }, true),
  leave: (classId: string) => request<unknown>('POST', `/classes/${classId}/leave`, {}, true),
  enroll: (classId: string, studentId: string) =>
    request<unknown>('POST', `/classes/${classId}/enroll`, { studentId }, true),
  removeStudent: (classId: string, studentId: string) =>
    request<unknown>('DELETE', `/classes/${classId}/students/${studentId}`, undefined, true),
};

// â”€â”€â”€ Data (full state load) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AllData {
  users: (UserProfile & { password?: string })[];
  exams: ExamResponse[];
  classes: unknown[];
  submissions: ResultResponse[];
}

export const dataApi = {
  /** GET /api/data/all - loads all app state for the authenticated user */
  getAll: () => request<AllData>('GET', '/data/all', undefined, true),

  /** POST /api/data/reseed - resets database data to defaults */
  reseed: () => request<{ success: boolean; message: string }>('POST', '/data/reseed', {}, true),
};

// â”€â”€â”€ Endpoint Catalog (rendered in API Docs page) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ApiDocsVerifyCheck {
  group: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  exists: boolean;
  matchedRoute: string | null;
  canonicalPath: string;
  sourceFile: string | null;
}

export interface ApiDocsVerifyResult {
  generatedAt: string;
  summary: {
    required: number;
    matched: number;
    missing: number;
  };
  checks: ApiDocsVerifyCheck[];
}

export const docsApi = {
  /** GET /api/docs/verify - validates required API endpoints against backend route code */
  verify: () => request<ApiDocsVerifyResult>('GET', '/docs/verify', undefined, true),
};

// ─── Student Exam Accommodations ─────────────────────────────────────────────

export interface AccommodationRecord {
  examId: string;
  studentId: string;
  extraTimeMinutes: number;
  attemptLimit: number | null;
  alternateStartAt: string | null;
  alternateEndAt: string | null;
  accessibilityPreferences: string[];
}

export interface AccommodationPayload {
  extraTimeMinutes: number;
  attemptLimit: number | null;
  alternateStartAt: string | null;
  alternateEndAt: string | null;
  accessibilityPreferences: string[];
}

export const accommodationApi = {
  /** GET /api/exams/:examId/accommodations */
  listByExam: (examId: string) =>
    request<AccommodationRecord[]>('GET', `/exams/${examId}/accommodations`, undefined, true),

  /** PUT /api/exams/:examId/accommodations/:studentId */
  upsert: (examId: string, studentId: string, payload: AccommodationPayload) =>
    request<AccommodationRecord>('PUT', `/exams/${examId}/accommodations/${studentId}`, payload, true),

  /** DELETE /api/exams/:examId/accommodations/:studentId */
  remove: (examId: string, studentId: string) =>
    request<{ success: boolean }>('DELETE', `/exams/${examId}/accommodations/${studentId}`, undefined, true),
};

// ─── Anti-Cheat Violations ────────────────────────────────────────────────────

export type ViolationType = 'tab_switch' | 'window_blur' | 'right_click' | 'auto_submitted';

export interface ViolationRecord {
  id: number;
  exam_id: string;
  student_id: string;
  violation_no: number;
  violation_type: ViolationType;
  details: string | null;
  occurred_at: string;
}

export const violationApi = {
  /**
   * POST /api/exams/:examId/violations
   * Student reports a single anti-cheat violation.
   */
  report: (examId: string, type: ViolationType, details?: string) =>
    request<ViolationRecord>('POST', `/exams/${examId}/violations`, { type, details }, true),

  /**
   * GET /api/exams/:examId/violations
   * Teacher / admin retrieves all violations for an exam.
   */
  listByExam: (examId: string) =>
    request<ViolationRecord[]>('GET', `/exams/${examId}/violations`, undefined, true),
};

// ─── Anti-Cheat Case Review ───────────────────────────────────────────────────

export type ViolationCaseSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ViolationCaseOutcome  = 'pending' | 'dismissed' | 'warned' | 'score_penalized' | 'invalidated';

export interface ViolationCase {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  severity: ViolationCaseSeverity;
  outcome: ViolationCaseOutcome;
  teacherNotes: string | null;
  reviewedBy: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ViolationCasePayload {
  id?: string;
  severity: ViolationCaseSeverity;
  outcome: ViolationCaseOutcome;
  notes?: string;
}

export const violationCaseApi = {
  /** GET /api/exams/:examId/violation-cases */
  listByExam: (examId: string) =>
    request<ViolationCase[]>('GET', `/exams/${examId}/violation-cases`, undefined, true),

  /** PUT /api/exams/:examId/violation-cases/:studentId */
  upsert: (examId: string, studentId: string, payload: ViolationCasePayload) =>
    request<ViolationCase>('PUT', `/exams/${examId}/violation-cases/${studentId}`, payload, true),
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface EndpointDoc {
  id: string; method: HttpMethod; path: string;
  description: string; auth: boolean; role?: string;
  requestBody?: Record<string, { type: string; required: boolean; description: string }>;
  responseExample: unknown; group: string;
}

export const API_ENDPOINTS: EndpointDoc[] = [
  // AUTH
  {
    id: 'auth-register', method: 'POST', path: '/api/auth/register', group: 'Auth',
    description: 'Register a new user account. Returns a JWT token and user object.', auth: false,
    requestBody: {
      name: { type: 'string', required: true, description: 'Full name' },
      email: { type: 'string', required: true, description: 'Unique email address' },
      password: { type: 'string', required: true, description: 'Password (min 6 chars)' },
      role: { type: 'student | teacher | admin', required: true, description: 'User role' },
      department: { type: 'string', required: false, description: 'Department or faculty' },
    },
    responseExample: { token: 'uuid-session-token', user: { id: 'u1', name: 'Alice Smith', email: 'alice@example.com', role: 'student', joinedAt: '2026-02-24' } },
  },
  {
    id: 'auth-login', method: 'POST', path: '/api/auth/login', group: 'Auth',
    description: 'Authenticate a user with email and password. Returns a session token.', auth: false,
    requestBody: {
      email: { type: 'string', required: true, description: 'Registered email address' },
      password: { type: 'string', required: true, description: 'Account password' },
    },
    responseExample: { token: 'uuid-session-token', user: { id: 'u1', name: 'Alice Smith', role: 'student' } },
  },
  // PROFILE
  {
    id: 'profile-get', method: 'GET', path: '/api/users/profile', group: 'Profile & Users',
    description: 'Retrieve the profile of the authenticated user.', auth: true,
    responseExample: { id: 'u1', name: 'Alice Smith', email: 'alice@example.com', role: 'student', department: 'Science', joinedAt: '2026-01-20' },
  },
  {
    id: 'profile-put', method: 'PUT', path: '/api/users/profile', group: 'Profile & Users',
    description: "Update the authenticated user's profile information.", auth: true,
    requestBody: {
      name: { type: 'string', required: false, description: 'Display name' },
      department: { type: 'string', required: false, description: 'Department' },
      phone: { type: 'string', required: false, description: 'Phone number' },
      bio: { type: 'string', required: false, description: 'Short biography' },
    },
    responseExample: { id: 'u1', name: 'Alice Smith', department: 'Engineering', phone: '+1 555-9999' },
  },
  // EXAMS
  {
    id: 'exams-post', method: 'POST', path: '/api/exams', group: 'Exams',
    description: 'Create a new exam. Restricted to admin and teacher roles.', auth: true, role: 'admin / teacher',
    requestBody: {
      title: { type: 'string', required: true, description: 'Exam title' },
      description: { type: 'string', required: true, description: 'Description' },
      classId: { type: 'string', required: true, description: 'Target class ID' },
      duration: { type: 'number', required: true, description: 'Duration in minutes' },
      totalMarks: { type: 'number', required: true, description: 'Total marks available' },
      passingMarks: { type: 'number', required: true, description: 'Minimum marks to pass' },
      startDate: { type: 'ISO 8601 datetime', required: true, description: 'Exam start' },
      endDate: { type: 'ISO 8601 datetime', required: true, description: 'Exam end' },
      status: { type: 'draft | published | completed', required: true, description: 'Status' },
      questions: { type: 'Question[]', required: true, description: 'Array of questions' },
    },
    responseExample: { id: 'e10', title: 'Midterm Exam', classId: 'c1', duration: 60, totalMarks: 100, status: 'draft', questions: [{ text: 'Solve 2 + 2', type: 'mcq', topic: 'Arithmetic', marks: 5 }] },
  },
  {
    id: 'exams-get', method: 'GET', path: '/api/exams', group: 'Exams',
    description: 'Retrieve exams accessible to the authenticated user (filtered by role).', auth: true,
    responseExample: [{ id: 'e1', title: 'Algebra Midterm', classId: 'c1', status: 'completed', duration: 60, totalMarks: 100 }],
  },
  {
    id: 'exams-get-id', method: 'GET', path: '/api/exams/{exam_id}', group: 'Exams',
    description: 'Retrieve a single exam by ID, including all questions.', auth: true,
    responseExample: { id: 'e1', title: 'Algebra Midterm', questions: [{ id: 'q1', text: 'What is 2+2?', type: 'mcq', topic: 'Arithmetic', options: ['3', '4', '5'], correctAnswer: '4', marks: 10 }] },
  },
  // RESULTS
  {
    id: 'results-submit', method: 'POST', path: '/api/results/submit', group: 'Results',
    description: "Submit student answers. Auto-grades MCQ questions server-side.", auth: true, role: 'student',
    requestBody: {
      examId: { type: 'string', required: true, description: 'Exam being submitted' },
      answers: { type: 'Answer[]', required: true, description: 'Array of { questionId, answer }' },
      submittedAt: { type: 'ISO 8601 datetime', required: true, description: 'Submission timestamp' },
      questionTelemetry: { type: 'QuestionTelemetry[]', required: false, description: 'Per-question time spent and interaction metrics for new attempts' },
    },
    responseExample: { id: 's5', examId: 'e1', studentId: 'u4', status: 'submitted', submittedAt: '2026-02-24T10:30:00' },
  },
  {
    id: 'results-student', method: 'GET', path: '/api/results/student/{student_id}', group: 'Results',
    description: 'Retrieve all exam results for a specific student.', auth: true,
    responseExample: [{ id: 's1', examId: 'e1', totalScore: 87, percentage: 87, grade: 'A', status: 'graded' }],
  },
  // ADMIN
  {
    id: 'admin-exams', method: 'GET', path: '/api/admin/exams', group: 'Admin & Reporting',
    description: 'Admin: retrieve all exams with submission counts and average scores.', auth: true, role: 'admin',
    responseExample: [{ id: 'e1', title: 'Algebra Midterm', status: 'completed', submissionCount: 5, averageScore: 78 }],
  },
  {
    id: 'admin-results', method: 'GET', path: '/api/admin/results', group: 'Admin & Reporting',
    description: 'Admin: retrieve all submissions enriched with student names and exam titles.', auth: true, role: 'admin',
    responseExample: [{ id: 's1', studentName: 'Alice Smith', examTitle: 'Algebra Midterm', percentage: 87, grade: 'A', status: 'graded' }],
  },
  {
    id: 'reports-performance', method: 'GET', path: '/api/reports/exam-performance', group: 'Admin & Reporting',
    description: 'Per-exam performance stats: averages, highest/lowest, pass/fail counts.', auth: true, role: 'admin / teacher',
    responseExample: [{ examId: 'e1', examTitle: 'Algebra Midterm', totalSubmissions: 5, averageScore: 78, highestScore: 95, lowestScore: 55, passCount: 4, failCount: 1 }],
  },
  {
    id: 'reports-passfail', method: 'GET', path: '/api/reports/pass-fail', group: 'Admin & Reporting',
    description: 'Overall and per-exam pass/fail rates for dashboard analytics.', auth: true, role: 'admin / teacher',
    responseExample: {
      overall: { total: 13, passed: 10, failed: 3, passRate: 76.9 },
      byExam: [{ examId: 'e1', examTitle: 'Algebra Midterm', passed: 4, failed: 1, passRate: 80 }],
      byClass: [{ classId: 'c1', className: 'Mathematics 101', passed: 7, failed: 2, passRate: 77.8 }],
    },
  },
  {
    id: 'reports-question-analytics', method: 'GET', path: '/api/reports/question-analytics', group: 'Admin & Reporting',
    description: 'Question-level analytics including difficulty, common wrong answers, time spent, and weak topics by class.', auth: true, role: 'admin / teacher',
    responseExample: {
      generatedAt: '2026-04-20T09:30:00Z',
      coverage: { totalSubmissions: 18, telemetryEnabledSubmissions: 12, totalQuestions: 30, topicTaggedQuestions: 24 },
      hardestQuestions: [{ questionId: 'q1', questionText: 'Factor x^2 - 9', averageScorePct: 38, averageTimeSpentSeconds: 92 }],
      slowestQuestions: [{ questionId: 'q7', questionText: 'Explain your proof', averageScorePct: 61, averageTimeSpentSeconds: 214 }],
      commonWrongAnswers: [{ questionId: 'q3', option: 'B', count: 7, shareOfIncorrectPct: 58.3 }],
      weakTopicsByClass: [{ classId: 'c1', className: 'Mathematics 101', topic: 'Factoring', averageScorePct: 41.7, averageTimeSpentSeconds: 121 }],
    },
  },
];

