import { describe, expect, it } from 'vitest';
import { deserialiseCircularJson, serialiseCircularJson } from './circularJson.js';

describe('circular JSON transport', () => {
  it('preserves self references', () => {
    const root: Record<string, unknown> = { name: 'root' };
    root.self = root;

    const restored = deserialiseCircularJson(JSON.parse(serialiseCircularJson(root))) as Record<string, unknown>;

    expect(restored.self).toBe(restored);
  });

  it('preserves shared references across different branches', () => {
    const shared = { name: 'shared' };
    const source = { first: shared, second: { child: shared } };

    const restored = deserialiseCircularJson(JSON.parse(serialiseCircularJson(source))) as {
      first: { name: string };
      second: { child: { name: string } };
    };

    expect(restored.first).toBe(restored.second.child);
  });

  it('returns primitive values unchanged', () => {
    expect(deserialiseCircularJson(JSON.parse(serialiseCircularJson('value')))).toBe('value');
  });
});
