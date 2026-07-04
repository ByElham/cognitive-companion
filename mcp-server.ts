import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Standard history paths mirroring server.ts
const HISTORY_FILE = path.join(process.cwd(), "history.json");

// Optional Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    // Silently proceed, fallback to history.json
  }
}

// Read helper mirroring server.ts
function readHistoryLocal(): any[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    // Silent fail
  }
  return [];
}

// Fetch user history helper
async function getUserHistory(userId: string, token?: string): Promise<any[]> {
  let client = supabase;
  if (supabaseUrl && supabaseKey && token) {
    try {
      client = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
    } catch (err) {
      // Ignore client creation error, fall back to default
    }
  }

  if (client && !userId.startsWith("usr_")) {
    try {
      const { data, error } = await client
        .from("reflections")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          timestamp: row.timestamp || row.created_at,
          userInput: row.user_input,
          analysis: row.analysis,
        }));
      }
    } catch (err) {
      // Fallback
    }
  }
  const localData = readHistoryLocal();
  return localData
    .filter((entry) => entry.user_id === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Initialize the MCP Server
const server = new Server(
  {
    name: "cbt-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register MCP Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_user_mood_history",
        description: "Returns the user's latest mood/emotion history scores from the existing history store.",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The authenticated user ID" },
            token: { type: "string", description: "Optional user Supabase JWT token for authenticated RLS database access" },
            limit: { type: "number", description: "Max number of history entries to return", default: 5 }
          },
          required: ["userId"]
        }
      },
      {
        name: "get_distortion_frequency",
        description: "Returns counts of which cognitive distortions have appeared most often in the user's past reflections.",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The authenticated user ID" },
            token: { type: "string", description: "Optional user Supabase JWT token for authenticated RLS database access" }
          },
          required: ["userId"]
        }
      }
    ]
  };
});

// Implement Tool Logic
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const userId = args?.userId as string;
  const token = args?.token as string;

  if (!userId) {
    throw new Error("Missing required argument: userId");
  }

  try {
    const history = await getUserHistory(userId, token);

    if (name === "get_user_mood_history") {
      const limit = (args?.limit as number) || 5;
      const recentHistory = history.slice(0, limit).map((entry) => {
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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(recentHistory, null, 2),
          },
        ],
      };
    }

    if (name === "get_distortion_frequency") {
      const frequencies: Record<string, number> = {};

      history.forEach((entry) => {
        const distortions = entry.analysis?.cognitiveDistortions || [];
        distortions.forEach((d: any) => {
          if (d.detected) {
            frequencies[d.name] = (frequencies[d.name] || 0) + 1;
          }
        });
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(frequencies, null, 2),
          },
        ],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing MCP tool: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Run server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CBT MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Error in CBT MCP Server:", err);
  process.exit(1);
});
