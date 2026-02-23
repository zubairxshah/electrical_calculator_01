/**
 * Result types for Active, Reactive & Apparent Power calculations
 */

/**
 * Compliance check result
 */
export interface ComplianceCheck {
  /** Standard name (e.g., "IEC 60364-5-52") */
  standard: string;
  
  /** Clause reference (e.g., "524") */
  clause: string;
  
  /** Requirement description */
  requirement: string;
  
  /** Whether the requirement is met */
  compliant: boolean;
  
  /** Additional details */
  details?: string;
}

/**
 * Power calculation result
 */
export interface PowerCalculationResult {
  /** Active Power (P) in kW */
  activePower: number;
  
  /** Reactive Power (Q) in kVAR */
  reactivePower: number;
  
  /** Apparent Power (S) in kVA */
  apparentPower: number;
  
  /** Power factor (cosφ) */
  powerFactor: number;
  
  /** Phase angle (φ) in degrees */
  phaseAngle: number;
  
  /** System type used for calculation */
  systemType: 'single-phase' | 'three-phase';
  
  /** Formula used for calculation */
  formula: string;
  
  /** Standard references applied */
  standardReferences: string[];
  
  /** Compliance checks */
  complianceChecks: ComplianceCheck[];
  
  /** Warning messages */
  warnings: string[];
  
  /** Calculation timestamp */
  calculationTimestamp: Date;
  
  /** Optional: Project name if saved */
  projectName?: string;
}

/**
 * Power triangle data for visualization
 */
export interface PowerTriangleData {
  /** Active Power (P) in kW - horizontal component */
  p: number;
  
  /** Reactive Power (Q) in kVAR - vertical component */
  q: number;
  
  /** Apparent Power (S) in kVA - hypotenuse */
  s: number;
  
  /** Phase angle (φ) in degrees */
  angle: number;
  
  /** Power factor (cosφ) */
  powerFactor: number;
}

/**
 * kVA to kW conversion result
 */
export interface KVAKWConversionResult {
  /** Input apparent power (kVA) */
  kva: number;
  
  /** Output active power (kW) */
  kw: number;
  
  /** Power factor used */
  powerFactor: number;
  
  /** Formula: kW = kVA × cosφ */
  formula: string;
}

/**
 * Power factor correction result
 */
export interface PowerFactorCorrectionResult {
  /** Current power factor */
  currentPF: number;
  
  /** Target power factor */
  targetPF: number;
  
  /** Active power (kW) */
  activePower: number;
  
  /** Current reactive power (kVAR) */
  currentReactivePower: number;
  
  /** Target reactive power (kVAR) */
  targetReactivePower: number;
  
  /** Required capacitor kVAR */
  requiredCapacitorKVAR: number;
  
  /** Estimated efficiency improvement (%) */
  efficiencyImprovement: number;
}
