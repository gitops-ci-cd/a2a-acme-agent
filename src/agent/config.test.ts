import assert from 'node:assert';
import { describe, it } from 'node:test';
import { agentBehavior, agentConfig, agentInstructions, buildInstructions, skills } from './config.js';

describe('config', () => {
  it('should export agent config with provider info', () => {
    assert.ok(agentConfig.provider.organization);
    assert.ok(agentConfig.provider.url);
  });

  it('should build instructions with role and skills as responsibilities', () => {
    const prompt = buildInstructions();
    assert.ok(prompt.includes(agentInstructions.role));
    for (const skill of skills) {
      assert.ok(prompt.includes(skill.name), `missing skill name: ${skill.name}`);
      assert.ok(
        skill.description && prompt.includes(skill.description),
        `missing skill description: ${skill.description}`,
      );
    }
  });

  it('should include built-in guidelines in instructions', () => {
    const prompt = buildInstructions();
    assert.ok(prompt.includes('Think through problems step-by-step'));
    assert.ok(prompt.includes('say so rather than guessing'));
  });

  it('should include constraints when provided', () => {
    // Temporarily add a constraint to verify it appears
    agentInstructions.constraints.push('Keep responses under 100 words');
    const prompt = buildInstructions();
    assert.ok(prompt.includes('Keep responses under 100 words'));
    agentInstructions.constraints.pop();
  });

  it('should include examples when provided', () => {
    agentInstructions.examples.push({ user: 'What is 2+2?', agent: '4' });
    const prompt = buildInstructions();
    assert.ok(prompt.includes('What is 2+2?'));
    assert.ok(prompt.includes('4'));
    agentInstructions.examples.pop();
  });

  it('should export agentBehavior with positive maxSteps', () => {
    assert.ok(agentBehavior.maxSteps > 0);
    assert.ok(agentBehavior.temperature >= 0 && agentBehavior.temperature <= 2);
  });

  it('should export at least one skill with required fields', () => {
    assert.ok(skills.length > 0);
    for (const skill of skills) {
      assert.ok(skill.id, 'skill must have an id');
      assert.ok(skill.name, 'skill must have a name');
      assert.ok(skill.description, 'skill must have a description');
    }
  });
});
