# Lightning Arrester Calculator

This feature implements a standards-compliant calculator for selecting appropriate lightning protection devices based on IEC 60099-4 and NEC 2020/2023 requirements.

## Overview

The Lightning Arrester Calculator enables electrical engineers to:
- Determine appropriate lightning arrester type and specifications
- Validate selections against IEC 60099-4 and NEC 2020/2023 standards
- Generate PDF reports for professional documentation
- Receive scenario-based recommendations for different structure types

## Features

- **Arrester Type Support**: Conventional (rod), Early Streamer Emission (ESE), and Metal-Oxide Varistor (MOV)
- **Standards Compliance**: Validation against IEC 60099-4 and NEC 2020/2023 requirements
- **Environmental Factors**: Humidity, pollution level, and altitude considerations
- **Structure-Based Recommendations**: Tailored suggestions for homes, towers, industrial facilities, and traction systems
- **Professional Reports**: PDF export with all input parameters, calculations, and compliance verification

## Technical Architecture

### Components
- `CalculatorForm`: Input form with real-time validation
- `ResultsDisplay`: Shows recommended arrester and compliance status
- `ComplianceBadge`: Visual indicator for IEC/NEC compliance
- `ReportPreview`: Previews PDF report before generation

### Services
- `calculationEngine`: Core calculation logic based on IEC 60099-4 formulas
- `validation`: Input parameter validation and warnings
- `standardsCompliance`: IEC/NEC compliance checking
- `pdfGenerator`: PDF report generation

### Models
- `LightningArrester`: Arrester type definitions
- `CalculationParameters`: Input parameters structure
- `ComplianceResult`: Compliance validation results

## API Endpoints

- `POST /api/lightning-arrester/calculate`: Calculate recommended arrester
- `POST /api/lightning-arrester/generate-report`: Generate PDF report

## Standards Compliance

- **IEC 60099-4:2018**: Surge arresters for AC systems
- **NEC 2020/2023**: National Electrical Code requirements
- **Precision Calculations**: Using Math.js for high-precision arithmetic

## Testing

Unit and integration tests are located in `src/services/lightning-arrester/__tests__/` covering:
- Calculation engine accuracy
- Input validation
- Standards compliance checking
- PDF generation
- End-to-end workflows

## Usage

Access the calculator at `/lightning-arrester` in the application.

## Implementation Details

The calculator follows these key principles:
- Calculation accuracy validated against published standards
- Safety-first validation for dangerous conditions
- Professional documentation with PDF export capability
- Standards compliance and traceability
- Progressive enhancement with prioritized feature delivery