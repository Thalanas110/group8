<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\AppConfig;
use App\Database\RoutineGateway;
use App\Security\AesGcmCrypto;
use App\Security\PasswordHasher;
use App\Services\Support\ValueNormalizer;
use App\Support\ApiException;

final class SeedService
{
    private const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
    private const TEACHER_ID = '22222222-2222-4222-8222-222222222222';
    private const STUDENT_ID = '33333333-3333-4333-8333-333333333333';

    public function __construct(
        private AppConfig $config,
        private RoutineGateway $gateway,
        private AesGcmCrypto $crypto,
        private PasswordHasher $passwordHasher,
        private ValueNormalizer $normalizer,
    ) {
    }

    public function bootstrap(): void
    {
        $existingUsers = $this->gateway->call('sp_users_get_all');
        if ($existingUsers !== []) {
            return;
        }

        if (!$this->hasSeedCredentialsConfigured()) {
            throw new ApiException(
                500,
                'Seed credentials are missing. Configure SEED_ADMIN_*, SEED_TEACHER_*, and SEED_STUDENT_* in backend/.env.',
            );
        }

        $this->seedCoreAccounts();
        $this->seedDemoData();
    }

    public function reseedData(): void
    {
        if (!$this->hasSeedCredentialsConfigured()) {
            throw new ApiException(
                500,
                'Reseed is blocked because seed credentials are missing in backend/.env.',
            );
        }

        $this->gateway->call('sp_data_reset');
        $this->bootstrap();
    }

    private function seedCoreAccounts(): void
    {
        [$adminDepartmentCiphertext, $adminDepartmentIv, $adminDepartmentTag] = $this->crypto->encryptParams($this->config->seedAdminDepartment);
        [$teacherDepartmentCiphertext, $teacherDepartmentIv, $teacherDepartmentTag] = $this->crypto->encryptParams($this->config->seedTeacherDepartment);
        [$studentDepartmentCiphertext, $studentDepartmentIv, $studentDepartmentTag] = $this->crypto->encryptParams($this->config->seedStudentDepartment);

        $this->gateway->call('sp_seed_core_accounts', [
            self::ADMIN_ID,
            $this->config->seedAdminName,
            strtolower($this->config->seedAdminEmail),
            $this->passwordHasher->hash($this->config->seedAdminPassword),
            $adminDepartmentCiphertext,
            $adminDepartmentIv,
            $adminDepartmentTag,
            null,
            self::TEACHER_ID,
            $this->config->seedTeacherName,
            strtolower($this->config->seedTeacherEmail),
            $this->passwordHasher->hash($this->config->seedTeacherPassword),
            $teacherDepartmentCiphertext,
            $teacherDepartmentIv,
            $teacherDepartmentTag,
            null,
            self::STUDENT_ID,
            $this->config->seedStudentName,
            strtolower($this->config->seedStudentEmail),
            $this->passwordHasher->hash($this->config->seedStudentPassword),
            $studentDepartmentCiphertext,
            $studentDepartmentIv,
            $studentDepartmentTag,
            null,
            date('Y-m-d'),
        ]);
    }

    private function seedDemoData(): void
    {
        $questions = [
            [
                'id' => 'q-demo-1',
                'text' => 'What is 2 + 2?',
                'type' => 'mcq',
                'options' => ['3', '4', '5'],
                'correctAnswer' => '4',
                'marks' => 10,
            ],
            [
                'id' => 'q-demo-2',
                'text' => 'Explain the role of unit testing in software development.',
                'type' => 'essay',
                'marks' => 10,
            ],
        ];

        $this->gateway->call('sp_seed_demo_data', [
            '44444444-4444-4444-8444-444444444444',
            'Seed Class',
            'Software Engineering',
            self::TEACHER_ID,
            'SEED01',
            'Bootstrap class used for initial demo data.',
            date('Y-m-d'),
            self::STUDENT_ID,
            '55555555-5555-4555-8555-555555555555',
            'Seed Midterm Exam',
            'Baseline seeded exam for the frontend.',
            '44444444-4444-4444-8444-444444444444',
            self::TEACHER_ID,
            60,
            20,
            10,
            $this->normalizer->normalizeDate('now', true),
            $this->normalizer->normalizeDate('+1 hour', true),
            'published',
            json_encode($questions, JSON_UNESCAPED_UNICODE),
            date('Y-m-d'),
        ]);
    }

    private function hasSeedCredentialsConfigured(): bool
    {
        return
            trim($this->config->seedAdminEmail) !== '' &&
            trim($this->config->seedAdminPassword) !== '' &&
            trim($this->config->seedTeacherEmail) !== '' &&
            trim($this->config->seedTeacherPassword) !== '' &&
            trim($this->config->seedStudentEmail) !== '' &&
            trim($this->config->seedStudentPassword) !== '';
    }
}
