import { ResourcePoolVo } from './resource-pool.vo';

describe('ResourcePoolVo', () => {
  it('should create an instance', () => {
    expect(new ResourcePoolVo(100, 100)).toBeTruthy();
  });

  it('percentage is the raw ratio', () => {
    expect(new ResourcePoolVo(950, 1000).percentage).toBe(0.95);
  });

  it('remaining shows in integer', () => {
    const pool = new ResourcePoolVo(50.123, 100);
    expect(pool.remaining).toBe(50);
  });

  it('never drops below zero', () => {
    const pool = new ResourcePoolVo(100, 100).decrease(250);
    expect(pool.remaining).toBe(0);
    expect(pool.percentage).toBe(0);
  });

  it('caps current at max', () => {
    expect(new ResourcePoolVo(1500, 1000).remaining).toBe(1000);
  });

  it('rejects a non-positive max', () => {
    expect(() => new ResourcePoolVo(100, 0)).toThrow();
    expect(() => new ResourcePoolVo(100, -5)).toThrow();
  });
});
