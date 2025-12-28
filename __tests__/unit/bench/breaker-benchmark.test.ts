import { describe, it, expect } from 'vitest';
import { calculateBreakerSizing } from '@/lib/calculations/breaker/breakerCalculator';

describe('Performance Benchmark', () => {
  it('calculates breaker sizing within 200ms', () => {
    const iterations = 100;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      calculateBreakerSizing({
        circuit: {
          standard: 'NEC',
          voltage: 240,
          phase: 'single',
          loadMode: 'kw',
          loadValue: 10,
          powerFactor: 0.9,
          unitSystem: 'imperial'
        },
        environment: {}
      });
    }
    const end = performance.now();
    const avgMs = (end - start) / iterations;
    console.log('Average calculation time:', avgMs.toFixed(4), 'ms');
    expect(avgMs).toBeLessThan(200);
  });

  it('switches standard and recalculates within 500ms', () => {
    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      calculateBreakerSizing({
        circuit: {
          standard: 'IEC',
          voltage: 400,
          phase: 'three',
          loadMode: 'kw',
          loadValue: 50,
          powerFactor: 0.9,
          unitSystem: 'metric'
        },
        environment: {}
      });
    }
    const end = performance.now();
    const avgMs = (end - start) / iterations;
    console.log('IEC standard calculation:', avgMs.toFixed(4), 'ms');
    expect(avgMs).toBeLessThan(500);
  });
});
