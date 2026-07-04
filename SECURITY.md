# Security Policy: Zero-Trust & Privacy Protections

"Cognitive Companion" is built on zero-trust and defense-in-depth principles to ensure complete psychological safety, multi-tenant data isolation, and robust user-privacy protection.

## 1. Zero-Trust Architecture & Multi-Tenant Isolation

- **Authentication:** All client requests are authenticated using secure JSON Web Tokens (JWT) or local sandbox session keys.
- **Tenant Isolation:** The backend strictly restricts data access based on the authenticated user's ID (`req.user.id`). No user can read, create, or delete history entries belonging to another account.
- **Dynamic Database Layer:** Both the Production Supabase client and the Sandbox local JSON adapter enforce ownership checks before any persistence actions are carried out.

## 2. Real-Time Security Safeguards

To prevent sensitive private data from leaking or being exposed to external LLMs, the platform applies two layered middleware guards before user requests reach the Gemini API:

### A. Automatic PII Redaction
We strip personally identifiable information (PII) using pre-tokenized regular expressions.
- **Masked Data:** Emails, phone numbers, and National-ID-like (SSN) patterns are permanently masked with `[REDACTED_EMAIL]`, `[REDACTED_PHONE]`, or `[REDACTED_NATIONAL_ID]`.
- **Audit Logging:** An anonymous security audit event is logged immediately when redaction occurs, without ever writing the actual PII values to disk.

### B. Intelligent Prompt-Injection Guard
To block adversaries attempting to override psychological safety instructions, a front-line guard processes and neutralizes injection vectors.
- **Monitored Patterns:** Detects phrases like "ignore previous instructions", "system prompt", "forget everything", "reveal your system", or instruction override codes.
- **Sanitization:** Detected malicious strings are safely stripped or replaced with `[GUARD_REDACTED_ATTEMPTED_PROMPT_INJECTION]` to block systemic overrides while maintaining continuous application uptime.

## 3. Threat Model Summary

| Threat Vector | Mitigating Control | Status |
| :--- | :--- | :--- |
| **Bypassing Authentication / Data Leakage** | Strict multi-tenant validation via `requireAuth` checking `req.user.id` | **Active** |
| **Unintentional PII Leakage to LLM Providers** | Pre-API regular-expression masking and sanitization | **Active** |
| **Prompt Injection / System Instructions Hijack** | Malicious text detection and sanitization checks | **Active** |
| **Unauthorized DB Ingress** | Multi-level ownership checks in database fallbacks | **Active** |

---
*Note: This security policy applies across both Sandbox Local Mode and Supabase Production Mode.*
