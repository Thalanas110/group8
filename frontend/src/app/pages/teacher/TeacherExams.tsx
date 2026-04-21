import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, FileText, Clock, BookOpen, ChevronDown, ChevronUp, X, PlusCircle, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, getStatusBadge } from '../../components/shared/Badge';
import { Modal, ConfirmDialog } from '../../components/shared/Modal';
import { Exam, Question, ExamStatus } from '../../data/types';
import { toast } from 'sonner';
import { violationApi, ViolationRecord } from '../../services/api';

type ExamFormData = Omit<Exam, 'id' | 'createdAt' | 'teacherId'>;
const blankQuestion = (): Question => ({
  id: Math.random().toString(36).substr(2, 9), text: '', type: 'mcq', topic: '', options: ['', '', '', ''], correctAnswer: '', marks: 10,
});

const toTimestamp = (value: string): number | null => {
  if (value.trim() === '') return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const validateExamForm = (form: ExamFormData): string | null => {
  if (!form.title.trim() || !form.description.trim() || !form.classId.trim()) {
    return 'title, description, and class are required.';
  }

  if (form.duration <= 0) {
    return 'Duration must be greater than zero.';
  }

  if (form.totalMarks <= 0) {
    return 'Total marks must be greater than zero.';
  }

  if (form.passingMarks <= 0) {
    return 'Pass marks must be greater than zero.';
  }

  if (form.passingMarks > form.totalMarks) {
    return 'Pass marks cannot be greater than total marks.';
  }

  const startTimestamp = toTimestamp(form.startDate);
  const endTimestamp = toTimestamp(form.endDate);
  if (startTimestamp === null || endTimestamp === null) {
    return 'Start and end date/time are required.';
  }

  if (endTimestamp <= startTimestamp) {
    return 'End date/time must be later than start date/time.';
  }

  if (form.questions.length === 0) {
    return 'At least one question is required.';
  }

  let allocatedMarks = 0;
  for (let index = 0; index < form.questions.length; index += 1) {
    const question = form.questions[index];
    const label = `Question ${index + 1}`;

    if (!question.text.trim()) {
      return `${label} text is required.`;
    }

    if ((question.marks ?? 0) <= 0) {
      return `${label} marks must be greater than zero.`;
    }

    allocatedMarks += question.marks;

    if (question.type === 'mcq') {
      const options = (question.options ?? []).map(option => option.trim()).filter(option => option !== '');
      if (options.length < 2) {
        return `${label} must have at least 2 options.`;
      }

      const correctAnswer = (question.correctAnswer ?? '').trim();
      if (correctAnswer === '') {
        return `${label} must have a correct answer.`;
      }

      if (!options.includes(correctAnswer)) {
        return `${label} correct answer must match one of the options.`;
      }
    }
  }

  if (allocatedMarks < form.totalMarks) {
    return `Not enough points in questions. Total marks is ${form.totalMarks} but only ${allocatedMarks} point(s) are assigned.`;
  }

  if (allocatedMarks > form.totalMarks) {
    return `Question points exceed total marks. Total marks is ${form.totalMarks} but ${allocatedMarks} point(s) are assigned.`;
  }

  return null;
};

export function TeacherExams() {
  const { currentUser, classes, exams, submissions, addExam, updateExam, deleteExam, getSubmissionsByExam } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ExamStatus>('all');

  // Anti-cheat violations viewer state
  const [violationsExam, setViolationsExam] = useState<Exam | null>(null);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(false);

  const openViolations = async (exam: Exam) => {
    setViolationsExam(exam);
    setViolations([]);
    setViolationsLoading(true);
    try {
      const data = await violationApi.listByExam(exam.id);
      setViolations(data);
    } catch {
      toast.error('Could not load violations for this exam.');
    } finally {
      setViolationsLoading(false);
    }
  };

  const [form, setForm] = useState<ExamFormData>({
    title: '', description: '', classId: '', duration: 60, totalMarks: 100, passingMarks: 50,
    startDate: '', endDate: '', status: 'draft', questions: [],
  });

  if (!currentUser) return null;

  const myClasses = classes.filter(c => c.teacherId === currentUser.id);
  const myExams = exams.filter(e => e.teacherId === currentUser.id).filter(e => filter === 'all' || e.status === filter);

  const openCreate = () => {
    setEditingExam(null);
    setForm({ title: '', description: '', classId: myClasses[0]?.id || '', duration: 60, totalMarks: 100, passingMarks: 50, startDate: '', endDate: '', status: 'draft', questions: [blankQuestion()] });
    setShowModal(true);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setForm({ title: exam.title, description: exam.description, classId: exam.classId, duration: exam.duration, totalMarks: exam.totalMarks, passingMarks: exam.passingMarks, startDate: exam.startDate.slice(0, 16), endDate: exam.endDate.slice(0, 16), status: exam.status, questions: exam.questions });
    setShowModal(true);
  };

  const handleSave = async () => {
    const validationError = validateExamForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      if (editingExam) {
        await updateExam(editingExam.id, { ...form, teacherId: currentUser.id });
        toast.success('Exam updated successfully');
      } else {
        await addExam({ ...form, teacherId: currentUser.id });
        toast.success('Exam created successfully');
      }
      setShowModal(false);
    } catch (error) {
      const message = error instanceof Error && error.message.trim() !== ''
        ? error.message
        : 'Unable to save exam.';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExam(id);
      toast.success('Exam deleted');
    } catch (error) {
      const message = error instanceof Error && error.message.trim() !== ''
        ? error.message
        : 'Unable to delete exam.';
      toast.error(message);
    }
  };

  const toggleStatus = async (exam: Exam) => {
    const next = exam.status === 'draft' ? 'published' : exam.status === 'published' ? 'completed' : 'draft';
    try {
      await updateExam(exam.id, { status: next });
      toast.success(`Exam status changed to ${next}`);
    } catch (error) {
      const message = error instanceof Error && error.message.trim() !== ''
        ? error.message
        : 'Unable to update exam status.';
      toast.error(message);
    }
  };

  const addQuestion = () => setForm(p => ({ ...p, questions: [...p.questions, blankQuestion()] }));
  const removeQuestion = (idx: number) => setForm(p => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }));
  const updateQuestion = (idx: number, data: Partial<Question>) => setForm(p => ({ ...p, questions: p.questions.map((q, i) => i === idx ? { ...q, ...data } : q) }));
  const updateOption = (qIdx: number, oIdx: number, val: string) => setForm(p => ({
    ...p, questions: p.questions.map((q, i) => i === qIdx ? { ...q, options: (q.options || []).map((o, j) => j === oIdx ? val : o) } : q),
  }));

  const statusCycles: Record<ExamStatus, string> = { draft: 'Publish', published: 'Complete', completed: 'Back to Draft' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Exams</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Create and manage exams for your classes</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          <Plus className="w-4 h-4" /> Create Exam
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['all', 'draft', 'published', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >{f}</button>
        ))}
      </div>

      {myExams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <div className="text-gray-500 font-medium">No exams found</div>
          <div className="text-gray-400 text-sm mt-1">Create your first exam to get started</div>
          <button onClick={openCreate} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700">
            Create Exam
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myExams.map(exam => {
            const cls = classes.find(c => c.id === exam.classId);
            const subs = getSubmissionsByExam(exam.id);
            const gradedSubs = subs.filter(s => s.status === 'graded');
            const avgScore = gradedSubs.length > 0 ? Math.round(gradedSubs.reduce((sum, s) => sum + (s.percentage || 0), 0) / gradedSubs.length) : null;
            const isExpanded = expandedExam === exam.id;

            return (
              <div key={exam.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                        <div className="text-xs text-gray-400 mt-0.5">{cls?.name} · {cls?.subject}</div>
                      </div>
                      <Badge variant={getStatusBadge(exam.status)} className="flex-shrink-0">{exam.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{exam.description}</p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration} min</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {exam.questions.length} questions</span>
                      <span className="flex items-center gap-1">📝 {exam.totalMarks} marks</span>
                      <span className="flex items-center gap-1">👥 {subs.length} submissions</span>
                      {avgScore !== null && <span className="flex items-center gap-1">📊 Avg: {avgScore}%</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setExpandedExam(isExpanded ? null : exam.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openViolations(exam)}
                      title="View anti-cheat violations"
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(exam)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(exam.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-700">Exam Details</div>
                      <button onClick={() => toggleStatus(exam)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 font-medium">
                        {statusCycles[exam.status]}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div><span className="text-gray-400">Start:</span> <span className="font-medium">{new Date(exam.startDate).toLocaleString()}</span></div>
                      <div><span className="text-gray-400">End:</span> <span className="font-medium">{new Date(exam.endDate).toLocaleString()}</span></div>
                      <div><span className="text-gray-400">Pass Mark:</span> <span className="font-medium">{exam.passingMarks}/{exam.totalMarks}</span></div>
                      <div><span className="text-gray-400">Submissions:</span> <span className="font-medium">{subs.length}</span></div>
                      <div><span className="text-gray-400">Graded:</span> <span className="font-medium">{gradedSubs.length}</span></div>
                      <div><span className="text-gray-400">Pending:</span> <span className="font-medium">{subs.filter(s => s.status === 'submitted').length}</span></div>
                    </div>
                    {exam.questions.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-medium text-gray-500 mb-2">Questions</div>
                        <div className="space-y-1">
                          {exam.questions.map((q, i) => (
                            <div key={q.id} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-medium text-gray-500 flex-shrink-0">Q{i + 1}</span>
                              <span className="line-clamp-1">{q.text}</span>
                              <span className="flex-shrink-0 text-gray-400">({q.marks} marks · {q.type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingExam ? 'Edit Exam' : 'Create New Exam'} size="xl"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-700 transition-colors">
              {editingExam ? 'Save Changes' : 'Create Exam'}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Algebra Midterm Exam"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief exam description..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                    <option value="">Select class...</option>
                    {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as ExamStatus }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: +e.target.value }))} min={5}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                  <input type="number" value={form.totalMarks} onChange={e => setForm(p => ({ ...p, totalMarks: +e.target.value }))} min={1}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pass Marks</label>
                  <input type="number" value={form.passingMarks} onChange={e => setForm(p => ({ ...p, passingMarks: +e.target.value }))} min={1}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Questions ({form.questions.length})</h3>
              <button onClick={addQuestion} className="flex items-center gap-1.5 text-gray-600 text-sm font-medium hover:text-gray-900">
                <PlusCircle className="w-4 h-4" /> Add Question
              </button>
            </div>
            <div className="space-y-4">
              {form.questions.map((q, idx) => (
                <div key={q.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Question {idx + 1}</span>
                    <button onClick={() => removeQuestion(idx)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <textarea rows={2} value={q.text} onChange={e => updateQuestion(idx, { text: e.target.value })} placeholder="Question text..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none bg-white" />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Topic <span className="text-gray-400">(optional)</span></label>
                      <input
                        type="text"
                        value={q.topic || ''}
                        onChange={e => updateQuestion(idx, { topic: e.target.value })}
                        placeholder="e.g. Arithmetic, Factoring, Newton's Laws"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      />
                      <p className="mt-1 text-[11px] text-gray-400">Topic tags power weak-topic analytics for future attempts.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                        <select value={q.type} onChange={e => updateQuestion(idx, { type: e.target.value as any, options: e.target.value === 'mcq' ? ['', '', '', ''] : undefined })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                          <option value="mcq">Multiple Choice</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="essay">Essay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Marks</label>
                        <input type="number" value={q.marks} onChange={e => updateQuestion(idx, { marks: +e.target.value })} min={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
                      </div>
                    </div>
                    {q.type === 'mcq' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-500">Options (select correct answer)</label>
                        {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt && opt !== ''} onChange={() => opt && updateQuestion(idx, { correctAnswer: opt })}
                              className="w-3.5 h-3.5 text-gray-700" />
                            <input type="text" value={opt} onChange={e => { updateOption(idx, oIdx, e.target.value); if (q.correctAnswer === opt) updateQuestion(idx, { correctAnswer: e.target.value }); }}
                              placeholder={`Option ${oIdx + 1}`}
                              className={`flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white ${q.correctAnswer === opt ? 'border-gray-900' : 'border-gray-300'}`} />
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'short_answer' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Expected Answer (optional)</label>
                        <input type="text" value={q.correctAnswer || ''} onChange={e => updateQuestion(idx, { correctAnswer: e.target.value })} placeholder="Model answer for reference..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {form.questions.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                  No questions yet. Click "Add Question" to start.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
        if (deleteTarget) {
          await handleDelete(deleteTarget);
        }
        setDeleteTarget(null);
      }}
        title="Delete Exam" message="Are you sure you want to delete this exam? All submissions will also be removed. This action cannot be undone." confirmLabel="Delete Exam" />

      {/* ── Anti-Cheat Violations Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!violationsExam}
        onClose={() => setViolationsExam(null)}
        title={`Anti-Cheat Violations — ${violationsExam?.title ?? ''}`}
        size="xl"
      >
        <div>
          {violationsLoading ? (
            <div className="py-10 text-center text-gray-400 text-sm">Loading violations…</div>
          ) : violations.length === 0 ? (
            <div className="py-10 text-center">
              <ShieldAlert className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <div className="text-gray-500 font-medium">No violations recorded</div>
              <div className="text-gray-400 text-sm mt-1">All students behaved during this exam.</div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {violations.length} violation event(s) recorded across{' '}
                {new Set(violations.map(v => v.student_id)).size} student(s).
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600">#</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Student ID</th>
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
                        <td className="px-3 py-2.5 font-mono text-gray-700 truncate max-w-[120px]" title={v.student_id}>
                          {v.student_id.slice(0, 8)}…
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                            {v.violation_no}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            v.violation_type === 'auto_submitted'
                              ? 'bg-red-100 text-red-700'
                              : v.violation_type === 'window_blur'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {v.violation_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 truncate max-w-[200px]">{v.details ?? '—'}</td>
                        <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                          {new Date(v.occurred_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
