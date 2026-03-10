import { readFileSync } from 'node:fs';
import type { AgentCard } from '@a2a-js/sdk';
import type { Request } from 'express';
import { agentConfig, skills } from './config.js';

/** Read package.json for agent metadata */
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'));

/**
 * Generate AgentCard dynamically or statically
 * When an Express request is provided, URLs are derived from the incoming host.
 * Otherwise falls back to localhost for initial setup / task store registration.
 */
export function generateAgentCard(req?: Request): AgentCard {
  const baseUrl = req ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 4000}`;

  return {
    name: pkg.name,
    description: pkg.description,
    url: `${baseUrl}/a2a/jsonrpc`,
    protocolVersion: '0.3.0',
    version: pkg.version,
    provider: agentConfig.provider,
    documentationUrl: agentConfig.documentationUrl,
    skills,
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
    additionalInterfaces: [
      { url: `${baseUrl}/a2a/jsonrpc`, transport: 'JSONRPC' },
      { url: `${baseUrl}/a2a/rest`, transport: 'HTTP+JSON' },
    ],
  };
}
