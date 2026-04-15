<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\ReportService;

final class AdminController
{
    public function __construct(private ReportService $reportService)
    {
    }

    /**
     * @return array{status: int, data: array<string, mixed>|array<int, mixed>}
     */
    public function getAdminExams(): array
    {
        return ['status' => 200, 'data' => $this->reportService->getAdminExams()];
    }

    /**
     * @return array{status: int, data: array<string, mixed>|array<int, mixed>}
     */
    public function getAdminResults(): array
    {
        return ['status' => 200, 'data' => $this->reportService->getAdminResults()];
    }
}
