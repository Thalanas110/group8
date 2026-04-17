<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Logging\ExamViolationService;
use App\Support\ApiException;

final class ExamViolationsController
{
    public function __construct(private ExamViolationService $violationService)
    {
    }

    /**
     * POST /exams/:id/violations
     * Called by the student frontend when a tab-switch / window-blur event fires.
     *
     * Body: { "type": "tab_switch"|"window_blur"|"right_click"|"auto_submitted", "details": "..." }
     *
     * @param array<string, string> $params
     * @param array<string, mixed>  $authUser
     * @return array{status: int, data: array<string, mixed>}
     */
    public function recordViolation(Request $request, array $params, array $authUser): array
    {
        $examId    = (string) ($params['id'] ?? '');
        $studentId = (string) ($authUser['id'] ?? '');

        if ($examId === '') {
            throw new ApiException(422, 'Exam id is required.');
        }
        if ($studentId === '') {
            throw new ApiException(401, 'Authenticated student id is missing.');
        }

        $type    = (string) ($request->body['type'] ?? 'tab_switch');
        $details = isset($request->body['details']) ? (string) $request->body['details'] : null;

        $allowed = ['tab_switch', 'window_blur', 'right_click', 'auto_submitted'];
        if (!in_array($type, $allowed, true)) {
            $type = 'tab_switch';
        }

        $row = $this->violationService->record($examId, $studentId, $type, $details);

        return ['status' => 201, 'data' => $row];
    }

    /**
     * GET /exams/:id/violations
     * Teacher / admin view — lists every anti-cheat violation for an exam.
     *
     * @param array<string, string> $params
     * @param array<string, mixed>  $authUser
     * @return array{status: int, data: array<int, array<string, mixed>>}
     */
    public function listViolations(array $params, array $authUser): array
    {
        $examId = (string) ($params['id'] ?? '');
        if ($examId === '') {
            throw new ApiException(422, 'Exam id is required.');
        }

        $violations = $this->violationService->listByExam($examId);

        return ['status' => 200, 'data' => $violations];
    }
}
