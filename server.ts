import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

dotenv.config();

// SUPPRESS HARMLESS WEBSOCKET/HMR REJECTIONS
process.on("unhandledRejection", (reason: any) => {
  const message = reason?.message || String(reason);
  if (message.includes("WebSocket") || message.includes("closed without opened") || message.includes("ECONNREFUSED")) {
    return; // Ignore benign dev-server WebSocket noise
  }
  console.error("Unhandled Rejection:", reason);
});

// SECURE PII REDACTION FILTER
function redactPII(text: string): string {
  if (!text) return "";
  let redacted = text;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const nationalIdRegex = /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g;

  let redactedAny = false;

  if (emailRegex.test(redacted)) {
    redacted = redacted.replace(emailRegex, "[REDACTED_EMAIL]");
    redactedAny = true;
  }
  if (phoneRegex.test(redacted)) {
    redacted = redacted.replace(phoneRegex, "[REDACTED_PHONE]");
    redactedAny = true;
  }
  if (nationalIdRegex.test(redacted)) {
    redacted = redacted.replace(nationalIdRegex, "[REDACTED_NATIONAL_ID]");
    redactedAny = true;
  }

  if (redactedAny) {
    console.log(`[SECURITY EVENT] [${new Date().toISOString()}] PII detected and redacted from user text input.`);
  }

  return redacted;
}

// SECURE PROMPT INJECTION GUARD
function detectAndSanitizePromptInjection(text: string): { text: string; isInjected: boolean } {
  if (!text) return { text: "", isInjected: false };
  const maliciousPatterns = [
    /ignore\s+(?:all\s+|any\s+|above\s+|previous\s+|the\s+)*instructions/i,
    /system\s+prompt/i,
    /forget\s+everything/i,
    /you\s+are\s+now\s+a\s+different/i,
    /prompt\s+leak/i,
    /reveal\s+your\s+system/i,
    /override\s+instructions/i,
  ];

  let isInjected = false;
  let sanitizedText = text;

  for (const pattern of maliciousPatterns) {
    if (pattern.test(text)) {
      isInjected = true;
      sanitizedText = sanitizedText.replace(pattern, "[GUARD_REDACTED_ATTEMPTED_PROMPT_INJECTION]");
    }
  }

  if (isInjected) {
    console.warn(`[SECURITY EVENT] [${new Date().toISOString()}] Potential prompt injection attempt intercepted.`);
  }

  return { text: sanitizedText, isInjected };
}

// PORTABLE AGENT SKILLS DYNAMIC LOADER
const SKILL_FILE_PATH = path.join(process.cwd(), "skills", "cbt-analysis", "SKILL.md");
function readCbtSkillFile(): string {
  try {
    if (fs.existsSync(SKILL_FILE_PATH)) {
      return fs.readFileSync(SKILL_FILE_PATH, "utf-8");
    }
  } catch (err) {
    console.error("Failed to read CBT Skill file:", err);
  }
  return "";
}


const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. Gemini features will run in mock/error mode.");
}

// Supabase client initialization and adapter selection logging
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("==================== [DATABASE ADAPTER STATUS] ====================");
    console.log("Using Supabase as the active database adapter.");
    console.log("Reason: SUPABASE_URL and SUPABASE_KEY are both defined in the environment.");
    console.log(`URL: ${supabaseUrl}`);
    console.log("====================================================================");
  } catch (error: any) {
    console.error("==================== [DATABASE ADAPTER STATUS] ====================");
    console.error("Using local JSON fallback database adapter.");
    console.error(`Reason: SUPABASE_URL is defined but client creation failed: ${error.message}`);
    console.error("====================================================================");
  }
} else {
  console.log("==================== [DATABASE ADAPTER STATUS] ====================");
  console.log("Using local JSON fallback database adapter.");
  let reason = "SUPABASE_URL and SUPABASE_KEY are both undefined.";
  if (supabaseUrl && !supabaseKey) {
    reason = "SUPABASE_URL is defined but SUPABASE_KEY is missing.";
  } else if (!supabaseUrl && supabaseKey) {
    reason = "SUPABASE_KEY is defined but SUPABASE_URL is missing.";
  }
  console.log(`Reason: ${reason}`);
  console.log("====================================================================");
}

