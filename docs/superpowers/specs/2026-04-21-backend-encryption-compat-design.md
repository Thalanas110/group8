# Backend Encryption Compatibility Design

**Date:** 2026-04-21

## Goal

Bring the PHP backend into strict compliance with the instructor's AES-256-GCM storage rule by storing ciphertext, IV, and authentication tag as three separate database values, while keeping existing combined-string records readable and repairable.

## Scope

- Keep the existing full-stack repo intact.
- Change backend encrypted storage only.
- Preserve compatibility for existing records.
- Add an explicit repair path that converts legacy records to the new three-part format.
- Update backend documentation, including API/security documentation delivered as PDF with the GitHub repository link.

## Approved Approach

Use a dual-read / new-write / backfill design:

- New writes store AES output as three separate values.
- Reads prefer the new format.
- Reads fall back to the legacy combined envelope when needed.
- A repair script converts legacy rows and JSON payloads into the new format without breaking live data.

## Data Model Changes

### `users`

Keep the legacy encrypted columns temporarily for compatibility:

- `department_enc`
- `phone_enc`
- `bio_enc`

Add new three-part columns:

- `department_ciphertext`, `department_iv`, `department_tag`
- `phone_ciphertext`, `phone_iv`, `phone_tag`
- `bio_ciphertext`, `bio_iv`, `bio_tag`

### `submissions`

Keep the legacy feedback column temporarily:

- `feedback_enc`

Add new three-part feedback columns:

- `feedback_ciphertext`, `feedback_iv`, `feedback_tag`

Change `answers_json` storage shape for new writes from:

```json
{
  "questionId": "q1",
  "answer": "gcmv1:..."
}
```

to:

```json
{
  "questionId": "q1",
  "answerCiphertext": "...",
  "answerIv": "...",
  "answerTag": "..."
}
```

Legacy answer objects that still contain `answer` must remain readable until repaired.

## Runtime Design

### Crypto Layer

`AesGcmCrypto` will:

- encrypt plaintext into a structured payload containing `ciphertext`, `iv`, and `tag`
- decrypt from structured parts
- parse legacy combined envelopes into the same structured payload
- support fallback decryption from either structured storage or the legacy envelope

### Service Layer

- Auth, user, seed, and result services will write only the new three-part format.
- Legacy single-field columns will be written as `NULL` for new and updated records.
- Existing stored procedures will be expanded to accept and return the new columns.

### Mapper Layer

`ExamMapper` will:

- decrypt from the new columns when present
- fall back to the legacy envelope when the new columns are absent
- keep decryption failures graceful instead of crashing API responses

## Repair Strategy

Add a backend repair flow that:

- scans legacy rows in `users`
- scans legacy feedback and legacy answer payloads in `submissions`
- splits old envelope strings into separate ciphertext / IV / tag values
- writes the new values back into the new columns / JSON keys
- clears the legacy combined fields after successful conversion

The repair flow must be idempotent so it can be run safely more than once.

## Testing Strategy

- Add a regression test that proves new structured AES encryption/decryption works.
- Add a regression test that proves legacy envelopes still decrypt correctly.
- Add a regression test that proves legacy rows and legacy `answers_json` values are transformed into the new structure correctly.
- Keep existing smoke tests passing after the refactor.

## Documentation Deliverables

- Update backend README security documentation to describe the new three-part storage.
- Add PDF API documentation with:
  - encrypted fields
  - encryption points on create/update endpoints
  - decryption points on read endpoints
  - conceptual key management
  - GitHub repository link
