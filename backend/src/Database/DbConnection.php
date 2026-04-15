<?php

declare(strict_types=1);

namespace App\Database;

use App\Config\AppConfig;
use PDO;

final class DbConnection
{
    private ?PDO $pdo = null;

    public function __construct(private AppConfig $config)
    {
    }

    public function pdo(): PDO
    {
        if ($this->pdo instanceof PDO) {
            return $this->pdo;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $this->config->dbHost,
            $this->config->dbPort,
            $this->config->dbName,
        );

        $this->pdo = new PDO(
            $dsn,
            $this->config->dbUser,
            $this->config->dbPass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ],
        );

        return $this->pdo;
    }
}
