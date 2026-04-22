import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, ChevronDown, RefreshCw, CheckCircle2,
  AlertTriangle, XCircle, Info, Eye, Save, X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/shared/Badge';
import { Modal } from '../../components/shared/Modal';
import { toast } from 'sonner';
import {
  violationApi,
  violationCaseApi,
  ViolationRecord,
  ViolationCase,
  ViolationCaseSeverity,
  ViolationCaseOutcome,
} from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MAX_TAB_SWITCHES = 3;

function suggestSeverity(violations: ViolationRecord[]): ViolationCaseSeverity {
  const hasAutoSubmit = violations.some(v => v.violation_type === 'auto_submitted');
  if (hasAutoSubmit || violations.length >= MAX_TAB_SWITCHES + 1) return 'critical';
  if (violations.length === MAX_TAB_SWITCHES) return 'high';
  if (violations.length === 2) return 'medium';
  return 'low';
}

const SEVERITY_META: Record<ViolationCaseSeverity, { label: string; color: string; badgeVariant: 'error' | 'warning' | 'info' | 'gray' | 'orange' }> = {
  critical: { label: 'Critical', color: 'text-rose-700',   badgeVariant: 'error'   },
  high:     { label: 'High',     color: 'text-orange-700', badgeVariant: 'orange'  },
  medium:   { label: 'Medium',   color: 'text-amber-700',  badgeVariant: 'warning' },
  low:      { label: 'Low',      color: 'text-sky-700',    badgeVariant: 'info'    },
};

const OUTCOME_META: Record<ViolationCaseOutcome, { label: string; icon: React.ReactNode; badgeVariant: 'warning' | 'gray' | 'info' | 'error' | 'orange' | 'success' }> = {
  pending:         { label: 'Pending',         icon: <AlertTriangle className="w-3.5 h-3.5" />, badgeVariant: 'warning' },
  dismissed:       { label: 'Dismissed',       icon: <CheckCircle2 className="w-3.5 h-3.5" />,  badgeVariant: 'gray'    },
  warned:          { label: 'Warned',          icon: <Info className="w-3.5 h-3.5" />,           badgeVariant: 'info'    },
  score_penalized: { label: 'Score Penalized', icon: <XCircle className="w-3.5 h-3.5" />,        badgeVariant: 'orange'  },
  invalidated:     { label: 'Invalidated',     icon: <XCircle className="w-3.5 h-3.5" />,        badgeVariant: 'error'   },
};

