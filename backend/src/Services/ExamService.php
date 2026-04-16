<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\RoutineGateway;
use App\Services\Support\ExamMapper;
use App\Services\Support\ExamPayloadValidator;
use App\Services\Support\ValueNormalizer;
use App\Support\ApiException;
use App\Support\Helpers;

final class ExamService
{
    public function __construct(
        private RoutineGateway $gateway,
        private ExamMapper $mapper,
        private ValueNormalizer $normalizer,
        private ExamPayloadValidator $validator,
    ) {
    }

    /**
     * @param array<string, mixed> $authUser
     * @return array<int, array<string, mixed>>
     */
    public function getExams(array $authUser): array
    {
        $rows = $this->gateway->call('sp_exams_get_for_user', [
            $authUser['role'],
            $authUser['id'],
        ]);

        return array_map(fn (array $row): array => $this->mapper->mapExamRow($row), $rows);
    }

    /**
     * @param array<string, mixed> $authUser
     * @return array<string, mixed>
     */
    public function getExamById(array $authUser, string $examId): array
    {
        $rows = $this->gateway->call('sp_exams_get_by_id_for_user', [
            $examId,
            $authUser['role'],
            $authUser['id'],
        ]);

        $row = $rows[0] ?? null;
        if (!is_array($row)) {
            throw new ApiException(404, 'Exam not found.');
        }

        return $this->mapper->mapExamRow($row);
    }

    /**
     * @param array<string, mixed> $authUser
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function createExam(array $authUser, array $payload): array
    {
        $validated = $this->validator->validateAndBuild($payload);
        $examId = $this->resolveExamId($payload);
        $teacherId = $this->resolveTeacherId($authUser, $payload);

        $rows = $this->gateway->call('sp_exams_create', [
            $examId,
            $validated['title'],
            $validated['description'],
            $validated['classId'],
            $teacherId,
            $validated['duration'],
            $validated['totalMarks'],
            $validated['passingMarks'],
            $validated['startDate'],
            $validated['endDate'],
            $validated['status'],
            $this->encodeQuestions($validated['questions']),
            $this->normalizer->normalizeDate((string) ($payload['createdAt'] ?? date('Y-m-d')), false),
        ]);

        $row = $rows[0] ?? null;
        if (!is_array($row)) {
            throw new ApiException(500, 'Exam creation failed.');
        }

        return $this->mapper->mapExamRow($row);
    }

    /**
     * @param array<string, mixed> $authUser
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function updateExam(array $authUser, string $examId, array $payload): array
    {
        $rows = $this->gateway->call('sp_exams_get_by_id', [$examId]);
        $row = $rows[0] ?? null;
        if (!is_array($row)) {
            throw new ApiException(404, 'Exam not found.');
        }

        $existing = $this->mapper->mapExamRow($row);

        if ($authUser['role'] === 'teacher' && $existing['teacherId'] !== $authUser['id']) {
            throw new ApiException(403, 'Teachers can only update their own exams.');
        }

        $validated = $this->validator->validateAndBuild($payload, $existing);
        $teacherId = $this->resolveTeacherId($authUser, $payload, $existing);

        $updatedRows = $this->gateway->call('sp_exams_update', [
            $examId,
            $validated['title'],
            $validated['description'],
            $validated['classId'],
            $teacherId,
            $validated['duration'],
            $validated['totalMarks'],
            $validated['passingMarks'],
            $validated['startDate'],
            $validated['endDate'],
            $validated['status'],
            $this->encodeQuestions($validated['questions']),
        ]);

        $updatedRow = $updatedRows[0] ?? null;
        if (!is_array($updatedRow)) {
            throw new ApiException(500, 'Exam update failed.');
        }

        return $this->mapper->mapExamRow($updatedRow);
    }

    /**
     * @param array<string, mixed> $authUser
     */
    public function deleteExam(array $authUser, string $examId): void
    {
        $rows = $this->gateway->call('sp_exams_get_by_id', [$examId]);
        $row = $rows[0] ?? null;
        if (!is_array($row)) {
            throw new ApiException(404, 'Exam not found.');
        }

        $exam = $this->mapper->mapExamRow($row);
        if ($authUser['role'] === 'teacher' && $exam['teacherId'] !== $authUser['id']) {
            throw new ApiException(403, 'Teachers can only delete their own exams.');
        }

        $this->gateway->call('sp_exams_delete', [$examId]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function resolveExamId(array $payload): string
    {
        $examId = trim((string) ($payload['id'] ?? Helpers::uuidV4()));
        return $examId === '' ? Helpers::uuidV4() : $examId;
    }

    /**
     * @param array<string, mixed> $authUser
     * @param array<string, mixed> $payload
     * @param array<string, mixed>|null $existing
     */
    private function resolveTeacherId(array $authUser, array $payload, ?array $existing = null): string
    {
        if (($authUser['role'] ?? '') === 'teacher') {
            return (string) $authUser['id'];
        }

        $fallback = $existing['teacherId'] ?? ($authUser['id'] ?? '');
        $teacherId = trim((string) ($payload['teacherId'] ?? $fallback));
        if ($teacherId === '') {
            throw new ApiException(422, 'teacherId is required.');
        }

        return $teacherId;
    }

    /**
     * @param array<int, array<string, mixed>> $questions
     */
    private function encodeQuestions(array $questions): string
    {
        $encoded = json_encode($questions, JSON_UNESCAPED_UNICODE);
        if (!is_string($encoded)) {
            throw new ApiException(500, 'Unable to encode exam questions.');
        }

        return $encoded;
    }
}

