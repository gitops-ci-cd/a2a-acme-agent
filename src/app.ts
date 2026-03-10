import { AGENT_CARD_PATH } from '@a2a-js/sdk';
import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
import { jsonRpcHandler, restHandler, UserBuilder } from '@a2a-js/sdk/server/express';
import type { Express } from 'express';
import express from 'express';
import { generateAgentCard } from './agent/card.js';
import { type Agent, createAgent } from './agent/index.js';
import { createExecutor } from './lib/executor.js';

const logLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
console.log(`A2A Agent initialized with log level: ${logLevel}`);

/** Lazy agent initialization — MCP servers connect on first request */
let agentPromise: Promise<Agent> | null = null;
let requestHandler: DefaultRequestHandler | null = null;

async function initializeAgent(): Promise<DefaultRequestHandler> {
  if (requestHandler) return requestHandler;

  if (!agentPromise) {
    console.log('🔧 Initializing agent...');
    agentPromise = createAgent();
  }

  const agent = await agentPromise;
  const executor = createExecutor((text) => agent.processMessage(text));
  requestHandler = new DefaultRequestHandler(generateAgentCard(), new InMemoryTaskStore(), executor);

  console.log('✅ Agent ready');
  return requestHandler;
}

/** Setup Express app */
const app: Express = express();

// Dynamic AgentCard endpoint
app.get(`/${AGENT_CARD_PATH}`, (req, res) => {
  console.log(`📋 AgentCard requested from ${req.get('user-agent') || 'unknown'}`);
  res.json(generateAgentCard(req));
});

// A2A protocol endpoints with lazy initialization
app.use('/a2a/jsonrpc', async (req, res, next) => {
  try {
    const handler = await initializeAgent();
    jsonRpcHandler({ requestHandler: handler, userBuilder: UserBuilder.noAuthentication })(req, res, next);
  } catch (error) {
    console.error('❌ Failed to initialize agent:', error);
    res.status(500).json({ error: 'Agent initialization failed' });
  }
});

app.use('/a2a/rest', async (req, res, next) => {
  try {
    const handler = await initializeAgent();
    restHandler({ requestHandler: handler, userBuilder: UserBuilder.noAuthentication })(req, res, next);
  } catch (error) {
    console.error('❌ Failed to initialize agent:', error);
    res.status(500).json({ error: 'Agent initialization failed' });
  }
});

export default app;
