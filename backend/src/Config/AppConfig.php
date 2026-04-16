<?php

declare(strict_types=1);

namespace App\Config;

final class AppConfig
{
    public function __construct(
        public string $dbHost,
        public int $dbPort,
        public string $dbName,
        public string $dbUser,
        public string $dbPass,
        public string $logDbHost,
        public int $logDbPort,
        public string $logDbName,
        public string $logDbUser,
        public string $logDbPass,
        public int $logRetentionDays,
        public string $jwtSecret,
        public string $encryptionKey,
        public int $tokenTtlSeconds,
        public bool $allowCorsAll,
        public string $seedAdminName,
        public string $seedAdminEmail,
        public string $seedAdminPassword,
        public ?string $seedAdminDepartment,
        public string $seedTeacherName,
        public string $seedTeacherEmail,
        public string $seedTeacherPassword,
        public ?string $seedTeacherDepartment,
        public string $seedStudentName,
        public string $seedStudentEmail,
        public string $seedStudentPassword,
        public ?string $seedStudentDepartment,
    ) {
    }

    public static function fromEnv(Env $env): self
    {
        return new self(
            dbHost: $env->get('DB_HOST', '127.0.0.1'),
            dbPort: $env->getInt('DB_PORT', 3306),
            dbName: $env->get('DB_NAME', 'examhub'),
            dbUser: $env->get('DB_USER', 'root'),
            dbPass: $env->get('DB_PASS', ''),
            logDbHost: $env->get('LOG_DB_HOST', $env->get('DB_HOST', '127.0.0.1')),
            logDbPort: $env->getInt('LOG_DB_PORT', $env->getInt('DB_PORT', 3306)),
            logDbName: $env->get('LOG_DB_NAME', 'examhub_logs'),
            logDbUser: $env->get('LOG_DB_USER', $env->get('DB_USER', 'root')),
            logDbPass: $env->get('LOG_DB_PASS', $env->get('DB_PASS', '')),
            logRetentionDays: $env->getInt('LOG_RETENTION_DAYS', 90),
            jwtSecret: $env->get('APP_JWT_SECRET', 'replace-with-strong-secret'),
            encryptionKey: $env->get('APP_ENCRYPTION_KEY', ''),
            tokenTtlSeconds: $env->getInt('AUTH_TOKEN_TTL_SECONDS', 28800),
            allowCorsAll: $env->getBool('CORS_ALLOW_ALL', true),
            seedAdminName: $env->get('SEED_ADMIN_NAME', 'System Administrator'),
            seedAdminEmail: $env->get('SEED_ADMIN_EMAIL', ''),
            seedAdminPassword: $env->get('SEED_ADMIN_PASSWORD', ''),
            seedAdminDepartment: self::nullableEnv($env->get('SEED_ADMIN_DEPARTMENT', '')),
            seedTeacherName: $env->get('SEED_TEACHER_NAME', 'Seed Teacher'),
            seedTeacherEmail: $env->get('SEED_TEACHER_EMAIL', ''),
            seedTeacherPassword: $env->get('SEED_TEACHER_PASSWORD', ''),
            seedTeacherDepartment: self::nullableEnv($env->get('SEED_TEACHER_DEPARTMENT', '')),
            seedStudentName: $env->get('SEED_STUDENT_NAME', 'Seed Student'),
            seedStudentEmail: $env->get('SEED_STUDENT_EMAIL', ''),
            seedStudentPassword: $env->get('SEED_STUDENT_PASSWORD', ''),
            seedStudentDepartment: self::nullableEnv($env->get('SEED_STUDENT_DEPARTMENT', '')),
        );
    }

    private static function nullableEnv(string $value): ?string
    {
        $trimmed = trim($value);
        return $trimmed === '' ? null : $trimmed;
    }
}
