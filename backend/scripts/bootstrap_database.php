<?php

declare(strict_types=1);

use App\Config\AppConfig;
use App\Config\Env;
use App\Database\DbConnection;
use App\Database\RoutineGateway;
use App\Database\SqlScriptRunner;
use App\Security\AesGcmCrypto;
use App\Services\EncryptionRepairService;
use App\Services\Support\LegacyEncryptedDataRepair;

require_once __DIR__ . '/../bootstrap/autoload.php';

/**
 * Connect to an already-provisioned database and apply the repo SQL files
 * without assuming hardcoded local database names.
 */
function bootstrapPdo(string $host, int $port, string $database, string $user, string $password): PDO
{
    return new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $database),
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
        ],
    );
}

/**
 * @return array<int, string>
 */
function discoverMigrationPaths(string $databaseDir): array
{
    $paths = glob($databaseDir . '/migrate_*.sql');
    if (!is_array($paths)) {
        return [];
    }

    sort($paths, SORT_STRING);
    return $paths;
}

try {
    $env = new Env(__DIR__ . '/../.env');
    $config = AppConfig::fromEnv($env);

    $primaryRunner = new SqlScriptRunner(
        bootstrapPdo(
            $config->dbHost,
            $config->dbPort,
            $config->dbName,
            $config->dbUser,
            $config->dbPass,
        ),
    );

    $schemaSql = file_get_contents(__DIR__ . '/../database/schema_routines.sql');
    $splitStorageSql = file_get_contents(__DIR__ . '/../database/schema_split_encrypted_storage.sql');
    $loggingSql = file_get_contents(__DIR__ . '/../database/logging_routines.sql');
    $migrationPaths = discoverMigrationPaths(__DIR__ . '/../database');

    if ($schemaSql === false || $splitStorageSql === false || $loggingSql === false) {
        throw new RuntimeException('One or more SQL bootstrap files could not be read.');
    }

    $primaryStatements = $primaryRunner->runScript(
        SqlScriptRunner::retargetDatabase($schemaSql, 'examhub', $config->dbName),
    );
    $splitStatements = $primaryRunner->runScript(
        SqlScriptRunner::retargetDatabase($splitStorageSql, 'examhub', $config->dbName),
    );
    $primaryMigrationStatements = 0;
    $logMigrationStatements = 0;

    foreach ($migrationPaths as $migrationPath) {
        $migrationSql = file_get_contents($migrationPath);
        if ($migrationSql === false) {
            throw new RuntimeException(sprintf('Migration file could not be read: %s', basename($migrationPath)));
        }

        if (str_contains($migrationSql, 'USE examhub_logs')) {
            continue;
        }

        $primaryMigrationStatements += $primaryRunner->runScript(
            SqlScriptRunner::retargetDatabase($migrationSql, 'examhub', $config->dbName),
        );
    }

    $logRunner = new SqlScriptRunner(
        bootstrapPdo(
            $config->logDbHost,
            $config->logDbPort,
            $config->logDbName,
            $config->logDbUser,
            $config->logDbPass,
        ),
    );
    $logStatements = $logRunner->runScript(
        SqlScriptRunner::retargetDatabase($loggingSql, 'examhub_logs', $config->logDbName),
    );

    foreach ($migrationPaths as $migrationPath) {
        $migrationSql = file_get_contents($migrationPath);
        if ($migrationSql === false) {
            throw new RuntimeException(sprintf('Migration file could not be read: %s', basename($migrationPath)));
        }

        if (!str_contains($migrationSql, 'USE examhub_logs')) {
            continue;
        }

        $logMigrationStatements += $logRunner->runScript(
            SqlScriptRunner::retargetDatabase($migrationSql, 'examhub_logs', $config->logDbName),
        );
    }

    $gateway = new RoutineGateway((new DbConnection($config))->pdo());
    $crypto = new AesGcmCrypto($config->encryptionKey);
    $repairService = new EncryptionRepairService(
        $gateway,
        new LegacyEncryptedDataRepair($crypto),
    );
    $repairSummary = $repairService->repairLegacyRecords();

    fwrite(STDOUT, "Database bootstrap completed.\n");
    fwrite(STDOUT, sprintf("Primary statements applied: %d\n", $primaryStatements));
    fwrite(STDOUT, sprintf("Split-storage statements applied: %d\n", $splitStatements));
    fwrite(STDOUT, sprintf("Primary migration statements applied: %d\n", $primaryMigrationStatements));
    fwrite(STDOUT, sprintf("Logging statements applied: %d\n", $logStatements));
    fwrite(STDOUT, sprintf("Logging migration statements applied: %d\n", $logMigrationStatements));
    fwrite(STDOUT, sprintf("Users repaired: %d\n", $repairSummary['usersRepaired'] ?? 0));
    fwrite(STDOUT, sprintf("Submissions repaired: %d\n", $repairSummary['submissionsRepaired'] ?? 0));
    exit(0);
} catch (Throwable $throwable) {
    fwrite(STDERR, "FAIL: " . $throwable->getMessage() . "\n");
    exit(1);
}