// Simple JSON file persistent database as fallback
const HISTORY_FILE = path.join(process.cwd(), "history.json");
const USERS_FILE = path.join(process.cwd(), "users.json");

function readHistory(): any[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading history.json:", error);
  }
  return [];
}

function writeHistory(history: any[]): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing history.json:", error);
  }
}

function readUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading users.json:", error);
  }
  return [];
}

function writeUsers(users: any[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing users.json:", error);
  }
}

// Ensure database files exist for local fallback
if (!fs.existsSync(HISTORY_FILE)) {
  writeHistory([]);
}
if (!fs.existsSync(USERS_FILE)) {
  writeUsers([]);
}

// Native crypto password hashing for local fallback
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Local Session Storage mapping token -> user
const LOCAL_SESSIONS = new Map<string, { id: string; email: string }>();

// Authentication middleware supporting Supabase Auth and Local Fallback
async function requireAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: "Access token required" });
    }

    if (token.startsWith("local_token_")) {
      const localUser = LOCAL_SESSIONS.get(token);
      if (!localUser) {
        return res.status(401).json({ success: false, error: "Invalid or expired local session token" });
      }
      req.user = localUser;
      return next();
    }

    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ success: false, error: "Invalid Supabase session" });
      }
      req.user = { id: user.id, email: user.email };
      req.token = token;
      req.supabaseClient = createClient(supabaseUrl!, supabaseKey!, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
      return next();
    }

    return res.status(401).json({ success: false, error: "No active auth strategy configured for this token" });
  } catch (err: any) {
    return res.status(401).json({ success: false, error: "Authentication failed: " + err.message });
  }
}

// Helper to handle history retrieval with Supabase fallback
async function getHistoryFromDb(userId: string, customClient?: any): Promise<any[]> {
  const client = customClient || supabase;
  if (client && !userId.startsWith("usr_")) {
    try {
      const { data, error } = await client
        .from("reflections")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase SELECT error, falling back to history.json:", error.message);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp || row.created_at,
        userInput: row.user_input,
        analysis: row.analysis,
      }));
    } catch (err) {
      console.warn("Using local history.json due to Supabase fetch error.");
    }
  }
  const localData = readHistory();
  const filtered = localData.filter((entry) => entry.user_id === userId);
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Call tools via MCP server with standard database fallback
async function getHistoryFromMcp(userId: string, token?: string): Promise<{ moodHistory: any[], distortionFrequencies: Record<string, number> }> {
  console.log(`[MCP CLIENT ACTIVATE] Initiating MCP connection for user: ${userId}`);
  try {
    const mcpClient = new Client(
      { name: "cbt-mcp-client", version: "1.0.0" },
      { capabilities: {} }
    );

    const isProd = process.env.NODE_ENV === "production";
    const command = isProd ? "node" : "npx";
    const args = isProd
      ? [path.join(process.cwd(), "dist/mcp-server.cjs")]
      : ["tsx", path.join(process.cwd(), "mcp-server.ts")];

    console.log(`[MCP CLIENT SUBPROCESS] Executing command: ${command} ${args.join(" ")}`);

    const transport = new StdioClientTransport({ command, args });
    await mcpClient.connect(transport);

    console.log("[MCP CLIENT CONNECTION] Successfully connected to MCP server stdio transport");

    try {
      console.log(`[MCP CLIENT CALL] Invoking get_user_mood_history for: ${userId}`);
      const moodHistoryResponse = await mcpClient.callTool({
        name: "get_user_mood_history",
        arguments: { userId, token, limit: 5 }
      }) as any;

      console.log(`[MCP CLIENT CALL] Invoking get_distortion_frequency for: ${userId}`);
      const distortionFreqResponse = await mcpClient.callTool({
        name: "get_distortion_frequency",
        arguments: { userId, token }
      }) as any;

      try {
        await transport.close();
      } catch (closeErr) {
        // Safe to ignore
      }

      const moodHistory = JSON.parse(moodHistoryResponse?.content?.[0]?.text || "[]");
      const distortionFrequencies = JSON.parse(distortionFreqResponse?.content?.[0]?.text || "{}");

      console.log(`[MCP CLIENT SUCCESS] Successfully fetched ${moodHistory.length} history items and ${Object.keys(distortionFrequencies).length} distortion records via MCP tools!`);

      return { moodHistory, distortionFrequencies };
    } catch (innerErr) {
      console.error("Failed to run MCP tools, closing transport:", innerErr);
      try { await transport.close(); } catch (e) {}
      throw innerErr;
    }
  } catch (error) {
    console.error("MCP Server connection/execution failed, utilizing fallback inline logic:", error);
    // Graceful fallback to raw database read
    let customClient = null;
    if (supabase && token) {
      try {
        customClient = createClient(supabaseUrl!, supabaseKey!, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        });
      } catch (e) {}
    }
    const rawHistory = await getHistoryFromDb(userId, customClient);
    const moodHistory = rawHistory.slice(0, 5).map((entry: any) => {
      const textContent = entry.userInput?.inputType === "structured"
        ? `Situation: ${entry.userInput.situation}, Thoughts: ${entry.userInput.thoughts}, Feelings: ${entry.userInput.feelings}`
        : `Text: ${entry.userInput?.textContent}`;
      return {
        id: entry.id,
        timestamp: entry.timestamp,
        primaryEmotion: entry.analysis?.moodState?.primaryEmotion || "Unknown",
        intensity: entry.analysis?.moodState?.intensity || 0,
        userInputExcerpt: textContent.substring(0, 150) + (textContent.length > 150 ? "..." : "")
      };
    });

    const distortionFrequencies: Record<string, number> = {};
    rawHistory.forEach((entry: any) => {
      const distortions = entry.analysis?.cognitiveDistortions || [];
      distortions.forEach((d: any) => {
        if (d.detected) {
          distortionFrequencies[d.name] = (distortionFrequencies[d.name] || 0) + 1;
        }
      });
    });

    return { moodHistory, distortionFrequencies };
  }
}

