import { readFileSync } from 'node:fs';
import type { AgentSkill } from '@a2a-js/sdk';

// ─── Package Manifest ────────────────────────────────────────────────────────
// Reads the "a2a" key from package.json and re-exports typed objects.
// This is framework plumbing — edit package.json to change these values.

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'));
const a2a = pkg.a2a as {
  provider?: { organization: string; url: string };
  documentationUrl?: string;
  role: string;
  constraints: string[];
  examples: { user: string; agent: string }[];
  behavior: { maxSteps: number; temperature: number };
  skills: AgentSkill[];
};

export const agentConfig = {
  provider: a2a.provider,
  documentationUrl: a2a.documentationUrl,
};

export const agentInstructions = {
  role: a2a.role,
  constraints: a2a.constraints,
  examples: a2a.examples,
};

export const agentBehavior = a2a.behavior;
export const skills: AgentSkill[] = a2a.skills;

// ─── System Instructions ─────────────────────────────────────────────────────
// Assembles the full system prompt from the "a2a" section of package.json
// plus built-in best practices. Not intended to be edited directly.

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
