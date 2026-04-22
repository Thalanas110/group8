import React from 'react';
import { Badge } from '../../../components/shared/Badge';
import { OUTCOME_META, SEVERITY_META, type ViolationCaseRow, MAX_TAB_SWITCHES } from './case-meta';

interface ViolationCasesTableProps {
  rows: ViolationCaseRow[];
  onReview: (studentId: string, studentName: string) => void;
}

export function ViolationCasesTable({ rows, onReview }: ViolationCasesTableProps) {
  return (
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
              const outcomeMeta = OUTCOME_META[row.outcome];
              const isPending = row.outcome === 'pending';

              return (
                <tr
                  key={row.studentId}
                  className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900">{row.studentName}</div>
                    {row.studentEmail && (
                      <div className="text-xs text-gray-400 mt-0.5">{row.studentEmail}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`font-bold text-sm px-2.5 py-1 rounded-full ${row.violations.length >= MAX_TAB_SWITCHES ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                      {row.violations.length}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={SEVERITY_META[row.suggestedSeverity].badgeVariant}>
                      {SEVERITY_META[row.suggestedSeverity].label}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    {row.existingCase ? (
                      <Badge variant={SEVERITY_META[row.existingCase.severity].badgeVariant}>
                        {SEVERITY_META[row.existingCase.severity].label}
                      </Badge>
                    ) : (
                      <span className="text-gray-300 text-xs italic">Not set</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                        outcomeMeta.badgeVariant === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : outcomeMeta.badgeVariant === 'gray'
                          ? 'bg-stone-100 text-stone-600'
                          : outcomeMeta.badgeVariant === 'info'
                          ? 'bg-sky-100 text-sky-700'
                          : outcomeMeta.badgeVariant === 'error'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {outcomeMeta.icon}
                      {outcomeMeta.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-[180px]">
                    {row.existingCase?.teacherNotes ? (
                      <p className="text-xs text-gray-600 truncate" title={row.existingCase.teacherNotes}>
                        {row.existingCase.teacherNotes}
                      </p>
                    ) : (
                      <span className="text-gray-300 text-xs italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onReview(row.studentId, row.studentName)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    >
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
  );
}
