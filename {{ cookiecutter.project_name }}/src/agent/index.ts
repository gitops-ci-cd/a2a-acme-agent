import type { LanguageModel } from 'ai';
import { generateText, stepCountIs, ToolLoopAgent } from 'ai';
import { initMCPRegistry, mcpRegistry } from '../mcp/index.js';
import { createModel, localTools } from './config.js';
import { agentBehavior, buildInstructions } from './util.js';

/**
 * A2A Agent
 *
 * Combines local tools and MCP-provided tools into a single ToolLoopAgent.
 * Uses async factory (Agent.create) because MCP initialization is async.
 */
export class Agent {
  private toolLoopAgent;
  private model: LanguageModel;

  private constructor(toolLoopAgent: ToolLoopAgent, model: LanguageModel) {
    this.toolLoopAgent = toolLoopAgent;
    this.model = model;
  }

  static async create(): Promise<Agent> {
    const model = createModel();

    // Initialize MCP registry with static config
    initMCPRegistry();

    // Load tools from all registered MCP clients
    const mcpEntries = Object.values(mcpRegistry);
    let mcpTools = {};

    if (mcpEntries.length > 0) {
      console.log(`🔧 Loading tools from ${mcpEntries.length} MCP server(s)...`);

      const toolsArrays = await Promise.all(
        mcpEntries.map(async (registration) => {
          const mcp = await registration.client.getClient();
          const tools = await mcp.tools();
          console.log(`   📦 ${registration.name}: ${Object.keys(tools).length} tools`);
          return tools;
        }),
      );

      mcpTools = Object.assign({}, ...toolsArrays);
      console.log(`   🛠️  Total: ${Object.keys(mcpTools).length} MCP tools available`);
    }

    // Merge MCP tools with local tools (local tools take precedence on name collision)
    const allTools = { ...mcpTools, ...localTools };
    const toolCount = Object.keys(allTools).length;
    if (toolCount > 0) {
      console.log(`🛠️  Agent armed with ${toolCount} tool(s)`);
    }

    const toolLoopAgent = new ToolLoopAgent({
      model,
      stopWhen: stepCountIs(agentBehavior.maxSteps),
      temperature: agentBehavior.temperature,
      instructions: buildInstructions(),
      tools: allTools,
    });

    return new Agent(toolLoopAgent, model);
  }

  /**
   * Process a user message through the ToolLoopAgent
   */
  async processMessage(text: string): Promise<string> {
    try {
      console.log('   🤖 AI Agent processing request...');
      const result = await this.toolLoopAgent.generate({
        prompt: text,
      });
      console.log(`   🤖 AI Agent completed (${result.usage?.totalTokens || 0} tokens)`);
      return result.text;
    } catch (error) {
      console.error('   ❌ AI Agent error:', error);
      throw error;
    }
  }

  /**
   * Simple text generation (no tools) for greetings or one-shot prompts
   */
  async generateGreeting(name?: string): Promise<string> {
    try {
      const prompt = name ? `Generate a warm greeting for ${name}` : 'Generate a warm greeting for a new user';
      const result = await generateText({ model: this.model, prompt });
      return result.text;
    } catch (error) {
      console.error('   ❌ Error generating greeting:', error);
      throw error;
    }
  }
}

export async function createAgent(): Promise<Agent> {
  return Agent.create();
}
