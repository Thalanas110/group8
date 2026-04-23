import React, { useState } from 'react';
import { TrendingUp, Award, FileText, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, getGradeBadge } from '../../components/shared/Badge';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const GRADE_COLORS: Record<string, string> = {
  'A+': '#16A34A', 'A': '#22C55E', 'B': '#2563EB', 'C': '#D97706', 'C+': '#F59E0B', 'B-': '#3B82F6', 'D': '#EA580C', 'F': '#DC2626',
};

const PIE_COLORS = ['#16A34A', '#22C55E', '#2563EB', '#D97706', '#EA580C', '#DC2626'];

export function StudentResults() {
  const { currentUser, classes, exams, getSubmissionsByStudent } = useApp();
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  if (!currentUser) return null;

  const allSubs = getSubmissionsByStudent(currentUser.id);
  const gradedSubs = allSubs.filter(s => s.status === 'graded');
  const myClassIds = new Set(classes.filter(c => c.studentIds.includes(currentUser.id)).map(c => c.id));
  const myExams = exams.filter(e => myClassIds.has(e.classId));

  const avgScore = gradedSubs.length > 0 ? Math.round(gradedSubs.reduce((sum, s) => sum + (s.percentage || 0), 0) / gradedSubs.length) : 0;
  const bestScore = gradedSubs.length > 0 ? Math.max(...gradedSubs.map(s => s.percentage || 0)) : 0;
  const passCount = gradedSubs.filter(s => {
    const exam = myExams.find(e => e.id === s.examId);
    return exam && (s.totalScore || 0) >= exam.passingMarks;
  }).length;

  const barData = gradedSubs.map(s => {
    const exam = myExams.find(e => e.id === s.examId);
    return { name: exam?.title?.substring(0, 14) + '...' || 'Exam', score: s.percentage || 0, grade: s.grade };
  });

  // Grade distribution
  const gradeCount: Record<string, number> = {};
  gradedSubs.forEach(s => { if (s.grade) gradeCount[s.grade] = (gradeCount[s.grade] || 0) + 1; });
  const pieData = Object.entries(gradeCount).map(([grade, count]) => ({ name: grade, value: count }));

  const detailedSub = gradedSubs.find(s => s.id === selectedSub);
  const detailedExam = detailedSub ? myExams.find(e => e.id === detailedSub.examId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-500 mt-0.5 text-sm">View your exam performance and grades</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Exams Taken',   value: gradedSubs.length, icon: FileText, bg: 'bg-gray-100', color: 'text-gray-600' },
          { label: 'Average Score', value: `${avgScore}%`, icon: TrendingUp, bg: 'bg-gray-100', color: 'text-gray-600' },
          { label: 'Best Score',    value: `${bestScore}%`, icon: Award, bg: 'bg-gray-100', color: 'text-gray-600' },
          { label: 'Passed',        value: `${passCount}/${gradedSubs.length}`, icon: AlertTriangle, bg: 'bg-gray-100', color: 'text-gray-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {gradedSubs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div>No graded results yet</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Score by Exam</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={GRADE_COLORS[entry.grade || 'F'] || '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Grade Distribution</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">All Results</h2>
            </div>
            <PaginatedTable
              items={gradedSubs}
              colSpan={7}
              minWidthClassName="min-w-[860px]"
              bodyClassName="divide-y divide-gray-100"
              header={(
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-500">
                    <th className="px-6 py-3 text-left font-medium">Exam</th>
                    <th className="px-6 py-3 text-left font-medium">Class</th>
                    <th className="px-6 py-3 text-left font-medium">Score</th>
                    <th className="px-6 py-3 text-left font-medium">%</th>
                    <th className="px-6 py-3 text-left font-medium">Grade</th>
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                    <th className="px-6 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
              )}
              emptyRow={<div className="px-6 py-12 text-center text-gray-400 text-sm">No results found</div>}
              renderRow={sub => {
                    const exam = myExams.find(e => e.id === sub.examId);
                    const cls = exam ? classes.find(c => c.id === exam.classId) : null;
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{exam?.title || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-500">{cls?.name || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{sub.totalScore}/{exam?.totalMarks}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full w-16 hidden sm:block">
                              <div className="h-2 rounded-full" style={{ width: `${sub.percentage}%`, backgroundColor: GRADE_COLORS[sub.grade || 'F'] || '#94A3B8' }} />
                            </div>
                            <span className="text-gray-700 font-medium">{sub.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><Badge variant={getGradeBadge(sub.grade)}>{sub.grade}</Badge></td>
                        <td className="px-6 py-4 text-gray-400">{new Date(sub.gradedAt || sub.submittedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => setSelectedSub(selectedSub === sub.id ? null : sub.id)} className="text-xs font-medium text-gray-500 hover:text-gray-900 underline">
                            {selectedSub === sub.id ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                    );
              }}
            />
          </div>

          {/* Detail Panel */}
          {detailedSub && detailedExam && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2">{detailedExam.title} — Detailed Review</h2>
              {detailedSub.feedback && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                  <span className="font-medium">Teacher Feedback: </span>{detailedSub.feedback}
                </div>
              )}
              <div className="space-y-4">
                {detailedExam.questions.map((q, i) => {
                  const ans = detailedSub.answers.find(a => a.questionId === q.id);
                  const isCorrect = q.type === 'mcq' && ans?.answer === q.correctAnswer;
                  const isWrong = q.type === 'mcq' && ans?.answer !== q.correctAnswer;
                  return (
                    <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-gray-300 bg-gray-50' : isWrong ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-800">Q{i + 1}. {q.text}</span>
                        <span className="text-xs font-semibold text-gray-600 flex-shrink-0">{ans?.marksAwarded ?? '?'}/{q.marks} marks</span>
                      </div>
                      <div className="text-xs text-gray-600 bg-white/70 rounded-lg p-2">
                        <span className="font-medium">Your answer: </span>{ans?.answer || 'No answer provided'}
                      </div>
                      {q.type === 'mcq' && q.correctAnswer && (
                        <div className="text-xs text-green-700 mt-1">
                          <span className="font-medium">Correct: </span>{q.correctAnswer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
