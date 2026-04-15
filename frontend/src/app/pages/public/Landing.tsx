import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const capabilities = [
  'Timed online assessments with role-based access',
  'Objective question auto-checking and scoring',
  'Teacher review flow for subjective questions',
  'Class-level analytics and pass/fail reporting',
];

const examLifecycle = [
  { icon: ClipboardCheck, title: 'Create', text: 'Build exams with MCQ, short-answer, and essay sections.' },
  { icon: ShieldCheck, title: 'Deliver', text: 'Publish controlled assessment windows with secure access.' },
  { icon: FileCheck2, title: 'Grade', text: 'Combine auto-grading with manual review workflows.' },
  { icon: BarChart3, title: 'Analyze', text: 'Review outcomes with performance dashboards and reports.' },
];

export function Landing() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate(`/${currentUser.role}`, { replace: true });
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-orange-300/35 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-teal-300/30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto grid gap-6 lg:grid-cols-[1.12fr_0.88fr] items-stretch lg:min-h-[calc(100vh-4rem)] lg:content-center">
        <section className="rounded-[2rem] border border-gray-200 bg-white/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-[0_35px_70px_-45px_rgba(48,27,11,0.7)]">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center shadow-[0_14px_30px_-18px_rgba(51,25,10,0.8)]">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 tracking-tight">ExamHub</div>
              <div className="text-xs text-gray-600 uppercase tracking-[0.14em]">Online Examination System</div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.8rem] leading-[1.05] max-w-2xl">
            One workspace for secure online exams and reliable grading.
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-4 max-w-2xl">
            Built for schools and universities to manage exam creation, delivery, marking, and reporting
            without switching tools.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-5 py-3 rounded-2xl border border-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Create Account
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-2.5 mt-7">
            {capabilities.map(item => (
              <div key={item} className="rounded-xl border border-gray-200 bg-white/75 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-gray-200 bg-white/95 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-[0_35px_70px_-45px_rgba(48,27,11,0.7)]">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl">Exam Lifecycle</h2>
            <p className="text-gray-600 text-sm mt-2">
              A complete assessment flow designed for students, teachers, and administrators.
            </p>
          </div>

          <div className="space-y-3.5">
            {examLifecycle.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{title}</div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white/75 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Users className="w-4 h-4" />
              Multi-role Portal
            </div>
            <div className="mt-2 space-y-1.5">
              {[
                'Students: take exams and view results.',
                'Teachers: create exams and complete grading.',
                'Admins: manage users, reports, and system oversight.',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-xs text-gray-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
