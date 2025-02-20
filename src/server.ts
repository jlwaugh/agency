import http from "http";
import { URL } from "url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fireproof } from "use-fireproof";

const PORT = process.env.PORT || 3001;
const db = fireproof("agent_roster", { public: true });

interface ResponseType {
  content: Array<{ text: string }>;
}

const DEFAULT_CONTEXT = {
  "@context": {
    "@vocab": "https://schema.org/",
    "did": "https://w3id.org/did#",
    "ad": "https://service.multiversity.ai/ad#"
  },
  "securityDefinitions": {
    "didwba_sc": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "security": "didwba_sc"
};

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);

  // Centralized error handling function
  const sendError = (statusCode: number, message: string) => {
    if (!res.headersSent) {
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
    }
  };
  
  try {
    // List Agents Route
    if (req.method === "GET" && parsedUrl.pathname === "/api/list-agents") {
      const transport = new StdioClientTransport({
        command: "tsx",
        args: ["src/index.ts"],
      });
    
      const client = new Client(
        {
          name: "agency-frontend",
          version: "0.1.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
    
      await client.connect(transport);
      const response = await client.callTool({
        name: "list_agents",
        arguments: {}
      }) as ResponseType;
    
      if (!res.headersSent) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ agents: JSON.parse(response.content[0].text) }));
      }
      return;
    }

    // Save Agent Route
    if (req.method === "POST" && parsedUrl.pathname === "/api/save-agent") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { name, context = {} } = JSON.parse(body);

          if (!name) {
            throw new Error("Missing required field: 'name'");
          }

          // Merge received context with defaults
          const agentDescription = {
            name,
            "@context": context["@context"] || DEFAULT_CONTEXT["@context"],
            "securityDefinitions": context.securityDefinitions || DEFAULT_CONTEXT.securityDefinitions,
            "security": context.security || DEFAULT_CONTEXT.security
          };

          const transport = new StdioClientTransport({
            command: "tsx",
            args: ["src/index.ts"],
          });

          const client = new Client(
            {
              name: "agency-frontend",
              version: "0.1.0",
            },
            {
              capabilities: {
                tools: {},
              },
            }
          );

          await client.connect(transport);

          const response = (await client.callTool({
            name: "save_agent",
            arguments: { doc: agentDescription },
          })) as ResponseType;

          if (!res.headersSent) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: response.content[0]?.text || "Agent saved: " + name,
              })
            );
          }
        } catch (error) {
          sendError(500, error instanceof Error ? error.message : "Unknown error");
        }
      });
      return;
    }

    // Delete Agent Route
    if (req.method === "DELETE" && parsedUrl.pathname.startsWith('/api/delete-agent/')) {
      try {
        const id = parsedUrl.pathname.split('/').pop();
        if (!id) {
          throw new Error("ID is required");
        }
    
        const transport = new StdioClientTransport({
          command: "tsx",
          args: ["src/index.ts"],
        });
    
        const client = new Client(
          {
            name: "agency-frontend",
            version: "0.1.0",
          },
          {
            capabilities: {
              tools: {},
            },
          }
        );
    
        await client.connect(transport);
    
        const response = await client.callTool({
          name: "delete_agent",
          arguments: { id },
        });
        
        if (!res.headersSent) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Agent deleted: " + id }));
        }
      } catch (error) {
        sendError(500, error instanceof Error ? error.message : "Unknown error");
      }
      return;
    }

    // 404 Route
    sendError(404, "Not Found");
  } catch (error) {
    sendError(500, error instanceof Error ? error.message : "Unknown error");
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});