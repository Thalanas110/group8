<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\RoutineGateway;
use App\Security\AesGcmCrypto;
use App\Services\Support\ExamMapper;
use App\Services\Support\ValueNormalizer;
use App\Support\ApiException;
use App\Support\Helpers;

final class ResultService
{
    public function __construct(
        private RoutineGateway $gateway,
        private AesGcmCrypto $crypto,
        private ExamMapper $mapper,
        private ValueNormalizer $normalizer,
    ) {
    }

    /**
     * @param array<string, mixed> $authUser
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function submitResult(array $authUser, array $payload): array
    {
        $examId = trim((string) ($payload['examId'] ?? ''));
        if ($examId === '') {
            throw new ApiException(422, 'examId is required.');
        }

        $examRows = $this->gateway->call('sp_exams_get_by_id_for_user', [$examId, $authUser['role'], $authUser['id']]);
        $examRow = $examRows[0] ?? null;
        if (!is_array($examRow)) {
            throw new ApiException(404, 'Exam not found.');
        }

        $exam = $this->mapper->mapExamRow($examRow);
        $answersInput = $payload['answers'] ?? [];
        if (!is_array($answersInput)) {
            throw new ApiException(422, 'answers must be an array.');
        }

        $gradedAnswers = [];
        $mcqScore = 0.0;

        foreach ($answersInput as $answerRow) {
            $position = count($gradedAnswers) + 1;
            if (!is_array($answerRow)) {
                throw new ApiException(422, sprintf('Answer %d is invalid.', $position));
            }

            $questionId = trim((string) ($answerRow['questionId'] ?? ''));
            $answerValue = (string) ($answerRow['answer'] ?? '');
            if ($questionId === '') {
                throw new ApiException(422, sprintf('Answer %d questionId is required.', $position));
            }

            [$answerCiphertext, $answerIv, $answerTag] = $this->crypto->encryptParams($answerValue);
            if ($answerValue !== '' && $answerCiphertext === null) {
                throw new ApiException(500, 'Failed to encrypt exam answer.');
            }

            $entry = [
                'questionId' => $questionId,
                'answerCiphertext' => $answerCiphertext,
                'answerIv' => $answerIv,
                'answerTag' => $answerTag,
            ];

            foreach ($exam['questions'] as $question) {
                if (($question['id'] ?? '') !== $questionId) {
                    continue;
                }

                if (($question['type'] ?? '') === 'mcq') {
                    $isCorrect = isset($question['correctAnswer']) && $answerValue === (string) $question['correctAnswer'];
                    $marksAwarded = $isCorrect ? (float) ($question['marks'] ?? 0) : 0.0;
                    $entry['marksAwarded'] = $marksAwarded;
                    $mcqScore += $marksAwarded;
                }

                break;
            }

            $gradedAnswers[] = $entry;
        }

        $hasNonMcq = false;
        foreach ($exam['questions'] as $question) {
            if (($question['type'] ?? '') !== 'mcq') {
                $hasNonMcq = true;
                break;
            }
        }

        $status = $hasNonMcq ? 'submitted' : 'graded';
        $totalScore = $hasNonMcq ? null : $mcqScore;
        $percentage = null;
        $grade = null;
        $gradedAt = null;

        if (!$hasNonMcq) {
            $totalMarks = (float) ($exam['totalMarks'] ?? 0);
            $percentage = $totalMarks > 0 ? round(($mcqScore / $totalMarks) * 100, 2) : 0.0;
            $grade = Helpers::gradeFromPercentage($percentage);
            $gradedAt = gmdate('Y-m-d H:i:s');
        }
        [$feedbackCiphertext, $feedbackIv, $feedbackTag] = $this->crypto->encryptParams(null);

        $rows = $this->gateway->call('sp_results_submit', [
            (string) ($payload['id'] ?? Helpers::uuidV4()),
            $examId,
            (string) $authUser['id'],
            json_encode($gradedAnswers, JSON_UNESCAPED_UNICODE),
            $totalScore,
            $percentage,
            $grade,
            $feedbackCiphertext,
            $feedbackIv,
            $feedbackTag,
            null,
            $this->normalizer->normalizeDate((string) ($payload['submittedAt'] ?? gmdate('c')), true),
            $gradedAt,
            $status,
        ]);

        $row = $rows[0] ?? null;
        if (!is_array($row)) {
            throw new ApiException(500, 'Submission failed.');
        }

        if (array_key_exists('questionTelemetry', $payload) && is_array($payload['questionTelemetry'])) {
            $this->persistQuestionTelemetry(
                (string) ($row['id'] ?? ''),
                $examId,
                (string) $authUser['id'],
                $exam['questions'],
                $payload['questionTelemetry'],
            );
        }

        return $this->mapper->mapSubmissionRow($row);
    }

    /**
     * @param array<string, mixed> $authUser
     * @return array<int, array<string, mixed>>
     */
    public function getResultsByStudent(array $authUser, string $studentId): array
    {
        $rows = $this->gateway->call('sp_results_get_by_student_for_user', [
            $studentId,
            $authUser['role'],
            $authUser['id'],
        ]);

        return array_map(fn (array $row): array => $this->mapper->mapSubmissionRow($row), $rows);
    }

