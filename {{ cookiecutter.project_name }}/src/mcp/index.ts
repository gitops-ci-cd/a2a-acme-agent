import { createMCPClient, type MCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import { mcpServers } from '../agent/config.js';
import type { MCPServerConfig } from '../agent/types.js';
import { getRegistry, register } from './registry.js';

/**
 * Create a lazy MCP client wrapper from a server config.
 * The actual connection is deferred until getClient() is called.
 */
function createClientWrapper(config: MCPServerConfig) {
  let client: MCPClient | null = null;

  return {
    async getClient(): Promise<MCPClient> {
      if (client) return client;

      console.log(`🔌 Connecting to ${config.name} MCP server...`);

      if (config.transport === 'stdio') {
        client = await createMCPClient({
          transport: new StdioMCPTransport({
            command: config.command,
            args: config.args,
            env: { ...process.env, ...config.env } as Record<string, string>,
          }),
          name: config.name,
        });
      } else {
        // Streamable HTTP transport for remote MCP servers
        client = await createMCPClient({
          transport: {
            type: 'http' as const,
            url: config.url,
            headers: config.headers,
          },
          name: config.name,
        });
      }

      console.log(`✅ Connected to ${config.name} MCP server`);

      const toolsResult = await client.listTools();
      console.log(`📋 ${config.name} tools: ${toolsResult.tools.map((t) => t.name).join(', ')}`);

      return client;
    },

    async close(): Promise<void> {
      if (client) {
        await client.close();
        client = null;
        console.log(`🔌 Disconnected from ${config.name} MCP server`);
      }
    },
  };
}

/**
 * Register an MCP server config into the registry.
 */
function registerServer(config: MCPServerConfig) {
  const id = config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (getRegistry()[id]) return; // skip duplicates
  register(id, {
    name: config.name,
    description: config.description,
    client: createClientWrapper(config),
  });
}

/**
 * Initialize MCP registry with statically configured servers.
 * Must be called before using mcpRegistry.
 */
export function initMCPRegistry(): void {
  for (const config of mcpServers) {
    registerServer(config);
  }
}

/**
 * Export the populated registry
 */
export const mcpRegistry = getRegistry();

export { closeAllMCPClients, getRegisteredClientIds } from './registry.js';
