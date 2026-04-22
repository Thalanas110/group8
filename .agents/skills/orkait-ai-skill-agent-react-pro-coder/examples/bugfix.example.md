User: This component throws hydration mismatch in Next.js. Fix it.

Expected behavior:
- Classify as Bug Fix
- Identify likely causes (random/date/browser-only APIs in RSC)
- Move browser-only logic behind 'use client' boundary or guard with `useEffect` only for non-fetch side effects
- Add regression test where feasible
