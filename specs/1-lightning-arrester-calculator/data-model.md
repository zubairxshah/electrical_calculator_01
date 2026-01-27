# Data Model: Lightning Arrester Calculator

## Entities

### CalculationParameters
- **systemVoltage** (number): Input voltage in kV
- **structureType** (string): Enum of ['home', 'tower', 'industry', 'traction']
- **environmentalConditions** (object):
  - humidity (number): Percentage 0-100%
  - pollutionLevel (string): Enum of ['light', 'medium', 'heavy']
  - altitude (number): Meters above sea level
- **complianceRequirement** (string): Enum of ['type1', 'type2'] for SPD classification
- **arresterRating** (number): Rated voltage in kV
- **installationLocation** (string): Location description

### ArresterType
- **id** (string): Unique identifier
- **name** (string): Enum of ['conventional', 'ese', 'mov']
- **material** (string): Construction material
- **useCase** (string): Primary application
- **characteristics** (object): Physical and electrical properties

### ComplianceStandard
- **id** (string): Standard identifier (e.g., 'IEC 60099-4', 'NEC 2020')
- **name** (string): Full standard name
- **version** (string): Version number
- **requirements** (object): Specific requirements for this standard

### TestParameter
- **type** (string): Enum of ['residual_voltage', 'withstand_voltage', 'tov', 'cantilever_strength']
- **standardValue** (number): Required value per standard
- **calculatedValue** (number): Calculated value
- **unit** (string): Measurement unit
- **complianceStatus** (boolean): Whether requirement is met

### CalculationResult
- **arresterType** (string): Recommended arrester type
- **rating** (number): Recommended rating in kV
- **complianceResults** (object[]): Array of compliance checks
- **installationRecommendation** (string): Installation location advice
- **warnings** (string[]): Any warnings or cautions
- **calculationTimestamp** (datetime): When calculation was performed

### ReportData
- **inputParameters** (CalculationParameters): Original input values
- **results** (CalculationResult): Calculation results
- **standardsReferences** (ComplianceStandard[]): Standards used
- **calculationSteps** (string[]): Detailed calculation steps
- **disclaimer** (string): Professional disclaimer text

## Relationships
- CalculationParameters has one CalculationResult
- CalculationResult has many TestParameter (complianceResults)
- CalculationResult references many ComplianceStandard
- ReportData contains CalculationParameters and CalculationResult

## Validation Rules
- systemVoltage: Positive number, typically 0.23kV to 36kV range
- environmentalConditions.humidity: Between 0 and 100
- environmentalConditions.altitude: Maximum 2000m
- arresterRating: Positive number, within standard ranges for selected type
- complianceResults: Each must have a valid complianceStatus

## State Transitions
- Input State: Parameters entered but not calculated
- Processing State: Calculation in progress
- Result State: Calculation complete with results
- Report State: PDF report generated