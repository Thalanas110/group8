<?php

declare(strict_types=1);

namespace App\Security;

use RuntimeException;

final class AesGcmCrypto
{
    private const CIPHER = 'aes-256-gcm';
    private const IV_LENGTH = 12;
    private const TAG_LENGTH = 16;
    private const ENVELOPE_PREFIX = 'gcmv1';

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

        $iv = random_bytes(self::IV_LENGTH);
        $tag = '';
        $cipherText = openssl_encrypt(
            $plainText,
            self::CIPHER,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
        );

        if ($cipherText === false || strlen($tag) !== self::TAG_LENGTH) {
            return null;
        }

        return implode(':', [
            self::ENVELOPE_PREFIX,
            base64_encode($iv),
            base64_encode($tag),
            base64_encode($cipherText),
        ]);
    }

    public function decrypt(?string $encoded): ?string
    {
        if ($encoded === null || $encoded === '') {
            return null;
        }

        if (str_starts_with($encoded, self::ENVELOPE_PREFIX . ':')) {
            return $this->decryptEnvelope($encoded);
        }

        return $this->decryptLegacyBinaryEnvelope($encoded);
    }

    private function decryptEnvelope(string $encoded): ?string
    {
        $parts = explode(':', $encoded, 4);
        if (count($parts) !== 4 || $parts[0] !== self::ENVELOPE_PREFIX) {
            return null;
        }

        $iv = base64_decode($parts[1], true);
        $tag = base64_decode($parts[2], true);
        $cipherText = base64_decode($parts[3], true);
        if ($iv === false || $tag === false || $cipherText === false) {
            return null;
        }

        if (strlen($iv) !== self::IV_LENGTH || strlen($tag) !== self::TAG_LENGTH) {
            return null;
        }

        $plainText = openssl_decrypt(
            $cipherText,
            self::CIPHER,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
        );

        return $plainText === false ? null : $plainText;
    }

    private function decryptLegacyBinaryEnvelope(string $encoded): ?string
    {
        $binary = base64_decode($encoded, true);
        if ($binary === false || strlen($binary) < (self::IV_LENGTH + self::TAG_LENGTH)) {
            return null;
        }

        $iv = substr($binary, 0, self::IV_LENGTH);
        $tag = substr($binary, self::IV_LENGTH, self::TAG_LENGTH);
        $cipherText = substr($binary, self::IV_LENGTH + self::TAG_LENGTH);

        $plainText = openssl_decrypt(
            $cipherText,
            self::CIPHER,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
        );

        return $plainText === false ? null : $plainText;
    }

    private function normalizeKey(string $rawKey): string
    {
        $candidate = trim($rawKey);
        if (str_starts_with($candidate, 'base64:')) {
            $decoded = base64_decode(substr($candidate, 7), true);
            if ($decoded === false) {
                throw new RuntimeException('APP_ENCRYPTION_KEY base64 value is invalid.');
            }

            $candidate = $decoded;
        } elseif (preg_match('/^[0-9a-fA-F]{64}$/', $candidate) === 1) {
            $decoded = hex2bin($candidate);
            if ($decoded === false) {
                throw new RuntimeException('APP_ENCRYPTION_KEY hex value is invalid.');
            }

            $candidate = $decoded;
        }

        if (strlen($candidate) === 32) {
            return $candidate;
        }

        throw new RuntimeException(
            'APP_ENCRYPTION_KEY must resolve to exactly 32 bytes (raw, base64:, or 64-char hex).'
        );
    }
}
