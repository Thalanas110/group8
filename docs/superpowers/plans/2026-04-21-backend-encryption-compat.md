# Backend Encryption Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store AES-256-GCM data as separate ciphertext, IV, and tag values while preserving legacy combined-string records and providing a repair path.

**Architecture:** Add new three-part encrypted columns and JSON keys, refactor the crypto and mapper layers to read both formats, update write paths and stored procedures to emit only the new format, and add a repair script for old records.

**Tech Stack:** Vanilla PHP 8+, MySQL/MariaDB stored procedures, OpenSSL AES-256-GCM, JSON APIs, standalone PHP smoke/regression tests.

---

### Task 1: Add Regression Tests First

**Files:**
- Create: `backend/tests/EncryptionStorageCompatibilityTest.php`
- Modify: `backend/composer.json`
- Test: `backend/tests/EncryptionStorageCompatibilityTest.php`

- [ ] **Step 1: Write the failing test**

Add a standalone PHP test script that expects:

```php
$crypto = new AesGcmCrypto('0123456789abcdef0123456789abcdef');
$payload = $crypto->encrypt('Sensitive value');

assert(is_array($payload));
assert(isset($payload['ciphertext'], $payload['iv'], $payload['tag']));
assert($crypto->decryptFromParts($payload['ciphertext'], $payload['iv'], $payload['tag']) === 'Sensitive value');

$legacy = 'gcmv1:' . $payload['iv'] . ':' . $payload['tag'] . ':' . $payload['ciphertext'];
assert($crypto->decryptLegacy($legacy) === 'Sensitive value');
```

Also cover a helper that converts legacy answer records into `answerCiphertext`, `answerIv`, and `answerTag`.

- [ ] **Step 2: Run test to verify it fails**

Run: `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`
Expected: FAIL because the new crypto and repair methods do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add the missing crypto and repair helper methods without changing unrelated behavior.

- [ ] **Step 4: Run test to verify it passes**

Run: `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/EncryptionStorageCompatibilityTest.php backend/composer.json backend/src/Security backend/src/Services/Support
git commit -m "test: add encryption storage compatibility coverage"
```

### Task 2: Update the Schema and Stored Procedures

**Files:**
- Modify: `backend/database/schema_routines.sql`
- Create: `backend/database/migrate_split_encrypted_storage.sql`
- Test: `backend/tests/SecuritySmokeTest.php`

- [ ] **Step 1: Write the failing test**

Capture the schema expectations in the regression test by checking the new field names used by the repair helper and mapper.

- [ ] **Step 2: Run test to verify it fails**

Run: `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`
Expected: FAIL until the new field names and mappers line up.

- [ ] **Step 3: Write minimal implementation**

Update table definitions and all affected stored procedures so they accept, persist, and return:

- user encrypted triples for department / phone / bio
- submission feedback triples
- submission answer JSON entries using `answerCiphertext`, `answerIv`, `answerTag`

Keep legacy fields in read results for fallback until repair is complete.

- [ ] **Step 4: Run test to verify it passes**

Run: `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`
Expected: PASS for schema-dependent mapper expectations.

- [ ] **Step 5: Commit**

```bash
git add backend/database/schema_routines.sql backend/database/migrate_split_encrypted_storage.sql
git commit -m "feat: store encrypted fields as ciphertext iv tag"
```

### Task 3: Update Backend Runtime to Read Both Formats and Write the New Format

**Files:**
- Modify: `backend/src/Security/AesGcmCrypto.php`
- Modify: `backend/src/Services/AuthService.php`
- Modify: `backend/src/Services/UserService.php`
- Modify: `backend/src/Services/SeedService.php`
- Modify: `backend/src/Services/ResultService.php`
- Modify: `backend/src/Services/Support/ExamMapper.php`
- Modify: `backend/src/Bootstrap/ServiceContainer.php`
- Test: `backend/tests/EncryptionStorageCompatibilityTest.php`

- [ ] **Step 1: Write the failing test**

Expand the regression script so it asserts:

- new writes produce structured payloads only
- legacy envelopes are still readable
- mapper output remains plaintext for API consumers

- [ ] **Step 2: Run test to verify it fails**

Run: `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`
Expected: FAIL until services and mapper use the new format.

- [ ] **Step 3: Write minimal implementation**

Refactor services to write structured encrypted values, update mapper fallback logic, and keep API responses unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/Security/AesGcmCrypto.php backend/src/Services/AuthService.php backend/src/Services/UserService.php backend/src/Services/SeedService.php backend/src/Services/ResultService.php backend/src/Services/Support/ExamMapper.php backend/src/Bootstrap/ServiceContainer.php
git commit -m "feat: add structured encryption storage compatibility"
```

### Task 4: Add Legacy Repair Flow

**Files:**
- Create: `backend/src/Services/EncryptionRepairService.php`
- Create: `backend/src/Services/Support/LegacyEncryptedDataRepair.php`
- Create: `backend/scripts/repair_encrypted_storage.php`
- Modify: `backend/database/schema_routines.sql`
- Test: `backend/tests/EncryptionStorageCompatibilityTest.php`

- [ ] **Step 1: Write the failing test**

Add test cases that feed legacy user and submission data into the repair helper and expect:

- split `ciphertext`, `iv`, `tag`
- removal of legacy combined payload keys
- unchanged rows when already migrated

- [ ] **Step 2: Run test to verify it fails**

Run: `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`
Expected: FAIL until the repair helper and service exist.

- [ ] **Step 3: Write minimal implementation**

Implement an idempotent repair service and a CLI script that uses app config plus stored procedures to migrate existing records in place.

- [ ] **Step 4: Run test to verify it passes**

Run: `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/Services/EncryptionRepairService.php backend/src/Services/Support/LegacyEncryptedDataRepair.php backend/scripts/repair_encrypted_storage.php backend/database/schema_routines.sql
git commit -m "feat: add legacy encrypted record repair flow"
```

### Task 5: Update Documentation and Final Verification

**Files:**
- Modify: `backend/README.md`
- Create: `docs/api/backend-api-documentation.md`
- Create: `docs/api/backend-api-documentation.pdf`
- Modify: `backend/tests/SecuritySmokeTest.php`
- Test: `backend/tests/SecuritySmokeTest.php`
- Test: `backend/tests/EncryptionStorageCompatibilityTest.php`

- [ ] **Step 1: Write the failing test**

Update the security smoke test to expect structured AES payload parts and successful legacy compatibility parsing.

- [ ] **Step 2: Run test to verify it fails**

Run: `C:\xampp1\php\php.exe backend/tests/SecuritySmokeTest.php`
Expected: FAIL until the smoke test matches the new crypto contract.

- [ ] **Step 3: Write minimal implementation**

Refresh README and generate the PDF API docs with the GitHub link.

- [ ] **Step 4: Run test to verify it passes**

Run:

- `C:\xampp1\php\php.exe backend/tests/SecuritySmokeTest.php`
- `C:\xampp1\php\php.exe backend/tests/EncryptionStorageCompatibilityTest.php`

Expected: PASS for both.

- [ ] **Step 5: Commit**

```bash
git add backend/README.md docs/api/backend-api-documentation.md docs/api/backend-api-documentation.pdf backend/tests/SecuritySmokeTest.php backend/tests/EncryptionStorageCompatibilityTest.php
git commit -m "docs: update backend encryption compliance docs"
```
