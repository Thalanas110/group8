import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  Clock,
  Filter,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  reportApi,
  type CommonWrongAnswerReport,
  type QuestionAnalyticsQuestion,
  type QuestionAnalyticsReport,
  type WeakTopicByClassReport,
} from '../../services/api';

type QuestionAnalyticsSectionProps = {
  audienceLabel: 'Teacher' | 'Admin';
};

const selectClassNames = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900';

function formatSeconds(value?: number | null): string {
  if (value === null || value === undefined) return 'No data';
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

function scoreTone(score?: number | null): string {
  if (score === null || score === undefined) return 'text-gray-400';
  if (score < 45) return 'text-red-600';
  if (score < 65) return 'text-amber-600';
  return 'text-emerald-600';
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      <div className="mt-1 text-sm text-gray-400">{body}</div>
    </div>
  );
}

function ListCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: React.ReactNode[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {items.length > 0 ? items : [<EmptyState key="empty" title="No matching data yet" body="Try another filter or wait for more graded attempts." />]}
      </div>
    </div>
  );
}

export function QuestionAnalyticsSection({ audienceLabel }: QuestionAnalyticsSectionProps) {
  const [report, setReport] = useState<QuestionAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const next = await reportApi.getQuestionAnalytics();
        if (!active) return;
        setReport(next);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const classOptions = useMemo(() => {
    const index = new Map<string, string>();
    for (const question of report?.questions ?? []) {
      if (!index.has(question.classId)) {
        index.set(question.classId, question.className);
      }
    }
    return Array.from(index.entries()).map(([id, name]) => ({ id, name }));
  }, [report]);

  const examOptions = useMemo(() => {
    const index = new Map<string, { id: string; title: string; classId: string }>();
    for (const question of report?.questions ?? []) {
      if (selectedClass !== 'all' && question.classId !== selectedClass) continue;
      if (!index.has(question.examId)) {
        index.set(question.examId, {
          id: question.examId,
          title: question.examTitle,
          classId: question.classId,
        });
      }
    }
    return Array.from(index.values());
  }, [report, selectedClass]);

  const topicOptions = useMemo(() => {
    const topics = new Set<string>();
    for (const question of report?.questions ?? []) {
      if (selectedClass !== 'all' && question.classId !== selectedClass) continue;
      if (selectedExam !== 'all' && question.examId !== selectedExam) continue;
      if (question.topic) topics.add(question.topic);
    }
    return Array.from(topics.values()).sort((left, right) => left.localeCompare(right));
  }, [report, selectedClass, selectedExam]);

  const selectedExamClassId = useMemo(() => {
    if (!report || selectedExam === 'all') return null;
    return report.questions.find(question => question.examId === selectedExam)?.classId ?? null;
  }, [report, selectedExam]);

  const filteredQuestions = useMemo(() => {
    return (report?.questions ?? []).filter(question => {
      if (selectedClass !== 'all' && question.classId !== selectedClass) return false;
      if (selectedExam !== 'all' && question.examId !== selectedExam) return false;
      if (selectedTopic !== 'all' && question.topic !== selectedTopic) return false;
      return true;
    });
  }, [report, selectedClass, selectedExam, selectedTopic]);

  const filteredWrongAnswers = useMemo(() => {
    return (report?.commonWrongAnswers ?? []).filter(item => {
      if (selectedClass !== 'all' && item.classId !== selectedClass) return false;
      if (selectedExam !== 'all' && item.examId !== selectedExam) return false;
      if (selectedTopic !== 'all' && item.topic !== selectedTopic) return false;
      return true;
    });
  }, [report, selectedClass, selectedExam, selectedTopic]);

  const filteredWeakTopics = useMemo(() => {
    return (report?.weakTopicsByClass ?? []).filter(item => {
      const classMatch = selectedClass !== 'all'
        ? item.classId === selectedClass
        : selectedExamClassId === null || item.classId === selectedExamClassId;
      if (!classMatch) return false;
      if (selectedTopic !== 'all' && item.topic !== selectedTopic) return false;
      return true;
    });
  }, [report, selectedClass, selectedExamClassId, selectedTopic]);

  const hardestQuestions = useMemo(() => {
    return [...filteredQuestions]
      .filter(question => question.averageScorePct !== null && question.averageScorePct !== undefined)
      .sort((left, right) => (left.averageScorePct ?? 101) - (right.averageScorePct ?? 101))
      .slice(0, 5);
  }, [filteredQuestions]);

  const slowestQuestions = useMemo(() => {
    return [...filteredQuestions]
      .filter(question => question.averageTimeSpentSeconds !== null && question.averageTimeSpentSeconds !== undefined)
      .sort((left, right) => (right.averageTimeSpentSeconds ?? 0) - (left.averageTimeSpentSeconds ?? 0))
      .slice(0, 5);
  }, [filteredQuestions]);

  const telemetryCoveragePct = report && report.coverage.totalSubmissions > 0
    ? Math.round((report.coverage.telemetryEnabledSubmissions / report.coverage.totalSubmissions) * 100)
    : 0;
  const topicCoveragePct = report && report.coverage.totalQuestions > 0
    ? Math.round((report.coverage.topicTaggedQuestions / report.coverage.totalQuestions) * 100)
    : 0;

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-[0_22px_52px_-36px_rgba(40,28,17,0.6)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-gray-100" />
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-72 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Question analytics could not be loaded</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(17,24,39,0.12),_transparent_28%),linear-gradient(135deg,_#fffdf7,_#ffffff_55%,_#f7f7f5)] p-6 shadow-[0_28px_64px_-40px_rgba(47,31,17,0.6)]">
        <div className="absolute right-4 top-4 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500 backdrop-blur">
          Future-aware analytics
        </div>
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-[0_16px_34px_-20px_rgba(17,24,39,0.9)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Question Intelligence</h2>
              <p className="mt-1 text-sm text-gray-600">
                {audienceLabel} view of question difficulty, wrong-answer patterns, pacing, and weak class topics.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Telemetry Coverage',
                value: `${telemetryCoveragePct}%`,
                note: `${report.coverage.telemetryEnabledSubmissions}/${report.coverage.totalSubmissions} submissions`,
                icon: Clock,
              },
              {
                label: 'Topic Coverage',
                value: `${topicCoveragePct}%`,
                note: `${report.coverage.topicTaggedQuestions}/${report.coverage.totalQuestions} questions tagged`,
                icon: BookOpen,
              },
              {
                label: 'Questions in Scope',
                value: filteredQuestions.length,
                note: 'After current filters',
                icon: BarChart2,
              },
              {
                label: 'Classes in Scope',
                value: new Set(filteredQuestions.map(question => question.classId)).size,
                note: 'Across scoped analytics',
                icon: Users,
              },
            ].map(card => (
              <div key={card.label} className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-900 text-white">
                  <card.icon className="h-4.5 w-4.5" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{card.label}</div>
                <div className="mt-2 text-sm text-gray-500">{card.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Scope Filters</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className={selectClassNames}>
            <option value="all">All classes</option>
            {classOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className={selectClassNames}>
            <option value="all">All exams</option>
            {examOptions.map(option => (
              <option key={option.id} value={option.id}>{option.title}</option>
            ))}
          </select>
          <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} className={selectClassNames}>
            <option value="all">All topics</option>
            {topicOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Time-based metrics only appear for newer attempts that submitted telemetry. Topic-based insights only use questions tagged with a topic.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ListCard
          title="Hardest Questions"
          subtitle="Lowest average score after grading"
          items={hardestQuestions.map(question => (
            <div key={question.questionId} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{question.questionText}</div>
                  <div className="mt-1 text-xs text-gray-500">{question.examTitle} • {question.className}{question.topic ? ` • ${question.topic}` : ''}</div>
                </div>
                <div className={`text-right text-lg font-semibold ${scoreTone(question.averageScorePct)}`}>
                  {question.averageScorePct?.toFixed(1)}%
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{question.gradedCount} graded responses</span>
                <span>{question.correctRatePct !== null && question.correctRatePct !== undefined ? `${question.correctRatePct.toFixed(1)}% correct` : 'Manual grading only'}</span>
              </div>
            </div>
          ))}
        />

        <ListCard
          title="Slowest Questions"
          subtitle="Average time spent from telemetry-enabled attempts"
          items={slowestQuestions.map(question => (
            <div key={question.questionId} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{question.questionText}</div>
                  <div className="mt-1 text-xs text-gray-500">{question.examTitle} • {question.className}{question.topic ? ` • ${question.topic}` : ''}</div>
                </div>
                <div className="text-right text-lg font-semibold text-gray-900">
                  {formatSeconds(question.averageTimeSpentSeconds)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{question.telemetryCount} attempts with telemetry</span>
                <span>{question.averageScorePct !== null && question.averageScorePct !== undefined ? `${question.averageScorePct.toFixed(1)}% avg score` : 'Ungraded'}</span>
              </div>
            </div>
          ))}
        />

        <ListCard
          title="Common Wrong Answers"
          subtitle="Most-selected incorrect options for MCQs"
          items={filteredWrongAnswers.slice(0, 5).map((item: CommonWrongAnswerReport) => (
            <div key={`${item.questionId}-${item.option}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{item.questionText}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.examTitle} • {item.className}{item.topic ? ` • ${item.topic}` : ''}</div>
                </div>
                <div className="rounded-xl bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                  {item.option}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{item.count} incorrect selections</span>
                <span>{item.shareOfIncorrectPct.toFixed(1)}% of wrong answers</span>
              </div>
            </div>
          ))}
        />

        <ListCard
          title="Weak Topics by Class"
          subtitle="Lowest-performing tagged topics within scope"
          items={filteredWeakTopics.slice(0, 5).map((item: WeakTopicByClassReport) => (
            <div key={`${item.classId}-${item.topic}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{item.topic}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.className}</div>
                </div>
                <div className={`text-right text-lg font-semibold ${scoreTone(item.averageScorePct)}`}>
                  {item.averageScorePct.toFixed(1)}%
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{item.questionCount} tagged questions</span>
                <span>{formatSeconds(item.averageTimeSpentSeconds)}</span>
              </div>
            </div>
          ))}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Question Performance Ledger</h3>
          <p className="mt-1 text-xs text-gray-500">Detailed per-question metrics after the current filters are applied.</p>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="px-5 py-8">
            <EmptyState title="No question analytics yet" body="Once graded submissions and tagged questions exist, this ledger will populate automatically." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-[0.16em] text-gray-400">
                  <th className="px-5 py-3 font-medium">Question</th>
                  <th className="px-5 py-3 font-medium">Scope</th>
                  <th className="px-5 py-3 font-medium">Avg Score</th>
                  <th className="px-5 py-3 font-medium">Correct Rate</th>
                  <th className="px-5 py-3 font-medium">Avg Time</th>
                  <th className="px-5 py-3 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQuestions.map((question: QuestionAnalyticsQuestion) => (
                  <tr key={`${question.examId}-${question.questionId}`} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{question.questionText}</div>
                      <div className="mt-1 text-xs text-gray-500">{question.questionType.replace('_', ' ')}{question.topic ? ` • ${question.topic}` : ' • Untagged'}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      <div>{question.examTitle}</div>
                      <div className="mt-1 text-xs text-gray-400">{question.className}</div>
                    </td>
                    <td className={`px-5 py-4 font-semibold ${scoreTone(question.averageScorePct)}`}>
                      {question.averageScorePct !== null && question.averageScorePct !== undefined ? `${question.averageScorePct.toFixed(1)}%` : 'Pending'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {question.correctRatePct !== null && question.correctRatePct !== undefined ? `${question.correctRatePct.toFixed(1)}%` : 'n/a'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatSeconds(question.averageTimeSpentSeconds)}</td>
                    <td className="px-5 py-4 text-gray-500">
                      <div>{question.gradedCount} graded</div>
                      <div className="mt-1 text-xs text-gray-400">{question.telemetryCount} with telemetry</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