// Helper to save reflection to database with local fallback
async function saveEntryToDb(entry: any, userId: string, customClient?: any): Promise<void> {
  const client = customClient || supabase;
  if (client && !userId.startsWith("usr_")) {
    try {
      const dbRow = {
        id: entry.id,
        user_id: userId,
        timestamp: entry.timestamp,
        user_input: entry.userInput,
        analysis: entry.analysis,
        created_at: entry.timestamp || new Date().toISOString(),
      };

      const { error } = await client
        .from("reflections")
        .upsert(dbRow, { onConflict: "id" });

      if (error) {
        console.error("Supabase UPSERT error, falling back to history.json:", error.message);
        throw error;
      }
      return;
    } catch (err) {
      console.warn("Using local history.json due to Supabase save error.");
    }
  }

  const history = readHistory();
  const existingIndex = history.findIndex((e) => e.id === entry.id);
  const updatedEntry = {
    ...entry,
    user_id: userId,
    timestamp: entry.timestamp || new Date().toISOString()
  };

  if (existingIndex > -1) {
    if (history[existingIndex].user_id === userId) {
      history[existingIndex] = updatedEntry;
    } else {
      throw new Error("Access Denied: Row mismatch.");
    }
  } else {
    history.push(updatedEntry);
  }
  writeHistory(history);
}

// Helper to delete reflection with local fallback
async function deleteEntryFromDb(id: string, userId: string, customClient?: any): Promise<boolean> {
  const client = customClient || supabase;
  if (client && !userId.startsWith("usr_")) {
    try {
      const { error, status } = await client
        .from("reflections")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Supabase DELETE error, falling back to history.json:", error.message);
        throw error;
      }
      return true;
    } catch (err) {
      console.warn("Using local history.json due to Supabase delete error.");
    }
  }

  let history = readHistory();
  const initialLength = history.length;
  history = history.filter((entry) => !(entry.id === id && entry.user_id === userId));
  if (history.length === initialLength) {
    return false;
  }
  writeHistory(history);
  return true;
}

// Health check endpoint for Google Cloud Run liveness/readiness probes
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Authentication Endpoints

