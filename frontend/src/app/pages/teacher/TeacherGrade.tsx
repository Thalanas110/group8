import React, { useState } from 'react';
import { CheckSquare, Clock, ChevronRight, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, getGradeBadge, getStatusBadge } from '../../components/shared/Badge';
import { Submission, Exam } from '../../data/types';
import { Modal } from '../../components/shared/Modal';
import { toast } from 'sonner';
import { violationApi, ViolationRecord } from '../../services/api';

export function TeacherGrade() {
  const { currentUser, exams, submissions, getUserById, gradeSubmission } = useApp();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending');

  // Anti-cheat violations
  const [violationsModal, setViolationsModal] = useState<{ examId: string; studentId: string; examTitle: string; studentName: string } | null>(null);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(false);

  const openViolations = async (examId: string, studentId: string, examTitle: string, studentName: string) => {
    setViolationsModal({ examId, studentId, examTitle, studentName });
    setViolations([]);
    setViolationsLoading(true);
    try {
      const all = await violationApi.listByExam(examId);
      setViolations(all.filter(v => v.student_id === studentId));
    } catch {
      toast.error('Could not load violations.');
    } finally {
      setViolationsLoading(false);
    }
  };

  if (!currentUser) return null;

  const myExams = exams.filter(e => e.teacherId === currentUser.id);
  const myExamIds = new Set(myExams.map(e => e.id));
  const allSubs = submissions.filter(s => myExamIds.has(s.examId));

  const filteredSubs = allSubs.filter(s => {
    if (filter === 'pending') return s.status === 'submitted';
    if (filter === 'graded') return s.status === 'graded';
    return true;
  });

  const examSubs = selectedExam ? filteredSubs.filter(s => s.examId === selectedExam) : filteredSubs;
  const subToGrade = selectedSub ? allSubs.find(s => s.id === selectedSub) : null;
  const subExam = subToGrade ? myExams.find(e => e.id === subToGrade.examId) : null;
  const student = subToGrade ? getUserById(subToGrade.studentId) : null;

  const openGrade = (sub: Submission, exam: Exam) => {
    setSelectedSub(sub.id);
    const init: Record<string, number> = {};
    exam.questions.forEach(q => {
      const ans = sub.answers.find(a => a.questionId === q.id);
      init[q.id] = ans?.marksAwarded ?? (q.type === 'mcq' ? (ans?.answer === q.correctAnswer ? q.marks : 0) : 0);
    });
    setGradeInputs(init);
    setFeedback(sub.feedback || '');
  };

  const handleGradeSubmit = () => {
    if (!subToGrade || !subExam) return;
    const nonMcqQuestions = subExam.questions.filter(q => q.type !== 'mcq');
    const hasUngraded = nonMcqQuestions.some(q => gradeInputs[q.id] === undefined);
    if (hasUngraded) { toast.error('Please provide marks for all questions'); return; }
    const gradeData = subExam.questions.map(q => ({ questionId: q.id, marksAwarded: gradeInputs[q.id] ?? 0 }));
    setSubmittingGrade(true);
    setTimeout(() => {
      gradeSubmission(subToGrade.id, gradeData, feedback);
      toast.success('Submission graded successfully!');
      setSelectedSub(null);
      setSubmittingGrade(false);
    }, 400);
  };

  const pendingCount = allSubs.filter(s => s.status === 'submitted').length;
  const totalScore = Object.values(gradeInputs).reduce((s, v) => s + (v || 0), 0);

  const violationsModalEl = (
    <Modal
      isOpen={!!violationsModal}
      onClose={() => setViolationsModal(null)}
      title={`Violations — ${violationsModal?.studentName ?? ''} · ${violationsModal?.examTitle ?? ''}`}
      size="xl"
    >
      <div>
        {violationsLoading ? (
          <div className="py-10 text-center text-gray-400 text-sm">Loading violations…</div>
        ) : violations.length === 0 ? (
          <div className="py-10 text-center">
            <ShieldAlert className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <div className="text-gray-500 font-medium">No violations recorded</div>
            <div className="text-gray-400 text-sm mt-1">This student had no anti-cheat violations.</div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">{violations.length} violation event(s) recorded for this student.</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Violation #</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Type</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Details</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Occurred At</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, i) => (
                    <tr key={v.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{v.violation_no}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          v.violation_type === 'auto_submitted' ? 'bg-red-100 text-red-700'
                          : v.violation_type === 'window_blur' ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {v.violation_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 truncate max-w-[200px]">{v.details ?? '—'}</td>
                      <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{new Date(v.occurred_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );

  // ── Grading view ────────────────────────────────────────────────────────────
  if (selectedSub && subToGrade && subExam && student) {
    return (
      <>
        <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedSub(null)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Grade Submission</h1>
            <p className="text-gray-400 text-sm">{student.name} · {subExam.title}</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Student', value: student.name },
            { label: 'Exam', value: subExam.title },
            { label: 'Submitted', value: new Date(subToGrade.submittedAt).toLocaleDateString() },
            { label: 'Total Marks', value: subExam.totalMarks },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="text-xs text-gray-400 uppercase tracking-wider">{item.label}</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Anti-cheat shortcut */}
        <button
          onClick={() => openViolations(subExam.id, subToGrade.studentId, subExam.title, student.name)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700 hover:bg-red-100 transition-colors w-fit"
        >
          <ShieldAlert className="w-4 h-4" />
          View Anti-Cheat Violations for this Student
        </button>

        {/* Questions */}
        <div className="space-y-4">
          {subExam.questions.map((q, i) => {
            const ans = subToGrade.answers.find(a => a.questionId === q.id);
            const isCorrect = q.type === 'mcq' && ans?.answer === q.correctAnswer;

            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5">Q{i + 1}</span>
                    <p className="text-sm text-gray-800 font-medium">{q.text}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {q.type === 'mcq' ? (
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${isCorrect ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {isCorrect ? '✓' : '✗'} {isCorrect ? q.marks : 0}/{q.marks}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0} max={q.marks}
                          value={gradeInputs[q.id] ?? ''}
                          onChange={e => setGradeInputs(p => ({ ...p, [q.id]: Math.min(+e.target.value, q.marks) }))}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-900 font-semibold"
                        />
                        <span className="text-xs text-gray-400">/ {q.marks}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm">
                  <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Student's Answer</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{ans?.answer || <span className="italic text-gray-300">No answer</span>}</div>
                </div>

                {q.type === 'mcq' && q.correctAnswer && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <strong>Correct:</strong> {q.correctAnswer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Score Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Score Preview</span>
          <span className="text-lg font-bold text-gray-900">
            {totalScore} / {subExam.totalMarks}
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({Math.round((totalScore / subExam.totalMarks) * 100)}%)
            </span>
          </span>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Teacher Feedback</label>
          <textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide feedback for the student…"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button onClick={() => setSelectedSub(null)} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleGradeSubmit} disabled={submittingGrade}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-60 transition-colors">
            {submittingGrade ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Grade
          </button>
        </div>
      </div>
      {violationsModalEl}
    </>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Grade Exams</h1>
        <p className="text-gray-400 mt-0.5 text-sm">Review and grade student submissions</p>
      </div>

      {pendingCount > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-700 text-sm font-medium">{pendingCount} submission{pendingCount > 1 ? 's' : ''} awaiting your review</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['all', 'pending', 'graded'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {f} {f === 'pending' ? `(${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {/* Exam chips */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedExam(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${!selectedExam ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          All Exams
        </button>
        {myExams.map(e => (
          <button key={e.id} onClick={() => setSelectedExam(selectedExam === e.id ? null : e.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedExam === e.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {e.title}
          </button>
        ))}
      </div>

      {/* Submissions Table */}
      {examSubs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle2 className="w-10 h-10 mx-auto text-gray-200 mb-3" />
          <div className="text-gray-500 font-medium">{filter === 'pending' ? 'No pending submissions' : 'No submissions found'}</div>
          <div className="text-gray-400 text-sm mt-1">{filter === 'pending' ? 'All caught up!' : 'Submissions appear here once students submit their exams'}</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Student</th>
                <th className="px-5 py-3 text-left font-medium">Exam</th>
                <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Submitted</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Score</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {examSubs.map(sub => {
                const st = getUserById(sub.studentId);
                const exam = myExams.find(e => e.id === sub.examId);
                return (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {st?.name[0] || '?'}
                        </div>
                        <span className="font-medium text-gray-900">{st?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{exam?.title || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5"><Badge variant={getStatusBadge(sub.status)}>{sub.status}</Badge></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {sub.status === 'graded' ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{sub.percentage}%</span>
                          <Badge variant={getGradeBadge(sub.grade)}>{sub.grade}</Badge>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {exam && st && (
                          <button
                            onClick={() => openViolations(exam.id, sub.studentId, exam.title, st.name)}
                            title="View anti-cheat violations"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        {exam && (
                          <button onClick={() => openGrade(sub, exam)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${sub.status === 'submitted' ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {sub.status === 'submitted' ? 'Grade' : 'Review'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
    {violationsModalEl}
    </>
  );
}
