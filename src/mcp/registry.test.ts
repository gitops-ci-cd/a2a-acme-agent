import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { MCPRegistration } from './registry.js';

/**
 * Registry uses module-level state, so we dynamically import a fresh copy
 * per test to avoid cross-test pollution.
 */
async function freshRegistry() {
  // Node's module cache means a normal import returns the same instance.
  // For isolated tests we exercise the exported functions against that
  // shared state and clean up after each test.
  const { register, getRegistry, getRegisteredClientIds, closeAllMCPClients } = await import('./registry.js');
  return { register, getRegistry, getRegisteredClientIds, closeAllMCPClients };
}

function mockRegistration(name = 'test-server'): MCPRegistration {
  return {
    name,
    description: `Mock ${name}`,
    client: {
      getClient: async () => ({ tools: async () => ({}) }) as never,
      close: async () => {},
    },
  };
}

describe('MCP registry', () => {
  // The registry module is shared state; clean up IDs we add during tests.
  // Since there's no `unregister`, we rely on the fact that tests use unique IDs.

  it('should register and retrieve an MCP client', async () => {
    const { register, getRegistry, getRegisteredClientIds } = await freshRegistry();
    const id = `test-${Date.now()}-a`;

    register(id, mockRegistration());

    const registry = getRegistry();
    assert.ok(registry[id]);
    assert.strictEqual(registry[id].name, 'test-server');
    assert.ok(getRegisteredClientIds().includes(id));
  });

  it('should throw on duplicate registration', async () => {
    const { register } = await freshRegistry();
    const id = `test-${Date.now()}-b`;

    register(id, mockRegistration());

    assert.throws(() => register(id, mockRegistration()), /already registered/);
  });

  it('should close all registered clients', async () => {
    const { register, closeAllMCPClients } = await freshRegistry();
    const id = `test-${Date.now()}-c`;
    let closed = false;

    register(id, {
      ...mockRegistration(),
      client: {
        getClient: async () => ({}) as never,
        close: async () => {
          closed = true;
        },
      },
    });

    await closeAllMCPClients();
    assert.ok(closed);
  });
});
