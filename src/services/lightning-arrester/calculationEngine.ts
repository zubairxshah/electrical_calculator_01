import { math } from '../../lib/math';
import { CalculationParameters, VALIDATION_RULES } from '../../models/CalculationParameters';
import { CalculationResult, ComplianceResult } from '../../models/ComplianceResult';
import { IEC_60099_4, NEC_STANDARDS, WITHSTAND_VOLTAGE_RATIOS, STRUCTURE_RECOMMENDATIONS, POLLUTION_LEVELS, ALTITUDE_DERATING, HIGHRISE_SPECIFIC, HIGHRISE_POLLUTION_FACTORS } from '../../constants/standards';

/**
 * Core calculation engine for lightning arrester calculations based on IEC 60099-4 standards
 */
export class LightningArresterCalculationEngine {

  /**
   * Calculate recommended lightning arrester based on input parameters
   * @param params Calculation parameters
   * @returns Calculation result with recommended arrester and compliance status
   */
  public calculate(params: CalculationParameters): CalculationResult {
    // Validate inputs first
    const validationErrors = this.validateInputs(params);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid inputs: ${validationErrors.join(', ')}`);
    }

    // Determine arrester type based on structure type and other parameters
    const arresterType = this.determineArresterType(params);

    // Calculate recommended rating based on system voltage
    const rating = this.calculateRecommendedRating(params.systemVoltage, arresterType, params);

    // Perform compliance checks
    const complianceResults = this.performComplianceChecks(params, rating, arresterType);

    // Generate installation recommendation
    const installationRecommendation = this.generateInstallationRecommendation(params.complianceRequirement);

    // Generate warnings if needed
    const warnings = this.generateWarnings(params, complianceResults);

    return {
      arresterType,
      rating,
      complianceResults,
      installationRecommendation,
      warnings,
      calculationTimestamp: new Date(),
    };
  }

  /**
   * Validate input parameters according to standards
   */
  private validateInputs(params: CalculationParameters): string[] {
    const errors: string[] = [];

    // Validate system voltage
    if (params.systemVoltage < VALIDATION_RULES.MIN_VOLTAGE || params.systemVoltage > VALIDATION_RULES.MAX_VOLTAGE) {
      errors.push(`System voltage must be between ${VALIDATION_RULES.MIN_VOLTAGE}kV and ${VALIDATION_RULES.MAX_VOLTAGE}kV`);
    }

    // Validate humidity
    if (params.environmentalConditions.humidity < VALIDATION_RULES.MIN_HUMIDITY || params.environmentalConditions.humidity > VALIDATION_RULES.MAX_HUMIDITY) {
      errors.push(`Humidity must be between ${VALIDATION_RULES.MIN_HUMIDITY}% and ${VALIDATION_RULES.MAX_HUMIDITY}%`);
    }

    // Validate altitude
    if (params.environmentalConditions.altitude < VALIDATION_RULES.MIN_ALTITUDE || params.environmentalConditions.altitude > VALIDATION_RULES.MAX_ALTITUDE) {
      errors.push(`Altitude must be between ${VALIDATION_RULES.MIN_ALTITUDE}m and ${VALIDATION_RULES.MAX_ALTITUDE}m`);
    }

    // Validate pollution level
    if (!VALIDATION_RULES.POLLUTION_LEVELS.includes(params.environmentalConditions.pollutionLevel)) {
      errors.push(`Pollution level must be one of: ${VALIDATION_RULES.POLLUTION_LEVELS.join(', ')}`);
    }

    // Validate structure type
    if (!VALIDATION_RULES.STRUCTURE_TYPES.includes(params.structureType)) {
      errors.push(`Structure type must be one of: ${VALIDATION_RULES.STRUCTURE_TYPES.join(', ')}`);
    }

    // Validate compliance requirement
    if (!VALIDATION_RULES.COMPLIANCE_REQUIREMENTS.includes(params.complianceRequirement)) {
      errors.push(`Compliance requirement must be one of: ${VALIDATION_RULES.COMPLIANCE_REQUIREMENTS.join(', ')}`);
    }

    return errors;
  }

  /**
   * Determine the appropriate arrester type based on parameters
   */
  private determineArresterType(params: CalculationParameters): string {
    // Default to the recommendation based on structure type
    switch (params.structureType) {
      case 'home':
        return STRUCTURE_RECOMMENDATIONS.HOME.arresterType;
      case 'tower':
        return STRUCTURE_RECOMMENDATIONS.TOWER.arresterType;
      case 'industry':
        return STRUCTURE_RECOMMENDATIONS.INDUSTRY.arresterType;
      case 'traction':
        return STRUCTURE_RECOMMENDATIONS.TRACTION.arresterType;
      case 'highrise':
        return STRUCTURE_RECOMMENDATIONS.HIGHRISE.arresterType; // ESE for high-rise
      default:
        return 'mov'; // Default to MOV for unknown structure types
    }
  }

  /**
   * Calculate recommended arrester rating based on system voltage
   */
  private calculateRecommendedRating(systemVoltage: number, arresterType: string, params: CalculationParameters): number {
    // According to IEC 60099-4, the rated voltage should be selected based on the system's highest RMS voltage
    // For AC systems, the rated voltage is typically 1.2 to 1.5 times the system voltage
    let multiplier = 1.2;

    // High-rise buildings require higher safety margin
    if (params.structureType === 'highrise') {
      multiplier = HIGHRISE_SPECIFIC.VOLTAGE_MULTIPLIER; // 1.35 for high-rise
    } else {
      // Adjust multiplier based on arrester type
      switch (arresterType) {
        case 'mov':
          multiplier = 1.25; // MOV arresters typically use 1.25x multiplier
          break;
        case 'ese':
          multiplier = 1.3; // ESE arresters may require slightly higher rating
          break;
        case 'conventional':
          multiplier = 1.2; // Conventional arresters typically use 1.2x multiplier
          break;
        default:
          multiplier = 1.25; // Default to MOV multiplier
      }
    }

    // Calculate base rating
    let rating = systemVoltage * multiplier;

    // Apply altitude correction if above 1000m
    if (params.environmentalConditions?.altitude > ALTITUDE_DERATING.BASE_ALTITUDE) {
      const altitudeDiff = params.environmentalConditions.altitude - ALTITUDE_DERATING.BASE_ALTITUDE;
      
      // High-rise buildings use enhanced altitude derating
      const deratingRate = params.structureType === 'highrise' 
        ? HIGHRISE_SPECIFIC.ALTITUDE_DERATING_ENHANCED 
        : ALTITUDE_DERATING.DERATING_PER_100M;
      
      const altitudeCorrection = 1 + (altitudeDiff / 100) * deratingRate;
      rating = rating * altitudeCorrection;
    }

    // Apply pollution level correction
    let pollutionFactor: number;
    if (params.structureType === 'highrise') {
      // High-rise buildings have increased pollution accumulation at height
      const highrisePollution = HIGHRISE_POLLUTION_FACTORS[params.environmentalConditions?.pollutionLevel.toUpperCase() as keyof typeof HIGHRISE_POLLUTION_FACTORS];
      pollutionFactor = highrisePollution?.creepageDistanceFactor || 1.0;
    } else {
      const standardPollution = POLLUTION_LEVELS[params.environmentalConditions?.pollutionLevel.toUpperCase() as keyof typeof POLLUTION_LEVELS];
      pollutionFactor = standardPollution?.creepageDistanceFactor || 1.0;
    }
    rating = rating * pollutionFactor;

    // Apply wind load factor for high-rise buildings
    if (params.structureType === 'highrise' && params.buildingHeight && params.buildingHeight > HIGHRISE_SPECIFIC.MIN_HEIGHT_METERS) {
      const heightAboveThreshold = params.buildingHeight - HIGHRISE_SPECIFIC.MIN_HEIGHT_METERS;
      const windLoadFactor = 1.0 + (heightAboveThreshold * HIGHRISE_SPECIFIC.WIND_LOAD_FACTOR_PER_M);
      rating = rating * windLoadFactor;
    }

    // Round to standard voltage class
    return this.findClosestStandardRating(rating);
  }

  /**
   * Find the closest standard arrester rating to the calculated value
   */
  private findClosestStandardRating(calculatedRating: number): number {
    // Standard voltage classes for arresters (based on IEC 60099-4)
    const standardRatings = [3.6, 7.2, 12, 17, 24, 36, 52, 72.5, 96, 126, 145, 169, 200, 242, 300, 362, 420, 550, 800];

    // Find the closest standard rating that is equal to or greater than the calculated rating
    return standardRatings.find(rating => rating >= calculatedRating) || standardRatings[standardRatings.length - 1];
  }

  /**
   * Perform compliance checks against IEC and NEC standards
   */
  private performComplianceChecks(params: CalculationParameters, calculatedRating: number, arresterType: string): ComplianceResult[] {
    const complianceResults: ComplianceResult[] = [];

    // IEC 60099-4: Check lightning impulse residual voltage
    const residualVoltage = this.calculateResidualVoltage(params.systemVoltage, calculatedRating);
    const requiredResidualVoltage = params.systemVoltage * IEC_60099_4.RESIDUAL_VOLTAGE_FACTOR;

    complianceResults.push({
      standard: IEC_60099_4.STANDARD_NAME,
      requirement: 'residual_voltage',
      requiredValue: requiredResidualVoltage,
      calculatedValue: residualVoltage,
      unit: 'kV',
      compliant: residualVoltage <= requiredResidualVoltage,
      details: `Calculated residual voltage ${residualVoltage.toFixed(2)}kV should be ≤ ${requiredResidualVoltage.toFixed(2)}kV`
    });

    // IEC 60099-4: Check power frequency withstand voltage
    const withstandVoltage = this.calculateWithstandVoltage(params.systemVoltage, arresterType);
    const requiredWithstandVoltage = params.systemVoltage * WITHSTAND_VOLTAGE_RATIOS[arresterType.toUpperCase() as keyof typeof WITHSTAND_VOLTAGE_RATIOS] ||
                                    WITHSTAND_VOLTAGE_RATIOS.MOV; // Default to MOV ratio

    complianceResults.push({
      standard: IEC_60099_4.STANDARD_NAME,
      requirement: 'withstand_voltage',
      requiredValue: requiredWithstandVoltage,
      calculatedValue: withstandVoltage,
      unit: 'kV',
      compliant: withstandVoltage >= requiredWithstandVoltage,
      details: `Withstand voltage ${withstandVoltage.toFixed(2)}kV should be ≥ ${requiredWithstandVoltage.toFixed(2)}kV`
    });

    // IEC 60099-4: Check temporary overvoltage (TOV) withstand capability
    const tovCapability = this.calculateTOVCapability(params.systemVoltage);
    const requiredTOV = params.systemVoltage * 1.1; // Typically 10% above system voltage for 10 seconds

    complianceResults.push({
      standard: IEC_60099_4.STANDARD_NAME,
      requirement: 'tov',
      requiredValue: requiredTOV,
      calculatedValue: tovCapability,
      unit: 'kV',
      compliant: tovCapability >= requiredTOV,
      details: `TOV capability ${tovCapability.toFixed(2)}kV should be ≥ ${requiredTOV.toFixed(2)}kV for 10 seconds`
    });

    // IEC 60099-4: Check cantilever strength (for rod-type arresters)
    if (params.structureType === 'tower' || params.structureType === 'home' || params.structureType === 'highrise') {
      const cantileverStrength = this.calculateCantileverStrength(params);
      // High-rise buildings require higher cantilever strength (1000 kg vs 500 kg)
      const requiredCantileverStrength = params.structureType === 'highrise' 
        ? HIGHRISE_SPECIFIC.BASE_CANTILEVER_KG 
        : 500;

      complianceResults.push({
        standard: IEC_60099_4.STANDARD_NAME,
        requirement: 'cantilever_strength',
        requiredValue: requiredCantileverStrength,
        calculatedValue: cantileverStrength,
        unit: 'kg',
        compliant: cantileverStrength >= requiredCantileverStrength,
        details: `Cantilever strength ${cantileverStrength}kg should be ≥ ${requiredCantileverStrength}kg`
      });
    }

    // IEC 62305-2: High-rise specific wind load compliance
    if (params.structureType === 'highrise' && params.buildingHeight) {
      const windLoadFactor = this.calculateWindLoadFactor(params.buildingHeight);
      const requiredWindLoadFactor = 1.0; // Minimum factor

      complianceResults.push({
        standard: 'IEC 62305-2:2010',
        requirement: 'wind_load_factor',
        requiredValue: requiredWindLoadFactor,
        calculatedValue: windLoadFactor,
        unit: 'factor',
        compliant: windLoadFactor >= requiredWindLoadFactor,
        details: `Wind load factor ${windLoadFactor.toFixed(2)} (building height: ${params.buildingHeight}m)`
      });
    }

    // NEC 2020/2023: Check compliance with installation requirements
    const necCompliance = params.complianceRequirement === 'type1' || params.complianceRequirement === 'type2';

    complianceResults.push({
      standard: NEC_STANDARDS.STANDARD_NAME,
      requirement: 'spdtype_compliance',
      requiredValue: 1, // Binary check - compliant or not
      calculatedValue: necCompliance ? 1 : 0,
      unit: '',
      compliant: necCompliance,
      details: `SPD type (${params.complianceRequirement}) must be Type 1 or Type 2 as per NEC requirements`
    });

    return complianceResults;
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
   * Calculate withstand voltage based on system voltage and arrester type
   */
  private calculateWithstandVoltage(systemVoltage: number, arresterType: string): number {
    // Use the appropriate ratio based on arrester type
    const ratioKey = arresterType.toUpperCase() as keyof typeof WITHSTAND_VOLTAGE_RATIOS;
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
  private calculateCantileverStrength(params: CalculationParameters): number {
    // High-rise buildings require higher cantilever strength (1000 kg minimum)
    if (params.structureType === 'highrise') {
      // Apply wind load factor for high-rise
      if (params.buildingHeight && params.buildingHeight > HIGHRISE_SPECIFIC.MIN_HEIGHT_METERS) {
        const windLoadFactor = this.calculateWindLoadFactor(params.buildingHeight);
        return HIGHRISE_SPECIFIC.BASE_CANTILEVER_KG * windLoadFactor;
      }
      return HIGHRISE_SPECIFIC.BASE_CANTILEVER_KG; // 1000 kg
    }
    
    // Standard structures require 500 kg minimum
    return 500; // kg
  }

  /**
   * Calculate wind load factor for high-rise buildings per ASCE 7-16
   */
  private calculateWindLoadFactor(buildingHeight: number): number {
    if (buildingHeight <= HIGHRISE_SPECIFIC.MIN_HEIGHT_METERS) {
      return 1.0;
    }
    const heightAboveThreshold = buildingHeight - HIGHRISE_SPECIFIC.MIN_HEIGHT_METERS;
    return 1.0 + (heightAboveThreshold * HIGHRISE_SPECIFIC.WIND_LOAD_FACTOR_PER_M);
  }

  /**
   * Generate installation recommendation based on compliance requirement
   */
  private generateInstallationRecommendation(complianceRequirement: string): string {
    if (complianceRequirement === 'type1') {
      return 'Line side of service disconnect per NEC requirements';
    } else if (complianceRequirement === 'type2') {
      return 'Load side of service disconnect per NEC requirements';
    } else {
      return 'Installation location based on electrical inspection and NEC Article 285';
    }
  }

  /**
   * Generate warnings based on parameters and compliance results
   */
  private generateWarnings(params: CalculationParameters, complianceResults: ComplianceResult[]): string[] {
    const warnings: string[] = [];

    // Check if any compliance check failed
    const nonCompliantChecks = complianceResults.filter(result => !result.compliant);
    if (nonCompliantChecks.length > 0) {
      warnings.push(`The selected arrester does not meet all compliance requirements. Please review: ${nonCompliantChecks.map(c => c.requirement).join(', ')}`);
    }

    // Check for unusual voltage values
    if (params.systemVoltage > 35) {
      warnings.push('High system voltage detected (>35kV). Verify arrester selection with manufacturer specifications.');
    }

    // Check for high altitude
    if (params.environmentalConditions.altitude > 1500) {
      warnings.push('High altitude detected (>1500m). Specialized arresters may be required.');
    }

    // Check for heavy pollution
    if (params.environmentalConditions.pollutionLevel === 'heavy') {
      warnings.push('Heavy pollution conditions detected. Increased maintenance intervals may be required.');
    }

    // High-rise specific warnings
    if (params.structureType === 'highrise') {
      // Side flash protection warning for buildings >60m
      if (params.buildingHeight && params.buildingHeight > HIGHRISE_SPECIFIC.SIDE_FLASH_HEIGHT) {
        warnings.push(`SIDE FLASH RISK: Building height (${params.buildingHeight}m) exceeds ${HIGHRISE_SPECIFIC.SIDE_FLASH_HEIGHT}m threshold. Additional side flash protection required per IEC 62305-3.`);
      }
      
      // High-rise cantilever strength warning
      if (params.buildingHeight && params.buildingHeight > HIGHRISE_SPECIFIC.MIN_HEIGHT_METERS) {
        const windLoadFactor = this.calculateWindLoadFactor(params.buildingHeight);
        if (windLoadFactor > 1.5) {
          warnings.push(`HIGH WIND LOAD: Wind load factor ${windLoadFactor.toFixed(2)}x. Verify arrester mounting specifications.`);
        }
      }
    }

    return warnings;
  }
}