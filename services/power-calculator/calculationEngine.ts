/**
 * Core calculation engine for Active, Reactive & Apparent Power
 * Supports single-phase and three-phase systems per IEC and NEC standards
 */

import { PowerCalculationParameters } from '../../models/PowerCalculationParameters';
import {
  PowerCalculationResult,
  PowerTriangleData,
  KVAKWConversionResult,
  PowerFactorCorrectionResult,
  ComplianceCheck,
} from '../../models/PowerCalculationResult';

/**
 * Standard references for power calculations
 */
export const STANDARD_REFERENCES = {
  IEC: {
    singlePhase: ['IEC 60364-5-52', 'IEC 60038'],
    threePhase: ['IEC 60364-5-52', 'IEC 60364-1', 'IEC 60038'],
  },
  NEC: {
    singlePhase: ['NEC Article 220', 'NEC Article 210'],
    threePhase: ['NEC Article 430', 'NEC Article 220'],
  },
} as const;

/**
 * Power Calculation Engine
 */
export class PowerCalculationEngine {
  /**
   * Calculate active, reactive, and apparent power
   */
  public calculate(params: PowerCalculationParameters): PowerCalculationResult {
    const { systemType, voltage, current, powerFactor } = params;

    // Calculate phase angle from power factor
    const phaseAngleRad = Math.acos(powerFactor);
    const phaseAngleDeg = (phaseAngleRad * 180) / Math.PI;
    const sinPhi = Math.sin(phaseAngleRad);

    // Calculate powers based on system type
    let activePower: number;
    let reactivePower: number;
    let apparentPower: number;
    let formula: string;

    if (systemType === 'single-phase') {
      // Single-phase formulas
      // P = V × I × cosφ (kW)
      // Q = V × I × sinφ (kVAR)
      // S = V × I (kVA)
      const powerVA = voltage * current;
      activePower = (powerVA * powerFactor) / 1000;
      reactivePower = (powerVA * sinPhi) / 1000;
      apparentPower = powerVA / 1000;
      formula = 'P = V × I × cosφ';
    } else {
      // Three-phase formulas
      // P = √3 × V_L × I_L × cosφ (kW)
      // Q = √3 × V_L × I_L × sinφ (kVAR)
      // S = √3 × V_L × I_L (kVA)
      const sqrt3 = Math.sqrt(3);
      const powerVA = sqrt3 * voltage * current;
      activePower = (powerVA * powerFactor) / 1000;
      reactivePower = (powerVA * sinPhi) / 1000;
      apparentPower = powerVA / 1000;
      formula = 'P = √3 × V × I × cosφ';
    }

    // Round results to 2 decimal places
    activePower = Math.round(activePower * 100) / 100;
    reactivePower = Math.round(reactivePower * 100) / 100;
    apparentPower = Math.round(apparentPower * 100) / 100;
    const roundedPhaseAngle = Math.round(phaseAngleDeg * 100) / 100;

    // Generate compliance checks
    const complianceChecks = this.generateComplianceChecks(params, activePower, reactivePower, apparentPower);

    // Generate warnings
    const warnings = this.generateWarnings(params, powerFactor);

    // Get standard references
    const standardReferences = this.getStandardReferences(systemType);

    return {
      activePower,
      reactivePower,
      apparentPower,
      powerFactor,
      phaseAngle: roundedPhaseAngle,
      systemType,
      formula,
      standardReferences,
      complianceChecks,
      warnings,
      calculationTimestamp: new Date(),
    };
  }

  /**
   * Get power triangle data for visualization
   */
  public getPowerTriangleData(result: PowerCalculationResult): PowerTriangleData {
    return {
      p: result.activePower,
      q: result.reactivePower,
      s: result.apparentPower,
      angle: result.phaseAngle,
      powerFactor: result.powerFactor,
    };
  }

  /**
   * Convert kVA to kW
   */
  public convertKVAtokW(kva: number, powerFactor: number): KVAKWConversionResult {
    const kw = kva * powerFactor;

    return {
      kva: Math.round(kva * 100) / 100,
      kw: Math.round(kw * 100) / 100,
      powerFactor,
      formula: 'kW = kVA × cosφ',
    };
  }

  /**
   * Convert kW to kVA
   */
  public convertkWtokVA(kw: number, powerFactor: number): { kva: number; kw: number; powerFactor: number; formula: string } {
    const kva = kw / powerFactor;

    return {
      kva: Math.round(kva * 100) / 100,
      kw: Math.round(kw * 100) / 100,
      powerFactor,
      formula: 'kVA = kW / cosφ',
    };
  }

