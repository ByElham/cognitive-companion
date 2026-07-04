# Cognitive Companion & Self-Discovery Assistant
### *Enterprise-Grade Multi-Tenant AI Agent & Psychological CBT Analytics Workspace*

---

## 🌌 Executive Overview

**Cognitive Companion** is a high-craft, professional web application designed to help users document their inner states, log daily situations, and decode recurring cognitive distortion patterns using structured **Cognitive Behavioral Therapy (CBT)** frameworks. 

Built around a **Zero-Trust Client Security Model**, this platform guarantees data isolation via **Multi-Tenant Authorization** and leverages **Agentic Session Memory** using Google's `gemini-3.5-flash` model. It showcases a modern, fully responsive user experience styled with a luxurious royal **Tyrian Purple (#66023C)** aesthetic, fluidly localized across global languages on the fly.

---

## 🛠️ High-Level Technical Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │                 CLIENT STAGE                  │
                  │   Vite + React 19 + Tailwind CSS + Motion     │
                  └───────────────────────┬───────────────────────┘
                                          │
                                 Secure Authorization
                               Bearer Session Token (JWT)
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │                 SECURE PROXY                  │
                  │       Node.js Express Full-Stack Server       │
                  └───────────────────────┬───────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
┌──────────────────────────┐┌───────────────────────────┐┌──────────────────────────┐
│    GEMINI FLASH API      ││    SUPABASE DB & AUTH     ││   DISK DATA FALLBACK     │
│   (Stateful Context +    ││  (Production-Grade Multi- ││  (Zero-Config Sandbox    │
│  Structural Schemas)     ││    Tenant PostgreSQL)     ││  history.json/users.json)│
└──────────────────────────┘└───────────────────────────┘└──────────────────────────┘
```

### 1. Zero-Trust Security Protocols
*   **Encapsulated Secrets**: All sensitive cryptographic keys (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are stored and resolved exclusively server-side. No client-side code has access to or exposures in the network log for these assets.
*   **Route Protectors**: Every database action and analytical endpoint is guarded by a bulletproof `requireAuth` server middleware.
*   **Multi-Tenant Isolation**: Database filters strictly scope queries using the verified authenticated context `req.user.id`. Row leaking is mathematically impossible.

### 2. Hybrid Persistence Engine (Dual-Adapter Design)
To allow immediate sandbox testing by recruiters while maintaining production-grade PostgreSQL support, the server features a dynamic multi-adapter layer:
*   **Adapter A (Production)**: Connects to a cloud-hosted Supabase instance using `@supabase/supabase-js`. User tables and logs are automatically synced to relational tables.
*   **Adapter B (Dev Sandbox Fallback)**: If Supabase environment credentials are omitted, the backend gracefully activates a server-side JSON caching adapter (`users.json` and `history.json`), securing entries locally using secure **SHA-256 salted password hashing**.

### 3. Agentic Memory Persistence (Stateful Counseling)
Unlike traditional static chat inputs, the analysis engine implements a stateful RAG-inspired history block:
*   Upon ingestion of a new thought, the backend queries the user's past logs (up to 5 historic sessions).
*   It formats this history into a secure, machine-readable chronological context boundary.
*   This context is injected into the Gemini `systemInstruction` parameters, prompting the AI agent to explicitly identify recurring cognitive distortion trends, recall prior moods, and deliver progressive counseling.

---

## 🚀 Key Features Demonstrated

1.  **Multi-Modal Thought Capture**: Supports text logs, structural CBT situations (Situation, Thoughts, Feelings), and voice diaries.
2.  **State-of-the-Art CBT Deconstruction**: Returns structured JSON containing a warm summary, emotional spectrum scores (Anxiety, Anger, peace, etc.), and multi-category cognitive distortion identification.
3.  **Active Reframing & Psychological Exercises**: Generates a custom-crafted interactive workbook exercise complete with step-by-step guidance.
4.  **Instant Internationalization**: Dynamically translates the entire system, layout grids, headers, and analytics cards on detection of localized user text (e.g. Persian, Spanish, French, English).
5.  **Interactive Visualization**: Renders beautiful emotion scoreboards using dynamic, interactive React canvas charts.

---

## 🗃️ Database Schemas

### Users (Fallback / Database Equivalent)
```json
{
  "id": "uuid-v4-string",
  "email": "user@domain.com",
  "passwordHash": "salted-sha256-string",
  "createdAt": "2026-07-03T12:00:00.000Z"
}
```

### Cognitive History Entry
```json
{
  "id": "entry-unique-id",
  "userId": "associated-uuid",
  "timestamp": "ISO-8601-timestamp",
  "userInput": {
    "inputType": "freeform" | "structured",
    "textContent": "...",
    "situation": "...",
    "thoughts": "...",
    "feelings": "..."
  },
  "analysis": {
    "summary": "AI empathic validation...",
    "moodState": {
      "primaryEmotion": "Anxiety",
      "intensity": 75,
      "emotionalSpectrum": [
        { "emotion": "Anxiety", "score": 75 },
        { "emotion": "Sadness", "score": 25 }
      ]
    },
    "cognitiveDistortions": [
      {
        "name": "Catastrophizing",
        "detected": true,
        "quote": "Everything is ruined...",
        "explanation": "..."
      }
    ],
    "reframing": {
      "rationalAlternative": "...",
      "cbtPrompt": "..."
    },
    "discoveryExercise": {
      "title": "Double-Standard Compassion Check",
      "description": "...",
      "steps": ["Step 1...", "Step 2...", "Step 3..."]
    },
    "detectedLanguage": "English",
    "translatedUi": { "..." }
  }
}
```

---

## ⚙️ Environment Configuration

Define these variable keys inside your `.env` or the **AI Studio Secrets Panel**:

```env
# REQUIRED: Google Gemini API Key
GEMINI_API_KEY="YOUR_GEMINI_KEY"

