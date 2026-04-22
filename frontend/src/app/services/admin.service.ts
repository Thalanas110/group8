import { request } from './http/request';
import type { ExamResponse } from './exam.service';
import type { ResultResponse } from './result.service';

export const adminApi = {
  getExams: () =>
    request<(ExamResponse & { submissionCount: number; averageScore: number })[]>(
      'GET',
      '/admin/exams',
      undefined,
      true,
    ),

  getResults: () =>
    request<(ResultResponse & { studentName: string; examTitle: string })[]>(
      'GET',
      '/admin/results',
      undefined,
      true,
    ),
};
