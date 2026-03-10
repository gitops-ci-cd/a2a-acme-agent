import type { MCPClient } from '@ai-sdk/mcp';

/**
 * MCP Client Registration Entry
 */
export interface MCPRegistration {
  /** Human-readable name */
  name: string;
  /** Brief description of what this MCP provides */
  description: string;
  /** Client object with getClient() and close() methods */
  client: {
    getClient(): Promise<MCPClient>;
    close(): Promise<void>;
  };
}

/**
 * Internal registry storage
 */
const registrations: Record<string, MCPRegistration> = {};

/**
 * Register an MCP client with the registry
 */
export function register(id: string, registration: MCPRegistration): void {
  if (registrations[id]) {
    throw new Error(`MCP client '${id}' is already registered`);
  }
  registrations[id] = registration;
  console.log(`📝 Registered MCP client: ${id} (${registration.name})`);
}

/**
 * Get the full MCP client registry
 */
export function getRegistry(): Record<string, MCPRegistration> {
  return registrations;
}

/**
 * Get all registered MCP client IDs
 */
export function getRegisteredClientIds(): string[] {
  return Object.keys(registrations);
}

/**
 * Close all MCP client connections
 */
export async function closeAllMCPClients(): Promise<void> {
  const cleanupPromises = Object.entries(registrations).map(async ([id, reg]) => {
    try {
      await reg.client.close();
    } catch (error) {
      console.error(`Failed to cleanup ${id}:`, error);
    }
  });

  await Promise.all(cleanupPromises);
}

/**
 * Cleanup all MCP clients on process exit
 */
async function cleanup(): Promise<void> {
  console.log('🧹 Cleaning up all MCP clients...');
  await closeAllMCPClients();
}

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});
