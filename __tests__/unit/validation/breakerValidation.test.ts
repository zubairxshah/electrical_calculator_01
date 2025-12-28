/**
 * Input Validation Tests
 *
 * Tests for Zod schema validation of circuit breaker calculator inputs.
 * Validates edge cases: negative power, invalid voltage ranges, bad power factor, etc.
 *
 * Reference: specs/003-circuit-breaker-sizing/spec.md FR-036 (Edge Cases)
 */

import { describe, it, expect } from 'vitest';
import {
  validateCircuitConfig,
  validateEnvironmentalConditions,
  validateCalculationInput,
  checkStandardVoltage,
  checkExtremeTemperature,
  checkPowerFactor,
  checkCircuitDistance,
  validateWithWarnings,
} from '@/lib/validation/breakerValidation';

describe('Circuit Configuration Validation - Valid Inputs', () => {
  it('should accept valid NEC configuration', () => {
    const input = {
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      powerFactor: 0.9,
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it('should accept valid IEC configuration', () => {
    const input = {
      standard: 'IEC',
      voltage: 400,
      phase: 'three',
      loadMode: 'amps',
      loadValue: 50,
      powerFactor: 0.85,
      unitSystem: 'metric',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(true);
  });

  it('should apply default power factor of 0.8 when not specified', () => {
    const input = {
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      unitSystem: 'imperial',
      // powerFactor omitted
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.powerFactor).toBe(0.8);
    }
  });
});

describe('Circuit Configuration Validation - Invalid Voltage', () => {
  it('should reject voltage below 100V', () => {
    const input = {
      standard: 'NEC',
      voltage: 50,  // Too low
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      powerFactor: 0.9,
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod error has 'issues' property, not 'errors'
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
      const errorMessages = result.error.issues.map(e => e.message).join(', ');
      expect(errorMessages).toContain('100');
    }
  });

  it('should reject voltage above 1000V', () => {
    const input = {
      standard: 'NEC',
      voltage: 1500,  // Too high
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      powerFactor: 0.9,
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessages = result.error.issues.map(e => e.message).join(', ');
      expect(errorMessages).toContain('1000');
    }
  });

  it('should reject negative voltage', () => {
    const input = {
      standard: 'NEC',
      voltage: -240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      powerFactor: 0.9,
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessages = result.error.issues.map(e => e.message).join(', ');
      expect(errorMessages).toMatch(/positive|100/i);
    }
  });

  it('should reject zero voltage', () => {
    const input = {
      standard: 'NEC',
      voltage: 0,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      powerFactor: 0.9,
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
  });
});

describe('Circuit Configuration Validation - Invalid Load', () => {
  it('should reject negative load value', () => {
    const input = {
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: -10,  // Negative
      powerFactor: 0.9,
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessages = result.error.issues.map(e => e.message).join(', ');
      expect(errorMessages).toMatch(/greater than zero|positive/i);
    }
  });

  it('should reject zero load value', () => {
    const input = {
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 0,
      powerFactor: 0.9,
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
  });

  it('should reject load value exceeding 10000', () => {
    const input = {
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 15000,  // Too high
      powerFactor: 0.9,
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessages = result.error.issues.map(e => e.message).join(', ');
      expect(errorMessages).toMatch(/10,?000/);
    }
  });
});

describe('Circuit Configuration Validation - Invalid Power Factor', () => {
  it('should reject power factor below 0.5', () => {
    const input = {
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      powerFactor: 0.3,  // Too low
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessages = result.error.issues.map(e => e.message).join(', ');
      expect(errorMessages).toMatch(/0\.5/);
    }
  });

  it('should reject power factor above 1.0', () => {
    const input = {
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      powerFactor: 1.2,  // Too high
      unitSystem: 'imperial',
    };

    const result = validateCircuitConfig(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessages = result.error.issues.map(e => e.message).join(', ');
      expect(errorMessages).toMatch(/1\.0/);
    }
  });

  it('should accept power factor at boundaries', () => {
    const testCases = [0.5, 0.8, 1.0];

    testCases.forEach(pf => {
      const input = {
        standard: 'NEC',
        voltage: 240,
        phase: 'single',
        loadMode: 'kw',
        loadValue: 10,
        powerFactor: pf,
        unitSystem: 'imperial',
      };

      const result = validateCircuitConfig(input);
      expect(result.success).toBe(true);
    });
  });
});

describe('Environmental Conditions Validation - Temperature', () => {
  it('should accept valid temperature range', () => {
    const input = {
      ambientTemperature: 30,
      groupedCables: 5,
    };

    const result = validateEnvironmentalConditions(input);
    expect(result.success).toBe(true);
  });

  it('should reject temperature below -40°C', () => {
    const input = {
      ambientTemperature: -50,
    };

    const result = validateEnvironmentalConditions(input);
    expect(result.success).toBe(false);
  });

  it('should reject temperature above 70°C', () => {
    const input = {
      ambientTemperature: 80,
    };

    const result = validateEnvironmentalConditions(input);
    expect(result.success).toBe(false);
  });

  it('should accept temperature at boundaries', () => {
    const testCases = [-40, 0, 30, 70];

    testCases.forEach(temp => {
      const input = { ambientTemperature: temp };
      const result = validateEnvironmentalConditions(input);
      expect(result.success).toBe(true);
    });
  });
});

describe('Environmental Conditions Validation - Grouped Cables', () => {
  it('should accept valid cable counts', () => {
    const testCases = [1, 3, 6, 10, 20, 50, 100];

    testCases.forEach(count => {
      const input = { groupedCables: count };
      const result = validateEnvironmentalConditions(input);
      expect(result.success).toBe(true);
    });
  });

  it('should reject zero cables', () => {
    const input = { groupedCables: 0 };
    const result = validateEnvironmentalConditions(input);
    expect(result.success).toBe(false);
  });

  it('should reject negative cable count', () => {
    const input = { groupedCables: -5 };
    const result = validateEnvironmentalConditions(input);
    expect(result.success).toBe(false);
  });

  it('should reject cable count exceeding 100', () => {
    const input = { groupedCables: 150 };
    const result = validateEnvironmentalConditions(input);
    expect(result.success).toBe(false);
  });

  it('should reject fractional cable count', () => {
    const input = { groupedCables: 5.5 };
    const result = validateEnvironmentalConditions(input);
    expect(result.success).toBe(false);
  });
});

describe('Standard Voltage Warnings', () => {
  it('should not warn for standard NEC voltages', () => {
    const standardVoltages = [120, 208, 240, 277, 480];

    standardVoltages.forEach(voltage => {
      const warning = checkStandardVoltage(voltage, 'NEC');
      expect(warning).toBeNull();
    });
  });

  it('should not warn for standard IEC voltages', () => {
    const standardVoltages = [230, 400, 690];

    standardVoltages.forEach(voltage => {
      const warning = checkStandardVoltage(voltage, 'IEC');
      expect(warning).toBeNull();
    });
  });

  it('should warn for non-standard voltage: 380V', () => {
    const warning = checkStandardVoltage(380, 'IEC');
    expect(warning).not.toBeNull();
    expect(warning).toContain('not a standard');
    expect(warning).toContain('380V');
  });

  it('should warn for non-standard voltage: 415V', () => {
    const warning = checkStandardVoltage(415, 'IEC');
    expect(warning).not.toBeNull();
  });

  it('should suggest standard voltages in warning', () => {
    const warning = checkStandardVoltage(250, 'NEC');
    expect(warning).toContain('Common values');
  });
});

describe('Extreme Temperature Warnings', () => {
  it('should not warn for normal temperatures', () => {
    const normalTemps = [-10, 0, 20, 30, 40, 50];

    normalTemps.forEach(temp => {
      const warning = checkExtremeTemperature(temp);
      expect(warning).toBeNull();
    });
  });

  it('should warn for high temperature >60°C', () => {
    const warning = checkExtremeTemperature(65);
    expect(warning).not.toBeNull();
    expect(warning).toContain('extremely high');
    expect(warning).toContain('Special breakers');
  });

  it('should warn for very low temperature <-20°C', () => {
    const warning = checkExtremeTemperature(-30);
    expect(warning).not.toBeNull();
    expect(warning).toContain('extremely low');
    expect(warning).toContain('Cold-rated');
  });

  it('should not warn at temperature boundaries', () => {
    expect(checkExtremeTemperature(-20)).toBeNull();
    expect(checkExtremeTemperature(60)).toBeNull();
  });
});

describe('Power Factor Warnings', () => {
  it('should not warn for acceptable power factors', () => {
    const acceptablePF = [0.7, 0.8, 0.9, 0.95, 1.0];

    acceptablePF.forEach(pf => {
      const warning = checkPowerFactor(pf);
      expect(warning).toBeNull();
    });
  });

  it('should warn for low power factor <0.7', () => {
    const warning = checkPowerFactor(0.6);
    expect(warning).not.toBeNull();
    expect(warning).toContain('very low');
    expect(warning).toContain('power factor correction');
  });

  it('should warn for very low power factor', () => {
    const warning = checkPowerFactor(0.5);
    expect(warning).not.toBeNull();
  });
});

describe('Circuit Distance Warnings', () => {
  it('should not warn for short to moderate distances', () => {
    expect(checkCircuitDistance(50, 'metric')).toBeNull();
    expect(checkCircuitDistance(200, 'metric')).toBeNull();
    expect(checkCircuitDistance(500, 'imperial')).toBeNull();
  });

  it('should warn for long metric distances >300m', () => {
    const warning = checkCircuitDistance(350, 'metric');
    expect(warning).not.toBeNull();
    expect(warning).toContain('very long');
    expect(warning).toContain('Voltage drop analysis');
  });

  it('should warn for long imperial distances >1000ft', () => {
    const warning = checkCircuitDistance(1200, 'imperial');
    expect(warning).not.toBeNull();
    expect(warning).toContain('very long');
  });
});

describe('Complete Validation with Warnings', () => {
  it('should pass validation with no warnings for standard configuration', () => {
    const input = {
      circuit: {
        standard: 'NEC' as const,
        voltage: 240,
        phase: 'single' as const,
        loadMode: 'kw' as const,
        loadValue: 10,
        powerFactor: 0.9,
        unitSystem: 'imperial' as const,
      },
    };

    const result = validateWithWarnings(input);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should pass validation but generate warnings for edge cases', () => {
    const input = {
      circuit: {
        standard: 'NEC' as const,
        voltage: 380,  // Non-standard
        phase: 'three' as const,
        loadMode: 'kw' as const,
        loadValue: 50,
        powerFactor: 0.65,  // Low
        unitSystem: 'metric' as const,
      },
      environment: {
        ambientTemperature: 65,  // High
        circuitDistance: 400,    // Long
      },
    };

    const result = validateWithWarnings(input);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);

    // Should have warnings for: non-standard voltage, low PF, high temp, long distance
    expect(result.warnings.some(w => w.includes('380V'))).toBe(true);
    expect(result.warnings.some(w => w.includes('power factor'))).toBe(true);
    expect(result.warnings.some(w => w.includes('65°C'))).toBe(true);
    expect(result.warnings.some(w => w.includes('400m'))).toBe(true);
  });

  it('should fail validation with errors for invalid inputs', () => {
    const input = {
      circuit: {
        standard: 'NEC' as const,
        voltage: -240,  // Invalid: negative
        phase: 'single' as const,
        loadMode: 'kw' as const,
        loadValue: -10,  // Invalid: negative
        powerFactor: 1.5,  // Invalid: >1.0
        unitSystem: 'imperial' as const,
      },
    };

    const result = validateWithWarnings(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
