<?php

declare(strict_types=1);

namespace App\Http;

final class Request
{
    /**
     * @param array<string, string> $headers
     * @param array<string, mixed> $body
     */
    public function __construct(
        public string $method,
        public string $path,
        public array $headers,
        public array $body,
    ) {
    }

    public static function fromGlobals(string $basePath = '/api'): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';

        if ($basePath !== '' && str_starts_with($path, $basePath)) {
            $path = substr($path, strlen($basePath));
        }

        if ($path === '') {
            $path = '/';
        }

        $rawBody = file_get_contents('php://input') ?: '';
        $decoded = json_decode($rawBody, true);
        $body = is_array($decoded) ? $decoded : [];

        $headers = [];
        $rawHeaders = function_exists('getallheaders') ? getallheaders() : [];
        if (!is_array($rawHeaders)) {
            $rawHeaders = [];
        }

        if ($rawHeaders === []) {
            foreach ($_SERVER as $key => $value) {
                if (!str_starts_with($key, 'HTTP_')) {
                    continue;
                }

                $headerName = str_replace('_', '-', strtolower(substr($key, 5)));
                $rawHeaders[$headerName] = (string) $value;
            }
        }

        foreach ($rawHeaders as $key => $value) {
            $headers[strtolower((string) $key)] = (string) $value;
        }

        return new self(
            method: $method,
            path: $path,
            headers: $headers,
            body: $body,
        );
    }

    public function header(string $name): ?string
    {
        $value = $this->headers[strtolower($name)] ?? null;
        return is_string($value) ? $value : null;
    }

    public function bearerToken(): ?string
    {
        $auth = $this->header('authorization');
        if ($auth === null || !str_starts_with($auth, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($auth, 7));
        return $token === '' ? null : $token;
    }
}
