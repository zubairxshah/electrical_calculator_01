import { DemandCalculationParameters } from './DemandCalculationParameters';

/**
 * Result of a maximum demand calculation
 */
export interface DemandCalculationResult {
  // Summary
  totalConnectedLoad: number; // kW
  maximumDemand: number; // kW
  overallDiversityFactor: number; // 0-1 (1 = no diversity, 0 = 100% diversity)
  powerFactor?: number; // Calculated or assumed power factor
  
  // By category breakdown
  categoryBreakdown: CategoryResult[];
  
  // Compliance checks
  complianceChecks: ComplianceCheck[];
  
  // Recommendations
  recommendedServiceSize?: number; // Amperes
  recommendedBreakerSize?: number; // Amperes
  recommendedCableSize?: string; // AWG or mm²
  
  // Metadata
  calculationTimestamp: Date;
  standardUsed: string;
  warnings: string[];
}

/**
 * Result for a single load category
 */
export interface CategoryResult {
  category: string;
  connectedLoad: number; // kW
  appliedFactor: number; // 0-1 (diversity/demand factor)
  demandLoad: number; // kW (after factor applied)
  standardReference: string; // e.g., "IEC 60364-5-52" or "NEC 220.42"
  notes?: string;
}

/**
 * Compliance check result
 */
export interface ComplianceCheck {
  standard: string; // e.g., "IEC 60364-5-52" or "NEC Article 220"
  clause: string; // Specific clause reference
  requirement: string; // What is being checked
  compliant: boolean; // Whether requirement is met
  details: string; // Additional details
}

/**
 * Project data for saving/loading calculations
 */
export interface ProjectData {
  id?: string; // UUID for saved projects
  userId?: string; // Owner's user ID
  projectName: string;
  createdAt?: Date;
  updatedAt?: Date;
  parameters: DemandCalculationParameters;
  result: DemandCalculationResult;
}

/**
 * Project summary for list view
 */
export interface ProjectSummary {
  id: string;
  projectName: string;
  projectType: string;
  standard: string;
  totalConnectedLoad: number;
  maximumDemand: number;
  createdAt: Date;
}
