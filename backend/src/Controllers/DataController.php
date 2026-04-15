<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\DataService;
use App\Services\SeedService;

final class DataController
{
    public function __construct(
        private DataService $dataService,
        private SeedService $seedService,
    ) {
    }

    /**
     * @param array<string, mixed> $authUser
     * @return array{status: int, data: array<string, mixed>|array<int, mixed>}
     */
    public function getAllData(array $authUser): array
    {
        return ['status' => 200, 'data' => $this->dataService->getAllData($authUser)];
    }

    /**
     * @return array{status: int, data: array<string, mixed>|array<int, mixed>}
     */
    public function reseedData(): array
    {
        $this->seedService->reseedData();

        return [
            'status' => 200,
            'data' => [
                'success' => true,
                'message' => 'Database reseeded successfully.',
            ],
        ];
    }
}
