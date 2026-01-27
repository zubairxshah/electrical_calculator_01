# Quickstart Guide: Lightning Arrester Calculator

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Setup Instructions

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open the application**:
   Navigate to `http://localhost:3000` in your browser

## Using the Lightning Arrester Calculator

1. **Navigate to the calculator**:
   - Go to the "Lightning Protection" section
   - Select "Lightning Arrester Calculator"

2. **Enter system parameters**:
   - System voltage (kV)
   - Structure type (home, tower, industry, traction)
   - Environmental conditions (humidity, pollution level, altitude)

3. **Select compliance requirements**:
   - Choose applicable standard (IEC 60099-4 or NEC 2020/2023)
   - Select SPD type (Type 1 or Type 2)

4. **View results**:
   - Recommended arrester type and rating
   - Compliance status indicators
   - Installation recommendations

5. **Generate report**:
   - Click "Export PDF Report" to generate professional documentation
   - The PDF will include all inputs, calculations, and compliance status

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run lint` - Run linter
- `npm run type-check` - Run TypeScript checker

## Key Files for Modification

- `src/components/lightning-arrester/CalculatorForm.tsx` - Main calculator UI
- `src/services/lightning-arrester/calculationEngine.ts` - Core calculation logic
- `src/services/lightning-arrester/pdfGenerator.ts` - PDF report generation
- `src/models/LightningArrester.ts` - Data models
- `tests/unit/lightning-arrester/calculations.test.ts` - Calculation tests