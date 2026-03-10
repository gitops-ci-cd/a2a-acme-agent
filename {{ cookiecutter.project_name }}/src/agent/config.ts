import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel, ToolSet } from 'ai';
import type { MCPServerConfig } from './types.js';

// ─── Model ─────────────────────────────────────────────────────────────────
// Create the language model for this agent.
// Swap the provider by installing a different @ai-sdk/* package and
// changing the import + call below. The rest of the codebase doesn't care.
//
// Examples:
//   import { anthropic } from '@ai-sdk/anthropic';   → anthropic('claude-haiku-4-5')
//   import { bedrock } from '@ai-sdk/amazon-bedrock'; → bedrock('anthropic.claude-3-5-haiku-20241022-v1:0')
//   import { openai } from '@ai-sdk/openai';          → openai('gpt-4o-mini')

export function createModel(): LanguageModel {
  if (!process.env.MODEL_ID) throw new Error('MODEL_ID environment variable is required');
  return anthropic(process.env.MODEL_ID);
}

// ─── Local Tools ─────────────────────────────────────────────────────────────
// Define tools that run in-process (no MCP server needed).
// Import `tool` from 'ai' and `z` from 'zod' to define input schemas.
//
// Example:
//
//   import { tool } from 'ai';
//   import { z } from 'zod';
//
//   export const localTools: ToolSet = {
//     getCompanyInfo: tool({
//       description: 'Get information about the company',
//       inputSchema: z.object({
//         topic: z.string().describe('Topic to look up'),
//       }),
//       execute: async ({ topic }) => {
//         return { topic, info: 'ACME Corp is ...' };
//       },
//     }),
//   };

export const localTools: ToolSet = {};

// ─── MCP Servers ─────────────────────────────────────────────────────────────
// Declare the MCP servers this agent should connect to.
// Each server's tools are automatically discovered and converted to AI SDK tools.
//
// Supports two transport types:
//   - stdio:  launches a local process (command + args)
//   - http:   connects to a remote server via Streamable HTTP (url)

export const mcpServers: MCPServerConfig[] = [
  // Example: stdio MCP server (local process)
  //
  // {
  //   transport: 'stdio',
  //   name: 'Open-Meteo Weather',
  //   description: 'Real-time weather data and forecasts',
  //   command: 'npx',
  //   args: ['open-meteo-mcp-server'],
  // },
  // Example: Streamable HTTP MCP server (remote)
  //
  // {
  //   transport: 'http',
  //   name: 'My Remote Service',
  //   description: 'Tools provided by a remote MCP server',
  //   url: 'https://mcp.example.com/mcp',
  // },
];
