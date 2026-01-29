import { CalculationParameters } from '../../models/CalculationParameters';
import { ComplianceResult } from '../../models/ComplianceResult';
import { IEC_60099_4, NEC_STANDARDS, WITHSTAND_VOLTAGE_RATIOS, STRUCTURE_RECOMMENDATIONS, POLLUTION_LEVELS, ALTITUDE_DERATING } from '../../constants/standards';

/**
 * Service to handle compliance checking against IEC and NEC standards
 */
export class StandardsComplianceService {

  /**
   * Check compliance with IEC 60099-4 standards
   * @param params Calculation parameters
   * @param calculatedRating The calculated arrester rating
   * @returns Compliance results for IEC standards
   */
  public checkIECCompliance(params: CalculationParameters, calculatedRating: number): ComplianceResult[] {
    const results: ComplianceResult[] = [];

    // Check lightning impulse residual voltage
    const residualVoltage = this.calculateResidualVoltage(params.systemVoltage, calculatedRating);
    const requiredResidualVoltage = params.systemVoltage * IEC_60099_4.RESIDUAL_VOLTAGE_FACTOR;

    results.push({
      standard: IEC_60099_4.STANDARD_NAME,
      requirement: 'residual_voltage',
      requiredValue: requiredResidualVoltage,
      calculatedValue: residualVoltage,
      unit: 'kV',
      compliant: residualVoltage <= requiredResidualVoltage,
      details: `Residual voltage ${residualVoltage.toFixed(2)}kV must be ≤ ${requiredResidualVoltage.toFixed(2)}kV per IEC 60099-4`
    });

    // Check power frequency withstand voltage
    const withstandVoltage = this.calculateWithstandVoltage(params.systemVoltage, params.structureType);
    const requiredWithstandVoltage = params.systemVoltage * IEC_60099_4.WITHSTAND_VOLTAGE_RATIO;

    results.push({
      standard: IEC_60099_4.STANDARD_NAME,
      requirement: 'withstand_voltage',
      requiredValue: requiredWithstandVoltage,
      calculatedValue: withstandVoltage,
      unit: 'kV',
      compliant: withstandVoltage >= requiredWithstandVoltage,
      details: `Withstand voltage ${withstandVoltage.toFixed(2)}kV must be ≥ ${requiredWithstandVoltage.toFixed(2)}kV per IEC 60099-4`
    });

    // Check temporary overvoltage (TOV) withstand capability
    const tovCapability = this.calculateTOVCapability(params.systemVoltage);
    const requiredTOV = params.systemVoltage * 1.1; // Typically 10% above system voltage for 10 seconds

    results.push({
      standard: IEC_60099_4.STANDARD_NAME,
      requirement: 'tov',
      requiredValue: requiredTOV,
      calculatedValue: tovCapability,
      unit: 'kV',
      compliant: tovCapability >= requiredTOV,
      details: `TOV capability ${tovCapability.toFixed(2)}kV must be ≥ ${requiredTOV.toFixed(2)}kV for 10 seconds per IEC 60099-4`
    });

    // Check cantilever strength (for rod-type arresters)
    if (params.structureType === 'tower' || params.structureType === 'home') {
      const cantileverStrength = this.calculateCantileverStrength();
      const requiredCantileverStrength = 500; // Minimum 500 kg as per IEC 60099-4

      results.push({
        standard: IEC_60099_4.STANDARD_NAME,
        requirement: 'cantilever_strength',
        requiredValue: requiredCantileverStrength,
        calculatedValue: cantileverStrength,
        unit: 'kg',
        compliant: cantileverStrength >= requiredCantileverStrength,
        details: `Cantilever strength ${cantileverStrength}kg must be ≥ ${requiredCantileverStrength}kg per IEC 60099-4`
      });
    }

    return results;
  }

  /**
   * Check compliance with NEC standards
   * @param params Calculation parameters
   * @returns Compliance results for NEC standards
   */
  public checkNECCompliance(params: CalculationParameters): ComplianceResult[] {
    const results: ComplianceResult[] = [];

    // Check SPD type compliance
    const necSpdCompliance = params.complianceRequirement === 'type1' || params.complianceRequirement === 'type2';

    results.push({
      standard: NEC_STANDARDS.STANDARD_NAME,
      requirement: 'spdtype_compliance',
      requiredValue: 1, // Binary check - compliant or not
      calculatedValue: necSpdCompliance ? 1 : 0,
      unit: '',
      compliant: necSpdCompliance,
      details: `SPD type (${params.complianceRequirement}) must be Type 1 or Type 2 as per NEC Article 285`
    });

    // Check installation location based on SPD type
    const installationValid = this.validateInstallationLocation(params.complianceRequirement, params.installationLocation);

    results.push({
      standard: NEC_STANDARDS.STANDARD_NAME,
      requirement: 'installation_location',
      requiredValue: 1, // Binary check
      calculatedValue: installationValid ? 1 : 0,
      unit: '',
      compliant: installationValid,
      details: `Installation location must comply with NEC requirements for Type ${params.complianceRequirement === 'type1' ? '1' : '2'} SPD`
    });

    return results;
  }

