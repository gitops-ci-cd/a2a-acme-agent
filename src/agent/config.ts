import type { AgentSkill } from '@a2a-js/sdk';
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel, ToolSet } from 'ai';

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

// ─── Agent Identity ──────────────────────────────────────────────────────────
// Customize these to describe your agent. The name and description are pulled
// from package.json by default but you can override them here.

export const agentConfig = {
  /** Provider organization shown in the agent card */
  provider: {
    organization: 'ACME Corp',
    url: 'https://acme.example.com',
  },
  /** Link to documentation for this agent */
  documentationUrl: 'https://acme.example.com/docs/a2a-agent',
};

// ─── System Instructions ─────────────────────────────────────────────────────
// Define your agent's persona and behavior. Responsibilities are derived
// automatically from the skills array below — no need to repeat yourself.
// The final prompt is assembled with built-in best practices (chain of thought,
// tool usage, honesty guardrails).

export const agentInstructions = {
  /** Who is this agent? (e.g. "a senior data analyst focusing on SQL optimizations") */
  role: 'a helpful AI assistant',

  /**
   * Optional constraints on tone, format, or length.
   * (e.g. "Respond in markdown", "Keep responses under 100 words", "Use a formal tone")
   */
  constraints: [] as string[],

  /**
   * Optional few-shot examples to illustrate expected behavior.
   * Each entry is a { user, agent } pair.
   */
  examples: [] as { user: string; agent: string }[],
};

/** Assembles the full system prompt from agentInstructions + skills + built-in best practices. */
export function buildInstructions(): string {
  const { role, constraints, examples } = agentInstructions;

  const sections: string[] = [`You are ${role}.`];

  // Skills define the agent's responsibilities — single source of truth
  if (skills.length > 0) {
    sections.push('', '## Responsibilities');
    for (const skill of skills) {
      sections.push(`- **${skill.name}**: ${skill.description}`);
    }
  }

  if (constraints.length > 0) {
    sections.push('', '## Constraints', ...constraints.map((c) => `- ${c}`));
  }

  if (examples.length > 0) {
    sections.push('', '## Examples');
    for (const ex of examples) {
      sections.push(`User: ${ex.user}`, `Agent: ${ex.agent}`, '');
    }
  }

  sections.push(
    '',
    '## Guidelines',
    '- Think through problems step-by-step before responding.',
    '- Use available tools when they can provide better or more accurate answers.',
    '- If you do not have enough information to answer confidently, say so rather than guessing.',
    '- Stay within your defined role and responsibilities.',
  );

  return sections.join('\n');
}

// ─── Agent Behavior ──────────────────────────────────────────────────────────

export const agentBehavior = {
  /** Maximum number of tool-call steps before the agent must respond */
  maxSteps: 5,
  /** Temperature for the model (lower = more deterministic) */
  temperature: 0.5,
};

// ─── Skills ──────────────────────────────────────────────────────────────────
// Skills are advertised in the agent card so orchestrators know what this
// agent can do. Define one or more skills here.

export const skills: AgentSkill[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'General-purpose AI assistant that can answer questions and help with tasks',
    tags: ['general', 'assistant', 'help'],
    examples: ['Hello, how can you help me?', 'What can you do?'],
  },
];

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
  /** Optional headers (e.g. for auth) */
  headers?: Record<string, string>;
}

export type MCPServerConfig = MCPServerStdio | MCPServerHTTP;

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
