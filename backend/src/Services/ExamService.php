<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\RoutineGateway;
use App\Services\Support\ExamMapper;
use App\Services\Support\ValueNormalizer;
use App\Support\ApiException;
use App\Support\Helpers;

final class ExamService
{
    public function __construct(
        private RoutineGateway $gateway,
        private ExamMapper $mapper,
        private ValueNormalizer $normalizer,
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
        $title = trim((string) ($payload['title'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $classId = trim((string) ($payload['classId'] ?? ''));
        $duration = (int) ($payload['duration'] ?? 0);
        $totalMarks = (int) ($payload['totalMarks'] ?? 0);
        $passingMarks = (int) ($payload['passingMarks'] ?? 0);
        $status = (string) ($payload['status'] ?? 'draft');

        if ($title === '' || $description === '' || $classId === '') {
            throw new ApiException(422, 'title, description, and classId are required.');
        }

        if (!in_array($status, ['draft', 'published', 'completed'], true)) {
            throw new ApiException(422, 'Invalid exam status.');
        }

        $questions = $this->normalizer->normalizeQuestions($payload['questions'] ?? []);

        $examId = (string) ($payload['id'] ?? Helpers::uuidV4());
        $teacherId = $authUser['role'] === 'teacher'
            ? (string) $authUser['id']
            : (string) ($payload['teacherId'] ?? $authUser['id']);

        $rows = $this->gateway->call('sp_exams_create', [
            $examId,
            $title,
            $description,
            $classId,
            $teacherId,
            $duration,
            $totalMarks,
            $passingMarks,
            $this->normalizer->normalizeDate((string) ($payload['startDate'] ?? 'now'), true),
            $this->normalizer->normalizeDate((string) ($payload['endDate'] ?? 'now'), true),
            $status,
            json_encode($questions, JSON_UNESCAPED_UNICODE),
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

        $title = trim((string) ($payload['title'] ?? $existing['title']));
        $description = trim((string) ($payload['description'] ?? $existing['description']));
        $classId = trim((string) ($payload['classId'] ?? $existing['classId']));
        $status = (string) ($payload['status'] ?? $existing['status']);

        if ($title === '' || $description === '' || $classId === '') {
            throw new ApiException(422, 'title, description, and classId are required.');
        }

        if (!in_array($status, ['draft', 'published', 'completed'], true)) {
            throw new ApiException(422, 'Invalid exam status.');
        }

        $questions = array_key_exists('questions', $payload)
            ? $this->normalizer->normalizeQuestions($payload['questions'])
            : $existing['questions'];

        $teacherId = $authUser['role'] === 'teacher'
            ? (string) $authUser['id']
            : (string) ($payload['teacherId'] ?? $existing['teacherId']);

        $updatedRows = $this->gateway->call('sp_exams_update', [
            $examId,
            $title,
            $description,
            $classId,
            $teacherId,
            (int) ($payload['duration'] ?? $existing['duration']),
            (int) ($payload['totalMarks'] ?? $existing['totalMarks']),
            (int) ($payload['passingMarks'] ?? $existing['passingMarks']),
            $this->normalizer->normalizeDate((string) ($payload['startDate'] ?? $existing['startDate']), true),
            $this->normalizer->normalizeDate((string) ($payload['endDate'] ?? $existing['endDate']), true),
            $status,
            json_encode($questions, JSON_UNESCAPED_UNICODE),
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
}
