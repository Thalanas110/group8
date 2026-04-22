import { PlusCircle } from 'lucide-react';
import { Modal } from '../../../../components/shared/Modal';
import type { Class, Exam, ExamStatus, Question } from '../../../../data/types';
import type { ExamFormData } from '../lib/exam-form';
import { QuestionEditorCard } from './QuestionEditorCard';

interface ExamEditorModalProps {
  isOpen: boolean;
  editingExam: Exam | null;
  form: ExamFormData;
  classes: Class[];
  onClose: () => void;
  onSave: () => void;
  onChange: (updater: (current: ExamFormData) => ExamFormData) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
  onUpdateQuestion: (index: number, data: Partial<Question>) => void;
  onUpdateOption: (questionIndex: number, optionIndex: number, value: string) => void;
}

export function ExamEditorModal({
  isOpen,
  editingExam,
  form,
  classes,
  onClose,
  onSave,
  onChange,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onUpdateOption,
}: ExamEditorModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExam ? 'Edit Exam' : 'Create New Exam'}
      size="xl"
      footer={(
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-700 transition-colors">
            {editingExam ? 'Save Changes' : 'Create Exam'}
          </button>
        </>
      )}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={event => onChange(current => ({ ...current, title: event.target.value }))}
                placeholder="e.g. Algebra Midterm Exam"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={event => onChange(current => ({ ...current, description: event.target.value }))}
                placeholder="Brief exam description..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  value={form.classId}
                  onChange={event => onChange(current => ({ ...current, classId: event.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="">Select class...</option>
                  {classes.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={event => onChange(current => ({ ...current, status: event.target.value as ExamStatus }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={event => onChange(current => ({ ...current, duration: +event.target.value }))}
                  min={5}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  value={form.totalMarks}
                  onChange={event => onChange(current => ({ ...current, totalMarks: +event.target.value }))}
                  min={1}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pass Marks</label>
                <input
                  type="number"
                  value={form.passingMarks}
                  onChange={event => onChange(current => ({ ...current, passingMarks: +event.target.value }))}
                  min={1}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={event => onChange(current => ({ ...current, startDate: event.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={event => onChange(current => ({ ...current, endDate: event.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Questions ({form.questions.length})</h3>
            <button onClick={onAddQuestion} className="flex items-center gap-1.5 text-gray-600 text-sm font-medium hover:text-gray-900">
              <PlusCircle className="w-4 h-4" /> Add Question
            </button>
          </div>
          <div className="space-y-4">
            {form.questions.map((question, index) => (
              <QuestionEditorCard
                key={question.id}
                index={index}
                question={question}
                onRemove={onRemoveQuestion}
                onUpdateQuestion={onUpdateQuestion}
                onUpdateOption={onUpdateOption}
              />
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
  );
}
