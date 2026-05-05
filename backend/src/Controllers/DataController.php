<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Services\DataService;
use App\Services\SeedService;
use App\Support\ApiException;

final class DataController
{
    /**
     * @var array<int, string>
     */
    private const RESEED_CONFIRMATION_FACTORS = [
        'RESET FACTOR 01',
        'RESET FACTOR 02',
        'RESET FACTOR 03',
        'RESET FACTOR 04',
        'RESET FACTOR 05',
        'RESET FACTOR 06',
        'RESET FACTOR 07',
        'RESET FACTOR 08',
        'RESET FACTOR 09',
        'RESET FACTOR 10',
        'RESET FACTOR 11',
        'RESET FACTOR 12',
        'RESET FACTOR 13',
        'RESET FACTOR 14',
        'RESET FACTOR 15',
        'RESET FACTOR 16',
        'RESET FACTOR 17',
        'RESET FACTOR 18',
        'RESET FACTOR 19',
        'RESET FACTOR 20',
    ];

    // constructor property promotion.
    // i found this hilarious, but this is also a good refactor for some
    // reason.
    // 2009 codings
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
    public function reseedData(Request $request): array
    {
        $this->assertReseedConfirmationFactors($request->body['confirmationFactors'] ?? null);
        $this->seedService->reseedData();

        return [
            'status' => 200,
            'data' => [
                'success' => true,
                'message' => 'Database reseeded successfully.',
            ],
        ];
    }

    private function assertReseedConfirmationFactors(mixed $factors): void
    {
        if (!is_array($factors) || count($factors) !== count(self::RESEED_CONFIRMATION_FACTORS)) {
            throw new ApiException(422, 'All 20 reseed confirmation factors are required.');
        }

        foreach (self::RESEED_CONFIRMATION_FACTORS as $index => $expected) {
            $actual = $factors[$index] ?? null;
            if (!is_string($actual) || trim($actual) !== $expected) {
                throw new ApiException(422, 'All 20 reseed confirmation factors must be completed exactly.');
            }
        }
    }
}
