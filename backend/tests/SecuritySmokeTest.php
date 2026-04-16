<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap/autoload.php';

use App\Security\AesGcmCrypto;
use App\Security\JwtService;
use App\Support\Helpers;

$failures = [];

$crypto = new AesGcmCrypto('unit-test-key-for-aes-gcm-32-bytes!');
$plain = 'Sensitive text 123';
$cipher = $crypto->encrypt($plain);
$roundTrip = $crypto->decrypt($cipher);
if (!is_string($cipher) || $cipher === '') {
    $failures[] = 'Encryption did not produce ciphertext.';
}
if ($roundTrip !== $plain) {
    $failures[] = 'AES-256-GCM decrypt mismatch.';
}

$jwt = new JwtService('unit-test-jwt-secret');
$token = $jwt->issue(['sub' => 'u1', 'role' => 'admin'], 60);
$payload = $jwt->verify($token);
if (!is_array($payload) || ($payload['sub'] ?? null) !== 'u1') {
    $failures[] = 'JWT verification failed for valid token.';
}

$badToken = $token . 'x';
if ($jwt->verify($badToken) !== null) {
    $failures[] = 'JWT verification accepted tampered token.';
}

if (Helpers::gradeFromPercentage(95) !== 'A+') {
    $failures[] = 'Grade helper returned unexpected value.';
}

if ($failures !== []) {
    foreach ($failures as $failure) {
        fwrite(STDERR, "FAIL: {$failure}\n");
    }
    exit(1);
}

echo "Security smoke tests passed.\n";
