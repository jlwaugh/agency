## Multi Agency
#### ANP + MCP + Fireproof Storage

### GUIDE

1. Install
```bash
pnpm install
```

2. Build
```bash
pnpm build
```

3. Launch
```bash
pnpm dev
```

#### How To Use with Claude Desktop

Add the server config...

* MacOS: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
* Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "agency": {
      "command": "/path/to/agency/build/index.js"
    }
  }
}
```

#### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

1. Start MCP Server
```bash
pnpm start
```

2. Run Inspector
```bash
pnpm inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

