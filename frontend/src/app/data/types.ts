export type UserRole = 'student' | 'teacher' | 'admin';
export type ExamStatus = 'draft' | 'published' | 'completed';
export type SubmissionStatus = 'submitted' | 'graded';
export type QuestionType = 'mcq' | 'short_answer' | 'essay';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // optional — not returned by the API (only present in mock data)
  role: UserRole;
  joinedAt: string;
  phone?: string;
  bio?: string;
  department?: string;
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  studentIds: string[];
  code: string;
  createdAt: string;
  description?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

export interface Exam {
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
}

export interface Answer {
  questionId: string;
  answer: string;
  marksAwarded?: number;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  answers: Answer[];
  totalScore?: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  status: SubmissionStatus;
}