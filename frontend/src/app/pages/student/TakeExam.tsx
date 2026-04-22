import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ConfirmDialog } from '../../components/shared/Modal';
import { useApp } from '../../context/AppContext';
import { AutoSubmitOverlay } from '../../features/student/take-exam/components/AutoSubmitOverlay';
import { ExamHeader } from '../../features/student/take-exam/components/ExamHeader';
import { ExamNavigation } from '../../features/student/take-exam/components/ExamNavigation';
import { ExamStartScreen } from '../../features/student/take-exam/components/ExamStartScreen';
import { QuestionCard } from '../../features/student/take-exam/components/QuestionCard';
import { QuestionNavigator } from '../../features/student/take-exam/components/QuestionNavigator';
import { SubmittedExamState } from '../../features/student/take-exam/components/SubmittedExamState';
import { ViolationWarningOverlay } from '../../features/student/take-exam/components/ViolationWarningOverlay';
import { useExamAntiCheat } from '../../features/student/take-exam/hooks/useExamAntiCheat';
import { useExamSession } from '../../features/student/take-exam/hooks/useExamSession';

export function TakeExam() {
  const { examId } = useParams<{ examId: string }>();
  const { currentUser, getClassById, getExamById, getStudentSubmission, submitExam } = useApp();
  const navigate = useNavigate();

  const exam = examId ? getExamById(examId) : null;
  const existingSub = exam && currentUser ? getStudentSubmission(exam.id, currentUser.id) : null;

  const session = useExamSession({
    exam,
    studentId: currentUser?.id,
    submitExam,
  });
  const antiCheat = useExamAntiCheat({
    examId,
    started: session.started,
    submitted: session.submitted,
    onAutoSubmit: session.handleSubmit,
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (!exam) {
      navigate('/student/exams');
    }
  }, [exam, currentUser, navigate]);

  if (!exam || !currentUser) return null;

  const examClass = getClassById(exam.classId);

  if (session.submitted || existingSub) {
    return (
      <SubmittedExamState
        exam={exam}
        submission={existingSub}
        submitted={session.submitted}
        onBackToExams={() => navigate('/student/exams')}
        onViewResults={() => navigate('/student/results')}
      />
    );
  }

  if (!session.started) {
    return (
      <ExamStartScreen
        exam={exam}
        classNameText={examClass?.name}
        onCancel={() => navigate('/student/exams')}
        onStart={session.startExam}
      />
    );
  }

  const question = session.currentQuestion;
  if (!question) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ViolationWarningOverlay
        isOpen={antiCheat.showViolationWarning}
        violationCount={antiCheat.tabSwitchCount}
        onClose={antiCheat.dismissViolationWarning}
      />

      <AutoSubmitOverlay reason={antiCheat.autoSubmitReason} />

      <ExamHeader
        examTitle={exam.title}
        classNameText={examClass?.name}
        answeredCount={session.answeredCount}
        totalQuestions={exam.questions.length}
        flaggedCount={session.flaggedCount}
        tabSwitchCount={antiCheat.tabSwitchCount}
        lastSaved={session.lastSaved}
        timeLeft={session.timeLeft}
        isUrgent={session.isUrgent}
        isVeryUrgent={session.isVeryUrgent}
        onSubmit={() => session.setShowConfirm(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <QuestionNavigator
          questions={exam.questions}
          currentQ={session.currentQ}
          answeredCount={session.answeredCount}
          progressPct={session.progressPct}
          isAnswered={session.isAnswered}
          isFlagged={session.isFlagged}
          onSelectQuestion={session.setCurrentQ}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <QuestionCard
              question={question}
              questionIndex={session.currentQ}
              totalQuestions={exam.questions.length}
              answer={session.currentAnswer}
              isFlagged={session.isFlagged(question.id)}
              wordCount={session.wordCount}
              charCount={session.charCount}
              onToggleFlag={() => session.toggleFlag(question.id)}
              onAnswerChange={value => session.updateAnswerValue(question.id, value)}
            />

            <ExamNavigation
              currentQ={session.currentQ}
              questions={exam.questions}
              answeredCount={session.answeredCount}
              lastSaved={session.lastSaved}
              isAnswered={session.isAnswered}
              onPrevious={() => session.setCurrentQ(current => Math.max(0, current - 1))}
              onNext={() => session.setCurrentQ(current => Math.min(exam.questions.length - 1, current + 1))}
              onSelectQuestion={session.setCurrentQ}
              onSubmit={() => session.setShowConfirm(true)}
            />
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={session.showConfirm}
        onClose={() => session.setShowConfirm(false)}
        onConfirm={session.handleSubmit}
        title="Submit Exam"
        message={`You have answered ${session.answeredCount} of ${exam.questions.length} questions. ${
          session.answeredCount < exam.questions.length
            ? `${exam.questions.length - session.answeredCount} unanswered question(s) will receive 0 marks. `
            : ''
        }${session.flaggedCount > 0 ? `You also have ${session.flaggedCount} flagged question(s). ` : ''}Are you sure you want to submit?`}
        confirmLabel="Submit Exam"
        confirmVariant="primary"
      />
    </div>
  );
}
