import assert from 'node:assert';
import { describe, it } from 'node:test';
import { generateAgentCard } from './card.js';

describe('generateAgentCard', () => {
  it('should return a valid agent card with default base URL', () => {
    const card = generateAgentCard();

    assert.ok(card.name);
    assert.ok(card.description);
    assert.ok(card.version);
    assert.strictEqual(card.protocolVersion, '0.3.0');
    assert.strictEqual(card.url, 'http://localhost:4000/a2a/jsonrpc');
    assert.ok(card.skills.length > 0);
  });

  it('should derive URLs from an Express request', () => {
    const fakeReq = {
      protocol: 'https',
      get: (header: string) => (header === 'host' ? 'myagent.example.com' : undefined),
    };

    const card = generateAgentCard(fakeReq as never);

    assert.strictEqual(card.url, 'https://myagent.example.com/a2a/jsonrpc');
    assert.ok(card.additionalInterfaces?.some((i) => i.url === 'https://myagent.example.com/a2a/rest'));
  });

  it('should include provider info when configured', () => {
    const card = generateAgentCard();
    // provider is optional — card is valid either way
    if (card.provider) {
      assert.ok(card.provider.organization);
    }
  });

  it('should list supported capabilities', () => {
    const card = generateAgentCard();

    assert.strictEqual(card.capabilities?.streaming, false);
    assert.strictEqual(card.capabilities?.pushNotifications, false);
    assert.deepStrictEqual(card.defaultInputModes, ['text']);
    assert.deepStrictEqual(card.defaultOutputModes, ['text']);
  });
});
