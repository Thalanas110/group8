import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Class, Exam, Submission, Answer } from '../data/types';
import { authApi, dataApi, examApi, resultApi, classApi, userApi } from '../services/api';

// ─── Context Type ─────────────────────────────────────────────────────────────

interface AppContextType {
  currentUser: User | null;
  apiLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;

  users: User[];
  classes: Class[];
  exams: Exam[];
  submissions: Submission[];

  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addClass: (cls: Omit<Class, 'id' | 'createdAt' | 'studentIds'>) => Class;
  updateClass: (id: string, data: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  enrollStudent: (classId: string, studentId: string) => { success: boolean; error?: string };
  removeStudentFromClass: (classId: string, studentId: string) => void;
  joinClassByCode: (code: string, studentId: string) => Promise<{ success: boolean; error?: string }>;
  leaveClass: (classId: string, studentId: string) => void;

  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => Promise<Exam>;
  updateExam: (id: string, data: Partial<Exam>) => Promise<Exam>;
  deleteExam: (id: string) => Promise<void>;

  submitExam: (submission: Omit<Submission, 'id'>) => void;
  gradeSubmission: (id: string, answers: { questionId: string; marksAwarded: number }[], feedback: string) => void;

  getUserById: (id: string) => User | undefined;
  getClassById: (id: string) => Class | undefined;
  getExamById: (id: string) => Exam | undefined;
  getSubmissionsByStudent: (studentId: string) => Submission[];
  getSubmissionsByExam: (examId: string) => Submission[];
  getStudentSubmission: (examId: string, studentId: string) => Submission | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const today = () => new Date().toISOString().split('T')[0];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('examhub_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [apiLoading, setApiLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Persist current user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('examhub_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('examhub_user');
    }
  }, [currentUser]);

  // On mount: if a session token exists, reload full state from the API
  const loadFromApi = useCallback(async () => {
    const token = localStorage.getItem('examhub_token');
    if (!token) return;
    try {
      setApiLoading(true);
      const data = await dataApi.getAll();
      setUsers(data.users as User[]);
      setExams(data.exams as unknown as Exam[]);
      setClasses(data.classes as Class[]);
      setSubmissions(data.submissions as unknown as Submission[]);
    } catch (err) {
      console.error('Failed to load data from API on mount:', err);
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  // ── Auth ────────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setApiLoading(true);
      const result = await authApi.login({ email, password });
      localStorage.setItem('examhub_token', result.token);
      setCurrentUser(result.user as User);

      // Load full app state from API after successful login
      const data = await dataApi.getAll();
      setUsers(data.users as User[]);
      setExams(data.exams as unknown as Exam[]);
      setClasses(data.classes as Class[]);
      setSubmissions(data.submissions as unknown as Submission[]);

      return { success: true };
    } catch (apiErr) {
      console.error('API login failed:', apiErr);
      localStorage.removeItem('examhub_token');
      setCurrentUser(null);
      setUsers([]);
      setExams([]);
      setClasses([]);
      setSubmissions([]);
      const message = apiErr instanceof Error && apiErr.message.trim() !== ''
        ? apiErr.message
        : 'Authentication failed';
      return { success: false, error: message };
    } finally {
      setApiLoading(false);
    }
  };

  const logout = () => {
    const token = localStorage.getItem('examhub_token');
    if (token) {
      authApi.logout().catch(err => console.error('Logout API error:', err));
      localStorage.removeItem('examhub_token');
    }
    setCurrentUser(null);
    setUsers([]);
    setExams([]);
    setClasses([]);
    setSubmissions([]);
  };

  const register = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      setApiLoading(true);
      const result = await authApi.register({
        name: data.name ?? '',
        email: data.email ?? '',
        password: data.password ?? '',
        role: data.role ?? 'student',
        department: data.department,
      });
      localStorage.setItem('examhub_token', result.token);
      setCurrentUser(result.user as User);

      const apiData = await dataApi.getAll();
      setUsers(apiData.users as User[]);
      setExams(apiData.exams as unknown as Exam[]);
      setClasses(apiData.classes as Class[]);
      setSubmissions(apiData.submissions as unknown as Submission[]);

      return { success: true };
    } catch (apiErr) {
      console.error('API register failed:', apiErr);
      const message = apiErr instanceof Error && apiErr.message.trim() !== ''
        ? apiErr.message
        : 'Registration failed';
      return { success: false, error: message };
    } finally {
      setApiLoading(false);
    }
  };

  // ── User CRUD ───────────────────────────────────────────────────────────────

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: generateId() };
    setUsers(prev => [...prev, newUser]);
    userApi.create(newUser).catch(err => console.error('addUser API error:', err));
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    userApi.update(id, data).catch(err => console.error('updateUser API error:', err));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    userApi.remove(id).catch(err => console.error('deleteUser API error:', err));
  };

  // ── Class CRUD ──────────────────────────────────────────────────────────────

  const addClass = (data: Omit<Class, 'id' | 'createdAt' | 'studentIds'>) => {
    const newClass: Class = { ...data, id: generateId(), studentIds: [], createdAt: today() };
    setClasses(prev => [...prev, newClass]);
    classApi.create(newClass).catch(err => console.error('addClass API error:', err));
    return newClass;
  };

  const updateClass = (id: string, data: Partial<Class>) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    classApi.update(id, data).catch(err => console.error('updateClass API error:', err));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    classApi.remove(id).catch(err => console.error('deleteClass API error:', err));
  };

  const enrollStudent = (classId: string, studentId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return { success: false, error: 'Class not found' };
    if (cls.studentIds.includes(studentId)) return { success: false, error: 'Student already enrolled' };
    const student = users.find(u => u.id === studentId);
    if (!student) return { success: false, error: 'Student not found' };
    if (student.role !== 'student') return { success: false, error: 'User is not a student' };
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, studentIds: [...c.studentIds, studentId] } : c));
    classApi.enroll(classId, studentId).catch(err => console.error('enrollStudent API error:', err));
    return { success: true };
  };

  const removeStudentFromClass = (classId: string, studentId: string) => {
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, studentIds: c.studentIds.filter(id => id !== studentId) } : c));
    classApi.removeStudent(classId, studentId).catch(err => console.error('removeStudent API error:', err));
  };

  const joinClassByCode = async (code: string, studentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const joinedClass = await classApi.join(code) as Class;
      const joinedStudentIds = Array.isArray(joinedClass.studentIds) ? joinedClass.studentIds : [];
      const normalizedClass: Class = joinedStudentIds.includes(studentId)
        ? joinedClass
        : { ...joinedClass, studentIds: [...joinedStudentIds, studentId] };

      setClasses(prev => {
        const exists = prev.some(c => c.id === normalizedClass.id);
        if (!exists) {
          return [...prev, normalizedClass];
        }

        return prev.map(c => c.id === normalizedClass.id ? { ...c, ...normalizedClass } : c);
      });
      return { success: true };
    } catch (apiErr) {
      console.error('joinClass API error:', apiErr);
      const message = apiErr instanceof Error && apiErr.message.trim() !== ''
        ? apiErr.message
        : 'Class not found. Check the code and try again.';
      return { success: false, error: message };
    }
  };

  const leaveClass = (classId: string, studentId: string) => {
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, studentIds: c.studentIds.filter(id => id !== studentId) } : c));
    classApi.leave(classId).catch(err => console.error('leaveClass API error:', err));
  };

  // ── Exam CRUD ───────────────────────────────────────────────────────────────

  const addExam = async (data: Omit<Exam, 'id' | 'createdAt'>): Promise<Exam> => {
    const created = await examApi.create(data) as unknown as Exam;
    setExams(prev => {
      const existingIndex = prev.findIndex(e => e.id === created.id);
      if (existingIndex >= 0) {
        return prev.map(e => e.id === created.id ? created : e);
      }

      return [...prev, created];
    });

    return created;
  };

  const updateExam = async (id: string, data: Partial<Exam>): Promise<Exam> => {
    const updated = await examApi.update(id, data) as unknown as Exam;
    setExams(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  };

  const deleteExam = async (id: string): Promise<void> => {
    await examApi.remove(id);
    setExams(prev => prev.filter(e => e.id !== id));
  };

  // ── Submissions ─────────────────────────────────────────────────────────────

  const submitExam = (data: Omit<Submission, 'id'>) => {
    const exam = exams.find(e => e.id === data.examId);
    const gradedAnswers: Answer[] = data.answers.map(ans => {
      const question = exam?.questions.find(q => q.id === ans.questionId);
      if (question?.type === 'mcq') {
        return { ...ans, marksAwarded: ans.answer === question.correctAnswer ? question.marks : 0 };
      }
      return ans;
    });

    const mcqScore = gradedAnswers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
    const hasNonMcq = exam?.questions.some(q => q.type !== 'mcq');
    const subId = generateId();

    const newSub: Submission = {
      ...data, id: subId, answers: gradedAnswers, status: 'submitted',
      ...(hasNonMcq ? {} : {
        totalScore: mcqScore,
        percentage: exam ? Math.round((mcqScore / exam.totalMarks) * 100) : 0,
        grade: getGrade(exam ? Math.round((mcqScore / exam.totalMarks) * 100) : 0),
        status: 'graded' as const,
        gradedAt: new Date().toISOString(),
      }),
    };

    setSubmissions(prev => [...prev, newSub]);

    resultApi.submit({
      id: subId, examId: data.examId,
      answers: data.answers.map(a => ({ questionId: a.questionId, answer: a.answer })),
      submittedAt: data.submittedAt,
      questionTelemetry: data.questionTelemetry?.map(metric => ({
        questionId: metric.questionId,
        topic: metric.topic ?? null,
        timeSpentSeconds: metric.timeSpentSeconds,
        visitCount: metric.visitCount,
        answerChangeCount: metric.answerChangeCount,
      })),
    }).catch(err => console.error('submitExam API error:', err));
  };

  const gradeSubmission = (id: string, gradeAnswers: { questionId: string; marksAwarded: number }[], feedback: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updatedAnswers = s.answers.map(ans => {
        const g = gradeAnswers.find(ga => ga.questionId === ans.questionId);
        return g ? { ...ans, marksAwarded: g.marksAwarded } : ans;
      });
      const totalScore = updatedAnswers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
      const exam = exams.find(e => e.id === s.examId);
      const percentage = exam ? Math.round((totalScore / exam.totalMarks) * 100) : 0;
      return { ...s, answers: updatedAnswers, totalScore, percentage, grade: getGrade(percentage), feedback, gradedAt: new Date().toISOString(), status: 'graded' as const };
    }));

    resultApi.grade(id, gradeAnswers, feedback).catch(err => console.error('gradeSubmission API error:', err));
  };

  // ── Selectors ───────────────────────────────────────────────────────────────

  const getGrade = (pct: number) => {
    if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B';
    if (pct >= 60) return 'C'; if (pct >= 50) return 'D'; return 'F';
  };

  const getUserById = (id: string) => users.find(u => u.id === id);
  const getClassById = (id: string) => classes.find(c => c.id === id);
  const getExamById = (id: string) => exams.find(e => e.id === id);
  const getSubmissionsByStudent = (studentId: string) => submissions.filter(s => s.studentId === studentId);
  const getSubmissionsByExam = (examId: string) => submissions.filter(s => s.examId === examId);
  const getStudentSubmission = (examId: string, studentId: string) => submissions.find(s => s.examId === examId && s.studentId === studentId);

  return (
    <AppContext.Provider value={{
      currentUser, apiLoading, login, logout, register,
      users, classes, exams, submissions,
      addUser, updateUser, deleteUser,
      addClass, updateClass, deleteClass, enrollStudent, removeStudentFromClass, joinClassByCode, leaveClass,
      addExam, updateExam, deleteExam,
      submitExam, gradeSubmission,
      getUserById, getClassById, getExamById,
      getSubmissionsByStudent, getSubmissionsByExam, getStudentSubmission,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
