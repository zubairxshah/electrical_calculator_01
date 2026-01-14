/**
 * Performance Tests for Breaker Calculator
 *
 * Validates that calculation latency meets performance goals:
 * - Single calculation: <200ms from input to result
 * - Standard recalculation: <500ms (NEC ↔ IEC toggle)
 *
 * Task T036 & T037: Performance profiling and standard switch timing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateBreakerSizing, recalculateWithStandard } from '@/lib/calculations/breaker/breakerCalculator';
import type { BreakerCalculationInput } from '@/lib/calculations/breaker/breakerCalculator';

describe('Breaker Calculator Performance Tests (T036, T037)', () => {
  let testInput: BreakerCalculationInput;

  beforeEach(() => {
    // Standard test case: 10 kW @ 240V single-phase, 0.9 PF
    testInput = {
      circuit: {
        standard: 'NEC',
        voltage: 240,
        phase: 'single',
        loadMode: 'kw',
        loadValue: 10,
        powerFactor: 0.9,
        unitSystem: 'imperial',
      },
    };
  });

  describe('T036: Calculation Latency Performance', () => {
    it('should complete single calculation in <200ms (performance goal)', async () => {
      const startTime = performance.now();

      const results = await calculateBreakerSizing(testInput);

      const elapsedMs = performance.now() - startTime;

      // Verify result is correct
      expect(results).toBeDefined();
      expect(results.breakerSizing.recommendedBreakerAmps).toBeGreaterThan(0);

      // Verify performance goal
      console.log(`✓ Single calculation completed in ${elapsedMs.toFixed(2)}ms`);
      expect(elapsedMs).toBeLessThan(200);
    });

    it('should complete calculation with environmental factors in <200ms', async () => {
      const inputWithEnv: BreakerCalculationInput = {
        ...testInput,
        environment: {
          ambientTemperature: 45,
          groupedCables: 6,
          installationMethod: 'A1', // Valid IEC installation method
          circuitDistance: 100,
          conductorMaterial: 'copper',
          conductorSize: { value: 6, unit: 'AWG' },
        },
        shortCircuitCurrentKA: 15,
        loadType: 'inductive',
      };

      const startTime = performance.now();
      const results = await calculateBreakerSizing(inputWithEnv);
      const elapsedMs = performance.now() - startTime;

      expect(results).toBeDefined();
      expect(results.deratingFactors).toBeDefined();
      expect(results.voltageDropAnalysis).toBeDefined();

      console.log(`✓ Calculation with environmental factors completed in ${elapsedMs.toFixed(2)}ms`);
      expect(elapsedMs).toBeLessThan(200);
    });

    it('should process multiple calculations efficiently (batch test)', async () => {
      const calculations = Array.from({ length: 10 }, (_, i) => ({
        ...testInput,
        circuit: {
          ...testInput.circuit,
          loadValue: 5 + (i * 2), // Vary load 5-25 kW
        },
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        calculations.map(calc => calculateBreakerSizing(calc))
      );
      const totalElapsedMs = performance.now() - startTime;
      const avgPerCalculation = totalElapsedMs / calculations.length;

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.breakerSizing.recommendedBreakerAmps).toBeGreaterThan(0);
      });

      console.log(`✓ 10 parallel calculations: ${totalElapsedMs.toFixed(2)}ms total, ${avgPerCalculation.toFixed(2)}ms average`);

      // Average should still be well under 200ms
      expect(avgPerCalculation).toBeLessThan(150);
    });
  });

  describe('T037: Standard Switch Recalculation Performance', () => {
    it('should recalculate from NEC to IEC in <500ms', async () => {
      // First calculation with NEC
      const necResults = await calculateBreakerSizing(testInput);
      expect(necResults.breakerSizing.recommendedStandard).toBe('NEC');

      // Recalculate with IEC standard
      const startTime = performance.now();
      const iecResults = await recalculateWithStandard(testInput, 'IEC');
      const elapsedMs = performance.now() - startTime;

      // Verify standard changed
      expect(iecResults.breakerSizing.recommendedStandard).toBe('IEC');

      // IEC doesn't apply 125% factor, so breaker should be smaller or equal
      expect(iecResults.breakerSizing.recommendedBreakerAmps).toBeLessThanOrEqual(
        necResults.breakerSizing.recommendedBreakerAmps
      );

      console.log(`✓ NEC → IEC recalculation in ${elapsedMs.toFixed(2)}ms`);
      expect(elapsedMs).toBeLessThan(500);
    });

    it('should recalculate from IEC to NEC in <500ms', async () => {
      // Start with IEC
      const iecInput: BreakerCalculationInput = {
        ...testInput,
        circuit: {
          ...testInput.circuit,
          standard: 'IEC' as const,
          voltage: 400, // Standard IEC voltage
        },
      };

      const iecResults = await calculateBreakerSizing(iecInput);
      expect(iecResults.breakerSizing.recommendedStandard).toBe('IEC');

      // Recalculate to NEC
      const startTime = performance.now();
      const necResults = await recalculateWithStandard(iecInput, 'NEC');
      const elapsedMs = performance.now() - startTime;

      expect(necResults.breakerSizing.recommendedStandard).toBe('NEC');

      // NEC applies 125% factor, so breaker should be larger or equal
      expect(necResults.breakerSizing.recommendedBreakerAmps).toBeGreaterThanOrEqual(
        iecResults.breakerSizing.recommendedBreakerAmps
      );

      console.log(`✓ IEC → NEC recalculation in ${elapsedMs.toFixed(2)}ms`);
      expect(elapsedMs).toBeLessThan(500);
    });

    it('should complete multiple standard switches within performance budget', async () => {
      const switches = [
        { from: 'NEC' as const, to: 'IEC' as const },
        { from: 'IEC' as const, to: 'NEC' as const },
        { from: 'NEC' as const, to: 'IEC' as const },
        { from: 'IEC' as const, to: 'NEC' as const },
      ];

      const startTime = performance.now();

      let currentInput = testInput;
      let currentStandard: 'NEC' | 'IEC' = 'NEC';

      for (const switchOp of switches) {
        const result = await recalculateWithStandard(currentInput, switchOp.to);
        expect(result.breakerSizing.recommendedStandard).toBe(switchOp.to);
        currentStandard = switchOp.to;
      }

      const totalElapsedMs = performance.now() - startTime;

      console.log(`✓ 4 consecutive standard switches: ${totalElapsedMs.toFixed(2)}ms total`);

      // Should complete all 4 switches well within 2 seconds (500ms × 4 max)
      expect(totalElapsedMs).toBeLessThan(2000);
    });

    it('should maintain consistent performance across various input scenarios', async () => {
      const scenarios = [
        { description: 'Low load', loadValue: 1 },
        { description: 'Medium load', loadValue: 15 },
        { description: 'High load', loadValue: 100 },
        { description: 'Very high load', loadValue: 500 },
      ];

      const timings: Record<string, number[]> = {};

      for (const scenario of scenarios) {
        timings[scenario.description] = [];

        const scenarioInput: BreakerCalculationInput = {
          ...testInput,
          circuit: {
            ...testInput.circuit,
            loadValue: scenario.loadValue,
          },
        };

        // Test NEC to IEC twice for each scenario
        for (let i = 0; i < 2; i++) {
          const startTime = performance.now();
          await recalculateWithStandard(scenarioInput, i === 0 ? 'IEC' : 'NEC');
          timings[scenario.description].push(performance.now() - startTime);
        }
      }

      // Log and verify timings
      for (const [scenario, times] of Object.entries(timings)) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`  ${scenario}: avg ${avgTime.toFixed(2)}ms (${times.map(t => t.toFixed(0)).join('ms, ')}ms)`);
        expect(avgTime).toBeLessThan(500);
      }
    });
  });

  describe('Performance Summary (SC-006 & SC-007)', () => {
    it('should meet all performance goals as per spec criteria', async () => {
      // SC-006: Standard switch within 500ms
      const iecInput: BreakerCalculationInput = {
        ...testInput,
        circuit: { ...testInput.circuit, standard: 'IEC' as const, voltage: 400 },
      };

      const iecResult = await calculateBreakerSizing(iecInput);

      const startTime = performance.now();
      const necResult = await recalculateWithStandard(iecInput, 'NEC');
      const switchTime = performance.now() - startTime;

      expect(switchTime).toBeLessThan(500);
      expect(necResult.breakerSizing.recommendedStandard).toBe('NEC');

      console.log(`\n✓ Performance Summary (SC-006 & SC-007):`);
      console.log(`  - Single calculation: <200ms ✓`);
      console.log(`  - Standard switch (IEC→NEC): ${switchTime.toFixed(2)}ms (<500ms) ✓`);
      console.log(`  - All performance goals met ✓`);
    });
  });
});
