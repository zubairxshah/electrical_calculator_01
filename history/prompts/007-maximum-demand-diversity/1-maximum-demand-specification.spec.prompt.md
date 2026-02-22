---
id: 1
title: maximum-demand-diversity-specification
stage: spec
date: 2026-02-22
surface: agent
model: claude-opus-4-0-20240408
feature: 007-maximum-demand-diversity
branch: main
user: user
command: /sp.specify
labels: ["specification", "maximum-demand", "diversity", "IEC", "NEC", "load-calculation"]
link_spec: "specs/007-maximum-demand-diversity/spec.md"
link_plan: null
link_tasks: null
link_ticket: null
link_adr: null
link_pr: null
files_yaml:
  - "specs/007-maximum-demand-diversity/spec.md"
tests_yaml: []
outcome: "Successfully created comprehensive specification for Maximum Demand & Diversity Calculator feature with IEC 60364 and NEC Article 220 compliance."
evaluation: "Specification includes complete user stories, standards references, data models, API contracts, practical examples, and UI designs following project constitution requirements."
---

# Prompt

Implement a professional-grade Maximum Demand & Diversity Calculator for ElectroMate web application. The feature must:

1. **Load Calculation Engine**
   - Calculate total connected load
   - Apply demand/diversity factors based on project type (Residential, Commercial, Industrial)
   - Comply with IEC 60364 and NEC Article 220

2. **Standards Compliance**
   - IEC diversity factors for residential lighting, socket outlets, HVAC, cooking
   - NEC demand factors for dwelling units, commercial, industrial
   - Validation checks for code compliance

3. **User Interface**
   - Project type selection (dropdown)
   - Load category inputs (kW/kVA)
   - Output: connected load, demand factor, maximum demand, compliance notes

4. **Practical Example**
   - Residential: Lighting 10kW, Sockets 15kW, HVAC 20kW, Cooking 8kW
   - IEC factors: Lighting 100%, Sockets 40%, HVAC 80%, Cooking 70%
   - Expected: Connected 53kW, Demand 36.6kW

5. **Technical Implementation**
   - Next.js/React frontend (matching existing app architecture)
   - TypeScript for type safety
   - Math.js for precision calculations
   - PDF export with compliance references
   - Project save/load functionality

6. **Extra Features**
   - PDF export
   - Dark/light mode
   - Role-based access preparation

# Response

## Specification Complete

Successfully created comprehensive specification for Maximum Demand & Diversity Calculator:

### Created Artifacts:
1. **specs/007-maximum-demand-diversity/spec.md**: Complete feature specification

### Key Features Specified:
- **User Stories**: 5 stories (3 core calculation + PDF + save/load)
- **Standards**: IEC 60364-5-52, NEC Article 220 (220.12, 220.42, 220.44, 220.50, 220.55, 220.82)
- **Project Types**: Residential, Commercial, Industrial with specific factors for each
- **Data Models**: DemandCalculationParameters, DemandCalculationResult, CategoryResult, ComplianceCheck
- **API Endpoints**: 6 REST endpoints for calculation, storage, and reporting
- **UI Design**: Input form and results display layouts

### Standards Compliance Matrix:
| Standard | Clause | Application |
|----------|--------|-------------|
| IEC 60364-5-52 | 524 | Cable sizing basis |
| NEC 220.42 | - | Dwelling lighting demand |
| NEC 220.44 | - | Receptacle demand |
| NEC 220.55 | - | Cooking equipment |
| NEC 220.82 | - | Optional dwelling calc |

### Practical Examples Included:
1. Residential IEC: 59kW connected → 43.6kW demand
2. Residential NEC Optional: 65kW connected → 53kW demand
3. Commercial Office: 200kW connected → 211.9kW demand

### Next Steps:
1. Create implementation plan (`/sp.plan`)
2. Generate task breakdown (`/sp.tasks`)
3. Implement following existing patterns (lightning-arrester, circuit-breaker)
