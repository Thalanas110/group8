import type { Exam } from '../../../../data/types';

interface ExamSelectionChipsProps {
  exams: Exam[];
  selectedExam: string | null;
  onToggleExam: (examId: string | null) => void;
}

export function ExamSelectionChips({
  exams,
  selectedExam,
  onToggleExam,
}: ExamSelectionChipsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onToggleExam(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
          !selectedExam ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        All Exams
      </button>
      {exams.map(exam => (
        <button
          key={exam.id}
          onClick={() => onToggleExam(selectedExam === exam.id ? null : exam.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            selectedExam === exam.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {exam.title}
        </button>
      ))}
    </div>
  );
}
