import { createBrowserRouter, Navigate } from 'react-router';
import { RouterErrorPage } from './components/shared/RouterErrorPage';
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
import { TeacherAnalytics } from './pages/teacher/TeacherAnalytics';
import { TeacherViolationCases } from './pages/teacher/TeacherViolationCases';
import { TeacherTools } from './pages/teacher/TeacherTools';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminExams } from './pages/admin/AdminExams';
import { AdminResults } from './pages/admin/AdminResults';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminClasses } from './pages/admin/AdminClasses';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminApiReference } from './pages/admin/AdminApiReference';
import { AdminLogs } from './pages/admin/AdminLogs';
import { AdminViolations } from './pages/admin/AdminViolations';
import { AdminTools } from './pages/admin/AdminTools';

export function createAppRouter() {
  return createBrowserRouter([
    { path: '/', Component: Landing, errorElement: <RouterErrorPage /> },
    { path: '/login', Component: Login, errorElement: <RouterErrorPage /> },
    { path: '/register', Component: Register, errorElement: <RouterErrorPage /> },

    { path: '/preview/take-exam', Component: ExamTakingPreview, errorElement: <RouterErrorPage /> },
    {
      path: '/student',
      Component: StudentLayout,
      errorElement: <RouterErrorPage />,
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
      errorElement: <RouterErrorPage />,
      children: [
        { index: true, Component: TeacherDashboard },
        { path: 'exams', Component: TeacherExams },
        { path: 'classes', Component: TeacherClasses },
        { path: 'grade', Component: TeacherGrade },
        { path: 'analytics', Component: TeacherAnalytics },
        { path: 'tools', Component: TeacherTools },
        { path: 'violation-cases', Component: TeacherViolationCases },
        { path: 'profile', Component: TeacherProfile },
      ],
    },
    {
      path: '/admin',
      Component: AdminLayout,
      errorElement: <RouterErrorPage />,
      children: [
        { index: true, Component: AdminDashboard },
        { path: 'users', Component: AdminUsers },
        { path: 'exams', Component: AdminExams },
        { path: 'classes', Component: AdminClasses },
        { path: 'results', Component: AdminResults },
        { path: 'violations', Component: AdminViolations },
        { path: 'logs', Component: AdminLogs },
        { path: 'reports', Component: AdminReports },
        { path: 'tools', Component: AdminTools },
        { path: 'api', Component: AdminApiReference },
        { path: 'profile', Component: AdminProfile },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);
}
