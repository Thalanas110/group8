import React, { useMemo } from 'react';
import { CheckCircle2, ChevronDown, RefreshCw, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReviewModal } from '../../features/teacher/violation-cases/ReviewModal';
import { useViolationCases } from '../../features/teacher/violation-cases/useViolationCases';
import { ViolationCasesTable } from '../../features/teacher/violation-cases/ViolationCasesTable';
import { VIOLATION_REVIEW_MODE_OPTIONS } from '../../features/teacher/violation-cases/case-meta';

export function TeacherViolationCases() {
  const { currentUser, exams, classes, users } = useApp();

  const myExams = useMemo(
    () => exams.filter(exam => exam.teacherId === currentUser?.id),
    [currentUser?.id, exams],
  );

  const {
    reviewMode,
    setReviewMode,
    selectedExamId,
    setSelectedExamId,
    selectedStudentId,
    setSelectedStudentId,
    selectedCourseId,
    setSelectedCourseId,
    studentOptions,
    courseOptions,
    violations,
    loading,
    rows,
    selectedExam,
    pendingCount,
    reviewTarget,
    setReviewTarget,
    reviewingRow,
    handleCaseSaved,
    refresh,
  } = useViolationCases(myExams, classes, users);

  if (!currentUser) return null;

  const selectedStudent = studentOptions.find(option => option.id === selectedStudentId) ?? null;
  const selectedCourse = courseOptions.find(option => option.id === selectedCourseId) ?? null;
  const refreshDisabled = loading || myExams.length === 0 || (reviewMode === 'per_exam' && !selectedExamId);
  const needsExamSelection = reviewMode === 'per_exam' && !selectedExamId;

  const selectionSummary = reviewMode === 'per_exam'
    ? selectedExam?.title ?? 'No exam selected'
    : reviewMode === 'per_student'
    ? selectedStudent?.label ?? 'No student selected'
    : reviewMode === 'per_course'
    ? selectedCourse?.label ?? 'No course selected'
    : 'All tracked exams';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            Violation Case Review
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review anti-cheat violations and record decisions for each student.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshDisabled}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 shrink-0">Review Mode</label>
            <div className="relative flex-1 min-w-[220px]">
              <select
                value={reviewMode}
                onChange={event => setReviewMode(event.target.value as typeof reviewMode)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
              >
                {VIOLATION_REVIEW_MODE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {reviewMode === 'per_exam' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 shrink-0">Select Exam</label>
              <div className="relative flex-1 min-w-[280px]">
                <select
                  value={selectedExamId}
                  onChange={event => setSelectedExamId(event.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
                >
                  {myExams.length === 0 && <option value="">No exams available</option>}
                  {myExams.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.title}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          {reviewMode === 'per_student' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 shrink-0">Select Student</label>
              <div className="relative flex-1 min-w-[260px]">
                <select
                  value={selectedStudentId}
                  onChange={event => setSelectedStudentId(event.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
                >
                  {studentOptions.length === 0 && <option value="">No students with violations</option>}
                  {studentOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          {reviewMode === 'per_course' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 shrink-0">Select Course</label>
              <div className="relative flex-1 min-w-[260px]">
                <select
                  value={selectedCourseId}
                  onChange={event => setSelectedCourseId(event.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
                >
                  {courseOptions.length === 0 && <option value="">No courses with violations</option>}
                  {courseOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
              {pendingCount} pending
            </span>
            <span>{rows.length} case{rows.length !== 1 ? 's' : ''}</span>
            <span className="text-gray-400">{selectionSummary}</span>
          </div>
        </div>
      </div>

      {needsExamSelection ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No exam selected</p>
          <p className="text-gray-400 text-sm mt-1">Choose an exam to view its violation queue.</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-gray-300 animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading violations...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
          <p className="text-gray-700 font-medium">No violations found for this view</p>
          <p className="text-gray-400 text-sm mt-1">Try another review mode or adjust your filter selection.</p>
        </div>
      ) : (
        <ViolationCasesTable
          reviewMode={reviewMode}
          rows={rows}
          onReview={rowKey => setReviewTarget({ rowKey })}
        />
      )}

      {reviewTarget && reviewingRow && (
        <ReviewModal
          examId={reviewingRow.examId}
          studentId={reviewingRow.studentId}
          studentName={reviewingRow.studentName}
          existingCase={reviewingRow.existingCase}
          violations={violations}
          onSaved={handleCaseSaved}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