  /**
   * Calculate power factor correction requirements
   */
  public calculatePowerFactorCorrection(
    activePower: number,
    currentPF: number,
    targetPF: number
  ): PowerFactorCorrectionResult {
    // Current reactive power
    const currentAngleRad = Math.acos(currentPF);
    const currentTanPhi = Math.tan(currentAngleRad);
    const currentReactivePower = activePower * currentTanPhi;

    // Target reactive power
    const targetAngleRad = Math.acos(targetPF);
    const targetTanPhi = Math.tan(targetAngleRad);
    const targetReactivePower = activePower * targetTanPhi;

    // Required capacitor kVAR
    const requiredCapacitorKVAR = currentReactivePower - targetReactivePower;

    // Estimate efficiency improvement (simplified)
    // Lower reactive power means less I²R losses
    const efficiencyImprovement = ((currentReactivePower - targetReactivePower) / currentReactivePower) * 100;

    return {
      currentPF,
      targetPF,
      activePower: Math.round(activePower * 100) / 100,
      currentReactivePower: Math.round(currentReactivePower * 100) / 100,
      targetReactivePower: Math.round(targetReactivePower * 100) / 100,
      requiredCapacitorKVAR: Math.round(requiredCapacitorKVAR * 100) / 100,
      efficiencyImprovement: Math.round(efficiencyImprovement * 10) / 10,
    };
  }

  /**
   * Generate compliance checks
   */
  private generateComplianceChecks(
    params: PowerCalculationParameters,
    activePower: number,
    reactivePower: number,
    apparentPower: number
  ): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];

    // Power factor compliance
    const pfCompliant = params.powerFactor >= 0.85;
    checks.push({
      standard: params.systemType === 'single-phase' ? 'IEC 60364-5-52' : 'NEC Article 430',
      clause: params.systemType === 'single-phase' ? '524' : '430.24',
      requirement: 'Power factor should be ≥ 0.85 for efficient operation',
      compliant: pfCompliant,
      details: pfCompliant
        ? `Power factor ${params.powerFactor} is within acceptable range`
        : `Power factor ${params.powerFactor} is below recommended 0.85`,
    });

    // Voltage compliance per IEC 60038
    const voltageCompliant = params.voltage >= 100 && params.voltage <= 1000;
    checks.push({
      standard: 'IEC 60038',
      clause: 'Table 1',
      requirement: 'Voltage within standard range (100V - 1000V)',
      compliant: voltageCompliant,
      details: voltageCompliant
        ? `Voltage ${params.voltage}V is within IEC 60038 standard range`
        : `Voltage ${params.voltage}V is outside standard range`,
    });

    // Power balance check (S² = P² + Q²)
    const calculatedS = Math.sqrt(activePower * activePower + reactivePower * reactivePower);
    const powerBalanceError = Math.abs(calculatedS - apparentPower);
    const powerBalanceCompliant = powerBalanceError < 0.01;

    checks.push({
      standard: 'IEC 60364-1',
      clause: 'Fundamental Principles',
      requirement: 'Power triangle relationship: S² = P² + Q²',
      compliant: powerBalanceCompliant,
      details: powerBalanceCompliant
        ? 'Power values satisfy triangle relationship'
        : `Power balance error: ${powerBalanceError.toFixed(4)} kVA`,
    });

    return checks;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(params: PowerCalculationParameters, powerFactor: number): string[] {
    const warnings: string[] = [];

    // Low power factor warning
    if (powerFactor < 0.85) {
      warnings.push(`Low power factor (${powerFactor}) detected - consider power factor correction`);
    }

    // Very low power factor warning
    if (powerFactor < 0.7) {
      warnings.push('Very low power factor - significant efficiency losses expected');
    }

    // High current warning
    if (params.current > 1000) {
      warnings.push(`High current (${params.current}A) - verify conductor sizing and protection`);
    }

    // Three-phase balance note (if applicable)
    if (params.systemType === 'three-phase') {
      warnings.push('Ensure balanced load distribution across all three phases');
    }

    return warnings;
  }

  /**
   * Get standard references based on system type
   */
  private getStandardReferences(systemType: 'single-phase' | 'three-phase'): string[] {
    // Return combined IEC and NEC references
    if (systemType === 'single-phase') {
      return [...STANDARD_REFERENCES.IEC.singlePhase, ...STANDARD_REFERENCES.NEC.singlePhase];
    } else {
      return [...STANDARD_REFERENCES.IEC.threePhase, ...STANDARD_REFERENCES.NEC.threePhase];
    }
  }
}

/**
 * Convenience function for quick calculations
 */
export function calculatePower(params: PowerCalculationParameters): PowerCalculationResult {
  const engine = new PowerCalculationEngine();
  return engine.calculate(params);
}