  /**
   * Check if no compliant arrester type is available and suggest closest option
   * @param params Calculation parameters
   * @param complianceResults All compliance results
   * @returns Array of recommendations if no compliant solution exists
   */
  public checkForNonCompliantScenario(params: CalculationParameters, complianceResults: ComplianceResult[]): string[] {
    const recommendations: string[] = [];

    // Check if all critical compliance checks failed
    const criticalFailures = complianceResults.filter(
      result => !result.compliant &&
                (result.requirement === 'residual_voltage' ||
                 result.requirement === 'withstand_voltage' ||
                 result.requirement === 'tov')
    );

    if (criticalFailures.length > 0) {
      recommendations.push(
        `No fully compliant arrester type found for the given parameters. Closest available option suggested with compliance warnings.`
      );

      // Provide specific recommendations based on structure type
      switch (params.structureType) {
        case 'home':
          recommendations.push(
            `For residential applications, consider conventional rods with Type 1 SPD as per NEC requirements.`
          );
          break;
        case 'tower':
          recommendations.push(
            `For towers, ESE rods with Type 2 SPD are typically recommended. Verify with local AHJ.`
          );
          break;
        case 'industry':
          recommendations.push(
            `For industrial facilities, MOV arresters with Type 2 SPD are commonly used. Consider higher ratings if needed.`
          );
          break;
        case 'traction':
          recommendations.push(
            `For traction systems, MOV arresters with high cantilever strength are required.`
          );
          break;
      }
    }

    return recommendations;
  }

  /**
   * Calculate residual voltage based on system voltage and arrester rating
   */
  private calculateResidualVoltage(systemVoltage: number, arresterRating: number): number {
    // Simplified calculation - in practice, this would involve more complex modeling
    // based on the specific arrester characteristics
    return systemVoltage * 2.5; // Typical ratio for MOV arresters
  }

  /**
   * Calculate withstand voltage based on system voltage and structure type
   */
  private calculateWithstandVoltage(systemVoltage: number, structureType: string): number {
    // Use the appropriate ratio based on structure type and arrester type
    const ratioKey = structureType.toUpperCase() as keyof typeof WITHSTAND_VOLTAGE_RATIOS;
    const ratio = WITHSTAND_VOLTAGE_RATIOS[ratioKey] || WITHSTAND_VOLTAGE_RATIOS.MOV;

    return systemVoltage * ratio;
  }

  /**
   * Calculate temporary overvoltage capability
   */
  private calculateTOVCapability(systemVoltage: number): number {
    // TOV capability is typically 1.1 to 1.2 times the system voltage for 10 seconds
    return systemVoltage * 1.15;
  }

  /**
   * Calculate minimum cantilever strength for rod-type arresters
   */
  private calculateCantileverStrength(): number {
    // Minimum cantilever strength as per IEC 60099-4 is 500 kg
    return 500; // kg
  }

  /**
   * Validate installation location based on SPD type
   */
  private validateInstallationLocation(spdType: string, location?: string): boolean {
    if (!location) {
      // If no location specified, we can't validate, so assume valid
      return true;
    }

    if (spdType === 'type1') {
      // Type 1 SPD should be installed on the line side of the service disconnect
      return location.toLowerCase().includes('line') || location.toLowerCase().includes('service');
    } else if (spdType === 'type2') {
      // Type 2 SPD should be installed on the load side of the service disconnect
      return location.toLowerCase().includes('load') || location.toLowerCase().includes('panel');
    }

    // For other types or if uncertain, return true
    return true;
  }

  /**
   * Get compliance summary for display
   */
  public getComplianceSummary(complianceResults: ComplianceResult[]): {
    iecCompliant: boolean;
    necCompliant: boolean;
    criticalIssues: number;
    totalChecks: number;
  } {
    const iecResults = complianceResults.filter(r => r.standard.includes('IEC'));
    const necResults = complianceResults.filter(r => r.standard.includes('NEC'));

    const iecCompliant = iecResults.every(r => r.compliant);
    const necCompliant = necResults.every(r => r.compliant);

    const criticalIssues = complianceResults.filter(
      r => !r.compliant &&
           (r.requirement === 'residual_voltage' ||
            r.requirement === 'withstand_voltage' ||
            r.requirement === 'tov')
    ).length;

    return {
      iecCompliant,
      necCompliant,
      criticalIssues,
      totalChecks: complianceResults.length
    };
  }
}