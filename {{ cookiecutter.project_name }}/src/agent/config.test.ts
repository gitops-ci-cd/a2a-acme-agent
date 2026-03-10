import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createModel, localTools, mcpServers } from './config.js';

describe('config', () => {
  it('should throw when MODEL_ID is not set', () => {
    const original = process.env.MODEL_ID;
    delete process.env.MODEL_ID;
    assert.throws(() => createModel(), /MODEL_ID environment variable is required/);
    if (original) process.env.MODEL_ID = original;
  });

  it('should export localTools as an object', () => {
    assert.ok(typeof localTools === 'object');
  });

  it('should export mcpServers as an array', () => {
    assert.ok(Array.isArray(mcpServers));
  });
});
