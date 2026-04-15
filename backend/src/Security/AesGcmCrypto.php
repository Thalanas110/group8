<?php

declare(strict_types=1);

namespace App\Security;

final class AesGcmCrypto
{
    private string $key;

    public function __construct(string $rawKey)
    {
        $this->key = $this->normalizeKey($rawKey);
    }

    public function encrypt(?string $plainText): ?string
    {
        if ($plainText === null || $plainText === '') {
            return null;
        }

        $iv = random_bytes(12);
        $tag = '';
        $cipherText = openssl_encrypt(
            $plainText,
            'aes-256-gcm',
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
        );

        if ($cipherText === false) {
            return null;
        }

        return base64_encode($iv . $tag . $cipherText);
    }

    public function decrypt(?string $encoded): ?string
    {
        if ($encoded === null || $encoded === '') {
            return null;
        }

        $binary = base64_decode($encoded, true);
        if ($binary === false || strlen($binary) < 28) {
            return null;
        }

        $iv = substr($binary, 0, 12);
        $tag = substr($binary, 12, 16);
        $cipherText = substr($binary, 28);

        $plainText = openssl_decrypt(
            $cipherText,
            'aes-256-gcm',
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
        );

        return $plainText === false ? null : $plainText;
    }

    private function normalizeKey(string $rawKey): string
    {
        $candidate = $rawKey;
        if (str_starts_with($rawKey, 'base64:')) {
            $decoded = base64_decode(substr($rawKey, 7), true);
            if ($decoded !== false) {
                $candidate = $decoded;
            }
        }

        if (strlen($candidate) === 32) {
            return $candidate;
        }

        return hash('sha256', $rawKey, true);
    }
}
