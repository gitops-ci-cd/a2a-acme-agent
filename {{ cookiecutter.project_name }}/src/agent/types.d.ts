export interface MCPServerStdio {
  transport: 'stdio';
  /** Human-readable name */
  name: string;
  /** What this MCP server provides */
  description: string;
  /** Command to launch (e.g. 'npx', 'node', 'python') */
  command: string;
  /** Arguments for the command */
  args: string[];
  /** Extra environment variables for the subprocess */
  env?: Record<string, string>;
}

export interface MCPServerHTTP {
  transport: 'http';
  /** Human-readable name */
  name: string;
  /** What this MCP server provides */
  description: string;
  /** URL of the Streamable HTTP endpoint */
  url: string;
  /** Optional headers (e.g. for static auth tokens) */
  headers?: Record<string, string>;
  /** Optional OAuth client credentials config for automatic token management */
  oauth?: {
    clientId: string;
    clientSecret: string;
  };
}

export type MCPServerConfig = MCPServerStdio | MCPServerHTTP;