// 1. Signup Route
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ success: false, error: "Valid email and password (minimum 6 characters) are required." });
    }

    const emailLower = email.toLowerCase();
    const useLocalFallback = !supabase; // Use local database only if Supabase is not configured

    if (!useLocalFallback) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      const token = data.session?.access_token || null;
      return res.json({
        success: true,
        message: "Registration successful!",
        token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        }
      });
    } else {
      const users = readUsers();
      if (users.find((u) => u.email.toLowerCase() === emailLower)) {
        // If it's guest, allow it to succeed by skipping to login behavior rather than erroring
        if (emailLower === "guest@mindlab.io") {
          return res.json({
            success: true,
            message: "Guest sandbox loading...",
            redirect: "login"
          });
        }
        return res.status(400).json({ success: false, error: "User already exists with this email." });
      }

      const newUser = {
        id: "usr_" + Math.random().toString(36).substring(2, 11),
        email: emailLower,
        passwordHash: hashPassword(password),
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      writeUsers(users);

      const token = "local_token_" + crypto.randomBytes(16).toString("hex");
      LOCAL_SESSIONS.set(token, { id: newUser.id, email: newUser.email });

      return res.json({
        success: true,
        message: "Registration successful (Local Lab Fallback Mode)!",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
        }
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Login Route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const emailLower = email.toLowerCase();
    const useLocalFallback = !supabase; // Use local database only if Supabase is not configured

    if (!useLocalFallback) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.json({
        success: true,
        message: "Login successful!",
        token: data.session?.access_token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        }
      });
    } else {
      const users = readUsers();
      let user = users.find((u) => u.email.toLowerCase() === emailLower);
      
      // Auto-provision guest if it doesn't exist locally
      if (!user && emailLower === "guest@mindlab.io") {
        user = {
          id: "usr_guest",
          email: "guest@mindlab.io",
          passwordHash: hashPassword(password),
          created_at: new Date().toISOString()
        };
        users.push(user);
        writeUsers(users);
      }

      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ success: false, error: "Invalid email or password." });
      }

      const token = "local_token_" + crypto.randomBytes(16).toString("hex");
      LOCAL_SESSIONS.set(token, { id: user.id, email: user.email });

      return res.json({
        success: true,
        message: "Login successful (Local Lab Fallback Mode)!",
        token,
        user: {
          id: user.id,
          email: user.email,
        }
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. User Me Session Validation
app.get("/api/auth/me", requireAuth, async (req: any, res) => {
  res.json({ success: true, user: req.user });
});

// History Resource Routes

// 1. API Endpoint: GET past history
app.get("/api/history", requireAuth, async (req: any, res) => {
  try {
    const history = await getHistoryFromDb(req.user.id, req.supabaseClient);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. API Endpoint: DELETE a history entry
app.delete("/api/history/:id", requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteEntryFromDb(id, req.user.id, req.supabaseClient);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Entry not found or unauthorized" });
    }
    res.json({ success: true, message: "Entry successfully deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. API Endpoint: SAVE analyzed entry
app.post("/api/history", requireAuth, async (req: any, res) => {
  try {
    const entry = req.body;
    if (!entry.id || !entry.userInput) {
      return res.status(400).json({ success: false, error: "Invalid entry payload" });
    }
    await saveEntryToDb(entry, req.user.id, req.supabaseClient);
    res.json({ success: true, data: entry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// 4. API Endpoint: ANALYZE input thought
app.post("/api/analyze", requireAuth, async (req: any, res) => {
  try {
    const { inputType, textContent, situation, thoughts, feelings } = req.body;
    
    // SECURITY HARDENING: PII REDACTION & PROMPT INJECTION GUARDS
    const piiTextContent = redactPII(textContent || "");
    const piiSituation = redactPII(situation || "");
    const piiThoughts = redactPII(thoughts || "");
    const piiFeelings = redactPII(feelings || "");

    const guardTextContent = detectAndSanitizePromptInjection(piiTextContent);
    const guardSituation = detectAndSanitizePromptInjection(piiSituation);
    const guardThoughts = detectAndSanitizePromptInjection(piiThoughts);
    const guardFeelings = detectAndSanitizePromptInjection(piiFeelings);

    if (guardTextContent.isInjected || guardSituation.isInjected || guardThoughts.isInjected || guardFeelings.isInjected) {
      return res.status(400).json({
        success: false,
        error: "Security Check Failed: Potential prompt injection attempt detected. For safety, this request was rejected."
      });
    }

    const cleanTextContent = guardTextContent.text;
    const cleanSituation = guardSituation.text;
    const cleanThoughts = guardThoughts.text;
    const cleanFeelings = guardFeelings.text;

    let constructedPrompt = "";
    if (inputType === "structured") {
      constructedPrompt = `
SITUATION EXPOSED:
- Context/What happened: ${cleanSituation}
- Automatic Thoughts: ${cleanThoughts}
- Emotions/Feelings: ${cleanFeelings}
`;
    } else {
      constructedPrompt = `
DAILY LOG ENTRY TEXT:
"${cleanTextContent}"
`;
    }

    if (!constructedPrompt.trim()) {
      return res.status(400).json({ success: false, error: "Thought text content is required for analysis." });
    }

    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "Gemini API Client is not configured. Please supply GEMINI_API_KEY in your settings / secrets panel.",
      });
    }

    // Securely retrieve user history memory context via Model Context Protocol (MCP) server
    const { moodHistory, distortionFrequencies } = await getHistoryFromMcp(req.user.id, req.token);
    
    const moodHistorySummary = moodHistory.map((h: any) => 
      `- Date: ${h.timestamp}, Primary Emotion: ${h.primaryEmotion} (${h.intensity}%), Excerpt: "${h.userInputExcerpt}"`
    ).join("\n");

    const topDistortions = Object.entries(distortionFrequencies)
      .sort((a: any, b: any) => b[1] - a[1])
      .map(([name, count]) => `- ${name}: ${count} times`)
      .join("\n");

    const memoryContext = moodHistory.length > 0
      ? `AUTHENTICATED USER HISTORICAL JOURNAL CONTEXT (MCP RETRIEVED):
[RECENT MOOD HISTORY]
${moodHistorySummary}

[HISTORICAL COGNITIVE DISTORTION FREQUENCIES]
${topDistortions || "No cognitive distortions recorded yet."}

Please analyze their current entry in the context of this history. Look for recurring cognitive distortion trends or repeating triggers (e.g., if a distortion appeared multiple times historically). In your summary and CBT exercises, reference these recurring patterns or previous insights explicitly to demonstrate progressive, stateful, and highly contextual cognitive behavioral coaching across sessions.`
      : `AUTHENTICATED USER HISTORICAL JOURNAL CONTEXT: None (This is the user's very first reflection in this session).`;

    // Dynamic dynamic CBT domain knowledge skill loader
    const cbtSkillGuidelines = readCbtSkillFile();

    const systemInstruction = `
${cbtSkillGuidelines}

CONSTRUCTIVE CBT ENGAGEMENT SCHEMA:
Your purpose is to receive a user's raw thoughts, daily log, or structured situation report, and analyze it deeply to provide:
1. A compassionate summary of what they are experiencing, written in their input language.
2. An emotional state breakdown (the Primary Emotion, the overall Intensity from 0 to 100, and an Emotional Spectrum showing a complete breakdown of percentages or scores for emotions like Anxiety, Sadness, Anger, Overwhelm, Fear, Guilt, Peace, Joy, etc.) in their input language.
3. Cognitive Distortions: Identify if there are any cognitive distortions present in their automatic thoughts, using ONLY the taxonomy categories exactly as defined in the loaded guidelines above.
   For EACH potential distortion defined in those guidelines, output its name (using the exact category name and spelling defined in the guidelines above), whether it is "detected" (boolean), a precise "quote" from the user's text that demonstrates it (or empty string if not detected), and an "explanation" of why this is a distortion and how to gently challenge it, written in their input language.
4. Reframing: A rational, objective, and self-compassionate alternative perspective of the situation, along with a powerful CBT self-coaching question (prompt) to help them challenge the automatic thought, written in their input language.
5. Discovery Exercise: Create an active, personalized psychological or self-discovery exercise (like a writing prompt, double-standard test, decatastrophizing worksheet, or mindfulness exercise) complete with custom steps tailored perfectly to their problem, written in their input language.
6. Dynamic Internationalization & Localization:
   - Detect the language of the user's input text (e.g. Persian, Spanish, French, English, German, etc.).
   - Set "detectedLanguage" to the name of this language (in English, e.g., "Persian", "Spanish", "French", "English", "German").
   - Translate all the interface elements of the "Cognitive Companion" app into this detected language, and return them inside the "translatedUi" field exactly as specified in the schema.
     DO NOT translate the core project name itself, but translate all other system headings, buttons, and titles!
     For example, if the detected language is Persian:
     - mindAnalyzer: "آنالیزور ذهن"
     - distortionLibrary: "کتابخانه تحریف‌ها"
     - newReflection: "ثبت بازتاب جدید"
     - searchReflections: "جستجوی بازتاب‌ها"
     and so on.

CONTEXT ENFORCEMENT & STATEFUL MEMORY:
${memoryContext}

Be incredibly warm, encouraging, objective, non-judgmental, and validating. Use professional and accessible language.
`;

    console.log(`==================== [FULL SYSTEM INSTRUCTION START] ====================\n${systemInstruction}\n==================== [FULL SYSTEM INSTRUCTION END] ====================`);

    // Generate content using gemini-3.5-flash as the standard model for analysis tasks
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: constructedPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A gentle, warm, and highly compassionate validation and summary of their situation, addressing them with profound empathy, incorporating references to relevant historical patterns if applicable.",
            },
            moodState: {
              type: Type.OBJECT,
              description: "Analysis of the emotional spectrum representing the entry.",
              properties: {
                primaryEmotion: {
                  type: Type.STRING,
                  description: "The single dominant emotion identified (e.g., Anxiety, Sadness, Anger, Loneliness, Guilt, Overwhelm, Restlessness, Joy).",
                },
                intensity: {
                  type: Type.INTEGER,
                  description: "The estimated psychological/emotional intensity of the dominant state, from 0 (completely calm) to 100 (extreme crisis/emotional overwhelm).",
                },
                emotionalSpectrum: {
                  type: Type.ARRAY,
                  description: "A list of emotions and their relative scores (totaling up to 100 or indicating intensity of each, e.g., Anxiety: 70, Sadness: 40, Anger: 20).",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      emotion: { type: Type.STRING },
                      score: { type: Type.INTEGER, description: "Strength/score of this emotion, 0 to 100" },
                    },
                    required: ["emotion", "score"],
                  },
                },
              },
              required: ["primaryEmotion", "intensity", "emotionalSpectrum"],
            },
            cognitiveDistortions: {
              type: Type.ARRAY,
              description: "A deep assessment of potential cognitive distortions found in the user's text.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the cognitive distortion as defined in the loaded guidelines above (you must use the exact category name and spelling specified in the CBT Taxonomy section of the guidelines, such as Catastrophizing, All-or-Nothing Thinking, or any custom placeholder defined there)" },
                  detected: { type: Type.BOOLEAN, description: "True if this distortion is clearly manifested in their thought pattern, false otherwise." },
                  quote: { type: Type.STRING, description: "The exact quote or excerpt from the user's entry that exhibits this distortion. Leave blank if detected is false." },
                  explanation: { type: Type.STRING, description: "A highly gentle, illuminating description of why this thought qualifies as this distortion, and a therapeutic tip to counteract it." },
                },
                required: ["name", "detected", "quote", "explanation"],
              },
            },
            reframing: {
              type: Type.OBJECT,
              description: "Cognitive reconstruction tools.",
              properties: {
                rationalAlternative: {
                  type: Type.STRING,
                  description: "A beautifully reframed, compassionate, objective, and realistic perspective of their automatic thoughts.",
                },
                cbtPrompt: {
                  type: Type.STRING,
                  description: "A powerful, constructive question for the user to contemplate or journal on to build cognitive flexibility.",
                },
              },
              required: ["rationalAlternative", "cbtPrompt"],
            },
            discoveryExercise: {
              type: Type.OBJECT,
              description: "An interactive, custom self-discovery activity based on their situation.",
              properties: {
                title: { type: Type.STRING, description: "Engaging and creative title for the exercise (e.g., 'The Double-Standard Compassion Check', 'Evidence Courtroom', 'Fear Decatastrophizing Matrix')" },
                description: { type: Type.STRING, description: "A brief description of why this exercise is helpful for their exact current state." },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 to 5 clear, actionable steps they can take right now to write out, reflect, or act.",
                },
              },
              required: ["title", "description", "steps"],
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "The name of the detected language in English, e.g., 'English', 'Spanish', 'French', 'Persian', 'German', etc.",
            },
            translatedUi: {
              type: Type.OBJECT,
              description: "The complete set of translated UI labels for the detected language.",
              properties: {
                mindAnalyzer: { type: Type.STRING },
                distortionLibrary: { type: Type.STRING },
                newReflection: { type: Type.STRING },
                searchReflections: { type: Type.STRING },
                allEmotions: { type: Type.STRING },
                allDistortions: { type: Type.STRING },
                pastReflections: { type: Type.STRING },
                statusProtected: { type: Type.STRING },
                howItWorksTitle: { type: Type.STRING },
                howItWorksDesc: { type: Type.STRING },
                freeJournalTab: { type: Type.STRING },
                cbtAnalyzerTab: { type: Type.STRING },
                voiceJournalTab: { type: Type.STRING },
                loadSampleButton: { type: Type.STRING },
                writeFreelyPlaceholder: { type: Type.STRING },
                situationLabel: { type: Type.STRING },
                situationPlaceholder: { type: Type.STRING },
                thoughtsLabel: { type: Type.STRING },
                thoughtsPlaceholder: { type: Type.STRING },
                feelingsLabel: { type: Type.STRING },
                feelingsPlaceholder: { type: Type.STRING },
                deconstructButton: { type: Type.STRING },
                deconstructingMind: { type: Type.STRING },
                loadingSubtitle: { type: Type.STRING },
                detectedLanguageBadge: { type: Type.STRING },
              },
              required: [
                "mindAnalyzer", "distortionLibrary", "newReflection", "searchReflections",
                "allEmotions", "allDistortions", "pastReflections", "statusProtected",
                "howItWorksTitle", "howItWorksDesc", "freeJournalTab", "cbtAnalyzerTab",
                "voiceJournalTab", "loadSampleButton", "writeFreelyPlaceholder",
                "situationLabel", "situationPlaceholder", "thoughtsLabel", "thoughtsPlaceholder",
                "feelingsLabel", "feelingsPlaceholder", "deconstructButton", "deconstructingMind",
                "loadingSubtitle", "detectedLanguageBadge"
              ]
            }
          },
          required: [
            "summary", "moodState", "cognitiveDistortions", "reframing",
            "discoveryExercise", "detectedLanguage", "translatedUi"
          ],
        },
      },
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedResponse });
  } catch (err: any) {
    console.error("Gemini analysis API error:", err);
    res.status(500).json({ success: false, error: err.message || "An error occurred during Gemini analysis" });
  }
});

// Setup Vite Dev Server / Static Assets Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cognitive Companion Server is live on port ${PORT}`);
    
    // Validate Supabase table availability on startup
    if (supabase) {
      console.log("Checking Supabase 'reflections' table accessibility...");
      supabase.from("reflections").select("id").limit(1)
        .then(({ data, error }: any) => {
          if (error) {
            console.error("==================== [SUPABASE TABLE STATUS] ====================");
            console.error(`Error: 'reflections' table query failed: ${error.message}`);
            console.error("Please run the exact SQL CREATE TABLE statement in your Supabase SQL Editor.");
            console.error("==================================================================");
          } else {
            console.log("==================== [SUPABASE TABLE STATUS] ====================");
            console.log("✅ SUCCESS: 'reflections' table is reachable, fully configured, and active!");
            console.log("==================================================================");
          }
        })
        .catch((err: any) => {
          console.error("Unexpected error validating Supabase table:", err);
        });
    }
  });
}

startServer();