function violationTypeLabel(type: string): string {
  switch (type) {
    case 'tab_switch':    return 'Tab Switch';
    case 'window_blur':   return 'Window Blur';
    case 'right_click':   return 'Right Click';
    case 'auto_submitted': return 'Auto-Submitted';
    default: return type;
  }
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

interface ReviewModalProps {
  examId: string;
  studentId: string;
  studentName: string;
  existingCase: ViolationCase | null;
  violations: ViolationRecord[];
  onSaved: (c: ViolationCase) => void;
  onClose: () => void;
}

function ReviewModal({ examId, studentId, studentName, existingCase, violations, onSaved, onClose }: ReviewModalProps) {
  const suggested = suggestSeverity(violations);
  const [severity, setSeverity] = useState<ViolationCaseSeverity>(existingCase?.severity ?? suggested);
  const [outcome, setOutcome] = useState<ViolationCaseOutcome>(existingCase?.outcome ?? 'pending');
  const [notes, setNotes] = useState(existingCase?.teacherNotes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await violationCaseApi.upsert(examId, studentId, {
        id: existingCase?.id,
        severity,
        outcome,
        notes: notes.trim() || undefined,
      });
      toast.success('Case decision saved.');
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save case.');
    } finally {
      setSaving(false);
    }
  };

  const studentViolations = violations.filter(v => v.student_id === studentId);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Review Case — ${studentName}`}
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Decision'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Violation events */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Raw Violations ({studentViolations.length})
          </p>
          {studentViolations.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No violation events recorded.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Type</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Details</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Occurred</th>
                  </tr>
                </thead>
                <tbody>
                  {studentViolations.map(v => (
                    <tr key={v.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 text-center">
                        <span className="bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full">
                          {v.violation_no}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-700">{violationTypeLabel(v.violation_type)}</td>
                      <td className="px-3 py-2 text-gray-500">{v.details ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{v.occurred_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Decision form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Severity */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Severity
              {!existingCase && (
                <span className="ml-1.5 text-gray-400 font-normal normal-case">(suggested: {SEVERITY_META[suggested].label})</span>
              )}
            </label>
            <div className="relative">
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as ViolationCaseSeverity)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
              >
                {(Object.keys(SEVERITY_META) as ViolationCaseSeverity[]).map(s => (
                  <option key={s} value={s}>{SEVERITY_META[s].label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Outcome</label>
            <div className="relative">
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value as ViolationCaseOutcome)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
              >
                {(Object.keys(OUTCOME_META) as ViolationCaseOutcome[]).map(o => (
                  <option key={o} value={o}>{OUTCOME_META[o].label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Teacher notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teacher Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes about this case decision…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400"
          />
        </div>

        {/* Prior review info */}
        {existingCase?.reviewedAt && (
          <p className="text-xs text-gray-400">
            Last reviewed by <span className="font-medium text-gray-600">{existingCase.reviewerName ?? 'Unknown'}</span> on {existingCase.reviewedAt}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TeacherViolationCases() {
  const { currentUser, exams } = useApp();

  const myExams = exams.filter(e => e.teacherId === currentUser?.id);

  const [selectedExamId, setSelectedExamId] = useState<string>(myExams[0]?.id ?? '');
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [cases, setCases] = useState<ViolationCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ studentId: string; studentName: string } | null>(null);

  const load = useCallback(async (examId: string) => {
    if (!examId) return;
    setLoading(true);
    try {
      const [vData, cData] = await Promise.all([
        violationApi.listByExam(examId),
        violationCaseApi.listByExam(examId),
      ]);
      setViolations(vData);
      setCases(cData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedExamId) void load(selectedExamId);
  }, [selectedExamId, load]);

  // Group violations by student_id
  const studentMap = new Map<string, { studentId: string; studentName: string; studentEmail: string; violations: ViolationRecord[] }>();
  for (const v of violations) {
    if (!studentMap.has(v.student_id)) {
      // Look up name from existing case data or fall back to id
      const existingCase = cases.find(c => c.studentId === v.student_id);
      studentMap.set(v.student_id, {
        studentId: v.student_id,
        studentName: existingCase?.studentName ?? v.student_id,
        studentEmail: existingCase?.studentEmail ?? '',
        violations: [],
      });
    }
    studentMap.get(v.student_id)!.violations.push(v);
  }
  // Also include students who only have a case (no new violations window)
  for (const c of cases) {
    if (!studentMap.has(c.studentId)) {
      studentMap.set(c.studentId, {
        studentId: c.studentId,
        studentName: c.studentName,
        studentEmail: c.studentEmail,
        violations: [],
      });
    } else {
      const entry = studentMap.get(c.studentId)!;
      entry.studentName = c.studentName;
      entry.studentEmail = c.studentEmail;
    }
  }

  const rows = Array.from(studentMap.values());

  const selectedExam = myExams.find(e => e.id === selectedExamId);
  const pendingCount = rows.filter(r => {
    const c = cases.find(c => c.studentId === r.studentId);
    return !c || c.outcome === 'pending';
  }).length;

  const reviewingStudent = reviewTarget
    ? studentMap.get(reviewTarget.studentId) ?? null
    : null;
  const reviewingCase = reviewTarget
    ? cases.find(c => c.studentId === reviewTarget.studentId) ?? null
    : null;

  const handleCaseSaved = (saved: ViolationCase) => {
    setCases(prev => {
      const idx = prev.findIndex(c => c.studentId === saved.studentId && c.examId === saved.examId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setReviewTarget(null);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
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
            onClick={() => void load(selectedExamId)}
            disabled={loading || !selectedExamId}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Exam selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-semibold text-gray-700 shrink-0">Select Exam</label>
          <div className="relative flex-1 max-w-sm">
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
            >
              {myExams.length === 0 && <option value="">No exams available</option>}
              {myExams.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {selectedExam && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                {pendingCount} pending
              </span>
              <span>{rows.length} student{rows.length !== 1 ? 's' : ''} with violations</span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {!selectedExamId ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No exam selected</p>
          <p className="text-gray-400 text-sm mt-1">Choose an exam above to view its violation queue.</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-gray-300 animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading violations…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
          <p className="text-gray-700 font-medium">No violations recorded</p>
          <p className="text-gray-400 text-sm mt-1">All students behaved perfectly on this exam.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Student</th>
                  <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Events</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Suggested Severity</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Case Severity</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Outcome</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Notes</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const existingCase = cases.find(c => c.studentId === row.studentId);
                  const suggested = suggestSeverity(row.violations);
                  const severity = existingCase?.severity ?? null;
                  const outcome  = existingCase?.outcome  ?? 'pending';
                  const outcomeMeta = OUTCOME_META[outcome];
                  const isPending  = outcome === 'pending';

                  return (
                    <tr key={row.studentId} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{row.studentName}</div>
                        {row.studentEmail && (
                          <div className="text-xs text-gray-400 mt-0.5">{row.studentEmail}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`font-bold text-sm px-2.5 py-1 rounded-full ${row.violations.length >= MAX_TAB_SWITCHES ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {row.violations.length}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={SEVERITY_META[suggested].badgeVariant}>
                          {SEVERITY_META[suggested].label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {severity ? (
                          <Badge variant={SEVERITY_META[severity].badgeVariant}>
                            {SEVERITY_META[severity].label}
                          </Badge>
                        ) : (
                          <span className="text-gray-300 text-xs italic">Not set</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${outcomeMeta.badgeVariant === 'warning' ? 'bg-amber-100 text-amber-700' : outcomeMeta.badgeVariant === 'gray' ? 'bg-stone-100 text-stone-600' : outcomeMeta.badgeVariant === 'info' ? 'bg-sky-100 text-sky-700' : outcomeMeta.badgeVariant === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
                          {outcomeMeta.icon}
                          {outcomeMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-[180px]">
                        {existingCase?.teacherNotes ? (
                          <p className="text-xs text-gray-600 truncate" title={existingCase.teacherNotes}>
                            {existingCase.teacherNotes}
                          </p>
                        ) : (
                          <span className="text-gray-300 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setReviewTarget({ studentId: row.studentId, studentName: row.studentName })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewTarget && reviewingStudent && (
        <ReviewModal
          examId={selectedExamId}
          studentId={reviewTarget.studentId}
          studentName={reviewTarget.studentName}
          existingCase={reviewingCase}
          violations={violations}
          onSaved={handleCaseSaved}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
