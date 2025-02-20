#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fireproof, index } from "use-fireproof";
import { connect } from "@fireproof/cloud";

// Agent Network Protocol
interface SecurityScheme {
  scheme: string;
  in: string;
  name: string;
}

interface AgentDescription {
  "@context": string | string[];
  name: string;
  security: string | string[];
  securityDefinitions: {
    [key: string]: SecurityScheme;
  };
}

const db = fireproof("agent_roster", { public: true });

await db.ready();

const server = new Server(
  {
    name: "agency",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: { enabled: true }
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      { name: "save_agent", description: "Save an agent", inputSchema: { type: "object", properties: { doc: { type: "object", description: "Agent description" } }, required: ["doc"] } },
      { name: "load_agent", description: "Load an agent", inputSchema: { type: "object", properties: { id: { type: "string", description: "Agent ID" } }, required: ["id"] } },
      { name: "delete_agent", description: "Delete an agent", inputSchema: { type: "object", properties: { id: { type: "string", description: "Agent ID" } }, required: ["id"] } },
      { name: "list_agents", description: "List all agents", inputSchema: { type: "object", properties: {}, required: [] } }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "save_agent": {
      const doc = request.params.arguments?.doc as AgentDescription;
      if (!doc || !doc["@context"] || !doc.name) {
        throw new Error("Invalid agent description: missing required fields");
      }

      const response = await db.put({ ...doc, created: Date.now() });

      return { content: [{ type: "text", text: `Saved agent: ${response.id}` }] };
    }

    case "delete_agent": {
      const id = String(request.params.arguments?.id);
      if (!id) throw new Error("ID is required");

      await db.del(id);

      return { content: [{ type: "text", text: `Deleted agent: ${id}` }] };
    }

    case "load_agent": {
      const id = String(request.params.arguments?.id);
      if (!id) throw new Error("ID is required");

      const doc = await db.get(id);
      return { content: [{ type: "text", text: JSON.stringify(doc) }] };
    }
    
    case "list_agents": {    
      const allDocs = await db.allDocs();
    
      const activeAgents = allDocs.rows
        .filter(row => !row.value._deleted)
        .map(row => {
          const doc = row.value as Record<string, any>;
          return {
            _id: row.key,
            name: doc.name || "Unnamed Agent",
            description: doc.description || "No description available",
            created: doc.created || Date.now(),
          };
        });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(activeAgents)
        }]
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