# OPTIONAL: Supabase Cloud database link (falls back to secure server disk JSON if empty)
SUPABASE_URL="https://your-instance.supabase.co"
SUPABASE_KEY="your-anon-or-service-role-key"
```

---

## 👁️ Instructions for Recruiters

To review this portfolio project in action:

1.  **Launch the Preview**: The app starts instantly on Port `3000`.
2.  **1-Click Access**: On the login screen, click the glowing **"Load Guest Account Sandbox"** button. This configures a demo credential sandbox instantly.
3.  **Create Your Own Account**: Alternatively, switch the card to **"Create Account"** and sign up with any custom email and password to observe complete multi-tenant database isolation.
4.  **Examine Network Logs**: Inspect the browser console or network requests during analysis. You will notice that no sensitive API keys are exposed — all heavy-lifting is proxied through our Node.js server.
5.  **Test Contextual Memory**: Log a thought highlighting catastrophizing, then submit another thought. Watch the AI agent reference your historic states in the feedback panel!

---

## 🎓 Course Concepts Demonstrated

*   **Model Context Protocol (MCP) Server**: Implements a dedicated Model Context Protocol server exposing custom tools for querying user history metrics. See [`mcp-server.ts`](/mcp-server.ts) and the schema declaration inside [`mcp_config.json`](/mcp_config.json).
*   **Security Hardening Features**: Real-time regex-based PII redaction (email, phone, national ID) and prompt-injection detection/sanitization. Documented thoroughly in the Zero-Trust [`SECURITY.md`](/SECURITY.md) guidelines and handled inside `/api/analyze` in [`server.ts`](/server.ts).
*   **Agent Skills**: Portable, reusable psychological domain expertise decoupled from application logic. Expressed inside [`/skills/cbt-analysis/SKILL.md`](/skills/cbt-analysis/SKILL.md) and parsed/injected dynamically on server boot.
*   **Production Deployability**: Fully deployable containerization pipelines. Guided by [`/deploy/DEPLOYMENT.md`](/deploy/DEPLOYMENT.md), with a multi-stage optimized [`/deploy/Dockerfile`](/deploy/Dockerfile) and automated shell deployment scripts in [`/deploy/deploy.sh`](/deploy/deploy.sh).

