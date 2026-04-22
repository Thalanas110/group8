import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Exam } from '../../../data/types';
import {
  violationApi,
  violationCaseApi,
  type ViolationCase,
  type ViolationRecord,
} from '../../../services/api';
import { suggestSeverity, type ViolationCaseRow } from './case-meta';

export function useViolationCases(myExams: Exam[]) {
  const [selectedExamId, setSelectedExamId] = useState<string>(myExams[0]?.id ?? '');
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [cases, setCases] = useState<ViolationCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ studentId: string; studentName: string } | null>(null);

  const load = useCallback(async (examId: string) => {
    if (!examId) return;

    setLoading(true);
    try {
      const [violationData, caseData] = await Promise.all([
        violationApi.listByExam(examId),
        violationCaseApi.listByExam(examId),
      ]);
      setViolations(violationData);
      setCases(caseData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      void load(selectedExamId);
    }
  }, [selectedExamId, load]);

  const rows = useMemo<ViolationCaseRow[]>(() => {
    const studentMap = new Map<string, { studentId: string; studentName: string; studentEmail: string; violations: ViolationRecord[] }>();

    for (const violation of violations) {
      if (!studentMap.has(violation.student_id)) {
        const existingCase = cases.find(caseItem => caseItem.studentId === violation.student_id);
        studentMap.set(violation.student_id, {
          studentId: violation.student_id,
          studentName: existingCase?.studentName ?? violation.student_id,
          studentEmail: existingCase?.studentEmail ?? '',
          violations: [],
        });
      }

      studentMap.get(violation.student_id)?.violations.push(violation);
    }

    for (const caseItem of cases) {
      if (!studentMap.has(caseItem.studentId)) {
        studentMap.set(caseItem.studentId, {
          studentId: caseItem.studentId,
          studentName: caseItem.studentName,
          studentEmail: caseItem.studentEmail,
          violations: [],
        });
      } else {
        const entry = studentMap.get(caseItem.studentId);
        if (entry) {
          entry.studentName = caseItem.studentName;
          entry.studentEmail = caseItem.studentEmail;
        }
      }
    }

    return Array.from(studentMap.values()).map(entry => {
      const existingCase = cases.find(caseItem => caseItem.studentId === entry.studentId) ?? null;
      return {
        ...entry,
        existingCase,
        suggestedSeverity: suggestSeverity(entry.violations),
        outcome: existingCase?.outcome ?? 'pending',
      };
    });
  }, [cases, violations]);

  const selectedExam = myExams.find(exam => exam.id === selectedExamId);

  const pendingCount = useMemo(
    () => rows.filter(row => !row.existingCase || row.outcome === 'pending').length,
    [rows],
  );

  const reviewingRow = useMemo(
    () => (reviewTarget ? rows.find(row => row.studentId === reviewTarget.studentId) ?? null : null),
    [reviewTarget, rows],
  );

  const handleCaseSaved = (savedCase: ViolationCase) => {
    setCases(previous => {
      const existingIndex = previous.findIndex(
        caseItem => caseItem.studentId === savedCase.studentId && caseItem.examId === savedCase.examId,
      );

      if (existingIndex >= 0) {
        const next = [...previous];
        next[existingIndex] = savedCase;
        return next;
      }

      return [savedCase, ...previous];
    });

    setReviewTarget(null);
  };

  return {
    selectedExamId,
    setSelectedExamId,
    violations,
    loading,
    rows,
    selectedExam,
    pendingCount,
    reviewTarget,
    setReviewTarget,
    reviewingRow,
    handleCaseSaved,
    refresh: () => load(selectedExamId),
  };
}