    /**
     * @param array<string, mixed> $authUser
     * @param array<int, array<string, mixed>> $grades
     * @return array<string, mixed>
     */
    public function gradeSubmission(array $authUser, string $submissionId, array $grades, string $feedback): array
    {
        $rows = $this->gateway->call('sp_results_get_by_id_for_user', [
            $submissionId,
            $authUser['role'],
            $authUser['id'],
        ]);

        $row = $rows[0] ?? null;
        if (!is_array($row)) {
            throw new ApiException(404, 'Submission not found.');
        }

        $submission = $this->mapper->mapSubmissionRow($row);
        $answers = $submission['answers'];

        $gradeMap = [];
        foreach ($grades as $gradeRow) {
            if (!is_array($gradeRow)) {
                continue;
            }

            $questionId = (string) ($gradeRow['questionId'] ?? '');
            if ($questionId === '') {
                continue;
            }

            $gradeMap[$questionId] = (float) ($gradeRow['marksAwarded'] ?? 0);
        }

        foreach ($answers as $index => $answer) {
            $questionId = (string) ($answer['questionId'] ?? '');
            if ($questionId !== '' && isset($gradeMap[$questionId])) {
                $answers[$index]['marksAwarded'] = $gradeMap[$questionId];
            }
        }

        $totalScore = 0.0;
        foreach ($answers as $answer) {
            $totalScore += (float) ($answer['marksAwarded'] ?? 0);
        }

        $totalMarks = (float) ($row['totalMarks'] ?? 0);
        $percentage = $totalMarks > 0 ? round(($totalScore / $totalMarks) * 100, 2) : 0.0;
        $grade = Helpers::gradeFromPercentage($percentage);
        [$feedbackCiphertext, $feedbackIv, $feedbackTag] = $this->crypto->encryptParams($feedback);

        $updatedRows = $this->gateway->call('sp_results_grade_update', [
            $submissionId,
            json_encode($this->encryptAnswerPayload($answers), JSON_UNESCAPED_UNICODE),
            $totalScore,
            $percentage,
            $grade,
            $feedbackCiphertext,
            $feedbackIv,
            $feedbackTag,
            null,
            gmdate('Y-m-d H:i:s'),
            'graded',
        ]);

        $updatedRow = $updatedRows[0] ?? null;
        if (!is_array($updatedRow)) {
            throw new ApiException(500, 'Grade update failed.');
        }

        return $this->mapper->mapSubmissionRow($updatedRow);
    }

    /**
     * @param array<int, array<string, mixed>> $answers
     * @return array<int, array<string, mixed>>
     */
    private function encryptAnswerPayload(array $answers): array
    {
        $result = [];
        foreach ($answers as $answer) {
            if (!is_array($answer)) {
                continue;
            }

            $questionId = (string) ($answer['questionId'] ?? '');
            if ($questionId === '') {
                continue;
            }

            $plainAnswer = (string) ($answer['answer'] ?? '');
            [$answerCiphertext, $answerIv, $answerTag] = $this->crypto->encryptParams($plainAnswer);
            if ($plainAnswer !== '' && $answerCiphertext === null) {
                throw new ApiException(500, 'Failed to encrypt exam answer.');
            }

            $entry = [
                'questionId' => $questionId,
                'answerCiphertext' => $answerCiphertext,
                'answerIv' => $answerIv,
                'answerTag' => $answerTag,
            ];

            if (array_key_exists('marksAwarded', $answer)) {
                $entry['marksAwarded'] = (float) $answer['marksAwarded'];
            }

            $result[] = $entry;
        }

        return $result;
    }

    /**
     * @param array<int, array<string, mixed>> $questions
     * @param array<int, array<string, mixed>> $questionTelemetry
     */
    private function persistQuestionTelemetry(
        string $submissionId,
        string $examId,
        string $studentId,
        array $questions,
        array $questionTelemetry,
    ): void {
        if ($submissionId === '') {
            return;
        }

        $questionTopicMap = [];
        foreach ($questions as $question) {
            if (!is_array($question)) {
                continue;
            }

            $questionId = (string) ($question['id'] ?? '');
            if ($questionId === '') {
                continue;
            }

            $questionTopicMap[$questionId] = $this->normalizer->nullableString($question['topic'] ?? null);
        }

        $this->gateway->call('sp_submission_question_metrics_delete_by_submission', [$submissionId]);

        foreach ($questionTelemetry as $metric) {
            if (!is_array($metric)) {
                continue;
            }

            $questionId = trim((string) ($metric['questionId'] ?? ''));
            if ($questionId === '') {
                continue;
            }

            $topic = $this->normalizer->nullableString($metric['topic'] ?? ($questionTopicMap[$questionId] ?? null));

            $this->gateway->call('sp_submission_question_metrics_upsert', [
                $submissionId,
                $examId,
                $studentId,
                $questionId,
                $topic,
                max(0, (int) ($metric['timeSpentSeconds'] ?? 0)),
                max(0, (int) ($metric['visitCount'] ?? 0)),
                max(0, (int) ($metric['answerChangeCount'] ?? 0)),
            ]);
        }
    }
}
