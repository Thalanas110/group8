import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Landing } from './pages/public/Landing';
import { StudentLayout } from './pages/student/StudentLayout';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentExams } from './pages/student/StudentExams';
import { StudentResults } from './pages/student/StudentResults';
import { StudentClasses } from './pages/student/StudentClasses';
import { StudentProfile } from './pages/student/StudentProfile';
import { TakeExam } from './pages/student/TakeExam';
import { ExamTakingPreview } from './pages/student/ExamTakingPreview';
import { TeacherLayout } from './pages/teacher/TeacherLayout';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherExams } from './pages/teacher/TeacherExams';
import { TeacherClasses } from './pages/teacher/TeacherClasses';
import { TeacherGrade } from './pages/teacher/TeacherGrade';
import { TeacherProfile } from './pages/teacher/TeacherProfile';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminExams } from './pages/admin/AdminExams';
import { AdminResults } from './pages/admin/AdminResults';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminApiReference } from './pages/admin/AdminApiReference';

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/login', Component: Login },
  { path: '/register', Component: Register },
  { path: '/preview/take-exam', Component: ExamTakingPreview },
  {
    path: '/student',
    Component: StudentLayout,
    children: [
      { index: true, Component: StudentDashboard },
      { path: 'exams', Component: StudentExams },
      { path: 'results', Component: StudentResults },
      { path: 'classes', Component: StudentClasses },
      { path: 'profile', Component: StudentProfile },
      { path: 'take-exam/:examId', Component: TakeExam },
    ],
  },
  {
    path: '/teacher',
    Component: TeacherLayout,
    children: [
      { index: true, Component: TeacherDashboard },
      { path: 'exams', Component: TeacherExams },
      { path: 'classes', Component: TeacherClasses },
      { path: 'grade', Component: TeacherGrade },
      { path: 'profile', Component: TeacherProfile },
    ],
  },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'users', Component: AdminUsers },
      { path: 'exams', Component: AdminExams },
      { path: 'results', Component: AdminResults },
      { path: 'reports', Component: AdminReports },
      { path: 'api', Component: AdminApiReference },
      { path: 'profile', Component: AdminProfile },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
