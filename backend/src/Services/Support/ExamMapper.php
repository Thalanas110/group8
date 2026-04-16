<?php

declare(strict_types=1);

namespace App\Services\Support;

use App\Security\AesGcmCrypto;
use App\Support\Helpers;

final class ExamMapper
{
    public function __construct(
        private AesGcmCrypto $crypto,
        private ValueNormalizer $normalizer,
    ) {
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function mapUserRow(array $row): array
    {
        return [
            'id' => (string) ($row['id'] ?? ''),
            'name' => (string) ($row['name'] ?? ''),
            'email' => (string) ($row['email'] ?? ''),
            'role' => (string) ($row['role'] ?? 'student'),
            'joinedAt' => (string) ($row['joinedAt'] ?? date('Y-m-d')),
            'department' => $this->crypto->decrypt($this->normalizer->nullableString($row['departmentEnc'] ?? null)),
            'phone' => $this->crypto->decrypt($this->normalizer->nullableString($row['phoneEnc'] ?? null)),
            'bio' => $this->crypto->decrypt($this->normalizer->nullableString($row['bioEnc'] ?? null)),
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function mapClassRow(array $row): array
    {
        $studentIds = Helpers::decodeJsonArray($row['studentIds'] ?? '[]');
        $studentIds = array_values(array_filter(
            array_map(static fn (mixed $id): string => (string) $id, $studentIds),
            static fn (string $id): bool => $id !== '',
        ));

        return [
            'id' => (string) ($row['id'] ?? ''),
            'name' => (string) ($row['name'] ?? ''),
            'subject' => (string) ($row['subject'] ?? ''),
            'teacherId' => (string) ($row['teacherId'] ?? ''),
            'studentIds' => $studentIds,
            'code' => (string) ($row['code'] ?? ''),
            'createdAt' => (string) ($row['createdAt'] ?? date('Y-m-d')),
            'description' => $this->normalizer->nullableString($row['description'] ?? null),
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function mapExamRow(array $row): array
    {
        $questions = Helpers::decodeJsonArray($row['questions'] ?? '[]');
        $normalizedQuestions = [];

        foreach ($questions as $question) {
            if (!is_array($question)) {
                continue;
            }

            $entry = [
                'id' => (string) ($question['id'] ?? ''),
                'text' => (string) ($question['text'] ?? ''),
                'type' => (string) ($question['type'] ?? 'mcq'),
                'marks' => (int) ($question['marks'] ?? 0),
            ];

            if (isset($question['options']) && is_array($question['options'])) {
                $entry['options'] = array_values(
                    array_map(static fn (mixed $value): string => (string) $value, $question['options']),
                );
            }

            if (array_key_exists('correctAnswer', $question)) {
                $entry['correctAnswer'] = (string) $question['correctAnswer'];
            }

            $normalizedQuestions[] = $entry;
        }

        return [
            'id' => (string) ($row['id'] ?? ''),
            'title' => (string) ($row['title'] ?? ''),
            'description' => (string) ($row['description'] ?? ''),
            'classId' => (string) ($row['classId'] ?? ''),
            'teacherId' => (string) ($row['teacherId'] ?? ''),
            'duration' => (int) ($row['duration'] ?? 0),
            'totalMarks' => (int) ($row['totalMarks'] ?? 0),
            'passingMarks' => (int) ($row['passingMarks'] ?? 0),
            'startDate' => (string) ($row['startDate'] ?? ''),
            'endDate' => (string) ($row['endDate'] ?? ''),
            'status' => (string) ($row['status'] ?? 'draft'),
            'questions' => $normalizedQuestions,
            'createdAt' => (string) ($row['createdAt'] ?? date('Y-m-d')),
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function mapSubmissionRow(array $row): array
    {
        $answers = Helpers::decodeJsonArray($row['answers'] ?? '[]');
        $normalizedAnswers = [];

        foreach ($answers as $answer) {
            if (!is_array($answer)) {
                continue;
            }

            $rawAnswer = (string) ($answer['answer'] ?? '');
            $decryptedAnswer = $rawAnswer;
            if (str_starts_with($rawAnswer, 'gcmv1:')) {
                $resolved = $this->crypto->decrypt($rawAnswer);
                $decryptedAnswer = $resolved ?? '[decryption_failed]';
            }

            $entry = [
                'questionId' => (string) ($answer['questionId'] ?? ''),
                'answer' => $decryptedAnswer,
            ];

            if (array_key_exists('marksAwarded', $answer)) {
                $entry['marksAwarded'] = (float) $answer['marksAwarded'];
            }

            $normalizedAnswers[] = $entry;
        }

        return [
            'id' => (string) ($row['id'] ?? ''),
            'examId' => (string) ($row['examId'] ?? ''),
            'studentId' => (string) ($row['studentId'] ?? ''),
            'answers' => $normalizedAnswers,
            'totalScore' => isset($row['totalScore']) ? (float) $row['totalScore'] : null,
            'percentage' => isset($row['percentage']) ? (float) $row['percentage'] : null,
            'grade' => isset($row['grade']) ? (string) $row['grade'] : null,
            'feedback' => $this->crypto->decrypt($this->normalizer->nullableString($row['feedbackEnc'] ?? null)),
            'submittedAt' => (string) ($row['submittedAt'] ?? ''),
            'gradedAt' => isset($row['gradedAt']) ? (string) $row['gradedAt'] : null,
            'status' => (string) ($row['status'] ?? 'submitted'),
        ];
    }
}
