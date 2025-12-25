<!--
Sync Impact Report:
Version Change: NEW → 1.0.0
New Constitution Created: 2025-12-24
Modified Principles: None (initial creation)
Added Sections:
  - Core Principles (7 principles)
  - Engineering Standards Compliance
  - Development Workflow
  - Governance
Templates Requiring Updates:
  ✅ constitution.md (this file)
  ⚠ plan-template.md (should reference calculation accuracy validation)
  ⚠ tasks-template.md (should include standards compliance verification tasks)
  ⚠ spec-template.md (already aligned with constitution principles)
Follow-up TODOs: None
-->

# ElectroMate Constitution

## Core Principles

### I. Calculation Accuracy (NON-NEGOTIABLE)

All electrical engineering calculations MUST match published standards within specified tolerances:
- Battery backup time: IEEE 485 methodology within 2% accuracy
- Voltage drop: IEEE/IEC standard tables within 0.1% accuracy
- Cable ampacity: 100% compliance with NEC Table 310.15(B)(16) and IEC 60364-5-52
- UPS sizing: Diversity factors per IEEE 1100 (Emerald Book) and IEC 62040
- Solar array sizing: NREL standards for temperature derating and soiling losses

**Rationale**: Engineers rely on calculation tools for professional work submitted to approval authorities and clients. Inaccurate calculations cause equipment malfunction, safety hazards, code violations, and professional liability. This principle is non-negotiable because human safety and regulatory compliance depend on calculation precision.

**Validation**: Every calculation formula MUST be validated against published test cases from applicable standards before implementation. Automated tests MUST verify accuracy thresholds are met.

### II. Safety-First Validation

System MUST actively identify and warn users of dangerous or code-violating conditions:
- Flag discharge rates >1C for VRLA batteries as dangerous
- Highlight voltage drops >3% in red (conservative NEC/IEC limit for all circuits)
- Warn when voltage drops exceed 10% (physically dangerous)
- Alert when efficiency values exceed 100% (impossible)
- Warn when cable ampacity is exceeded after derating factors applied
- Alert when solar array V_oc exceeds charge controller ratings

**Rationale**: Electrical systems carry life-safety risks. Fire, electrocution, and equipment damage result from design errors. Engineers may make input errors or overlook constraints. The system has a professional responsibility to prevent dangerous designs from being generated without explicit warnings.

**Implementation**: Validation MUST occur in real-time as users modify inputs (within 100ms per SC-002). Warnings MUST be visually distinct (red highlighting) and include explanatory text with code references.

### III. Standards Compliance and Traceability

Every calculation MUST reference applicable standards and display references in results:
- IEC 60364 (Electrical Installations)
- IEEE 485 (Battery Sizing)
- IEEE 1100 (Emerald Book - Power Quality)
- BS 7671 (Cable Sizing - UK/Commonwealth)
- NEC (National Electrical Code - North America)
- IEC 62040 (UPS Standards)
- NREL (Solar/Renewable Energy Standards)

System MUST clearly label which standard version applies to each calculation (e.g., "NEC 2020"). PDF reports MUST include standard references with section numbers where formulas are derived.

**Rationale**: Engineers work under multiple jurisdictions with different code requirements. Authority Having Jurisdiction (AHJ) approval depends on demonstrating standards compliance. Traceability enables engineers to verify methodology and defend designs during review processes.

### IV. Dual Standards Support (IEC/SI and NEC/North American)

System MUST support both international and North American electrical standards and unit systems:
- Unit toggle: IEC/SI (mm², meters, kW) ↔ North American (AWG, feet, HP)
- Voltage systems: Both LV AC (120V-600V), MV (2.4kV-13.8kV), and DC (12V-1500V)
- Cable tables: Both IEC 60364-5-52 and NEC Table 310.15(B)(16) ampacity data
- Automatic unit conversion with maintained accuracy across systems

**Rationale**: Electrical engineering is practiced globally with different regional standards. Engineers often work on international projects requiring both IEC (European/international) and NEC (North American) compliance. Supporting both expands market reach and enables engineers to work seamlessly across jurisdictions.

**Constraint**: Unit conversion MUST preserve calculation accuracy (SC-015). Display precision appropriate to engineering practice (e.g., voltage drop to 0.01%, backup time to 0.01 hours).

### V. Test-First Development for Critical Calculations

All calculation logic MUST follow Test-Driven Development (TDD):
1. Write test cases based on published standard examples
2. User approval of test cases (verify test scenarios match real-world usage)
3. Tests MUST fail initially (Red)
4. Implement calculation logic to pass tests (Green)
5. Refactor for performance/clarity while maintaining test passage

**NON-NEGOTIABLE** for all P1 calculations (Battery, UPS, Cable Sizing). Recommended for P2/P3 features.

**Rationale**: Calculation errors have serious safety and professional consequences. TDD ensures calculations are validated against known-correct results from standards bodies before deployment. Test cases serve as living documentation of expected behavior and prevent regression when formulas are modified.

**Test Coverage Requirements**:
- Nominal cases (typical input values)
- Boundary cases (min/max valid inputs)
- Edge cases (zero values, very small/large numbers)
- Error cases (negative values, impossible conditions)

### VI. Professional Documentation and Exportability

Every calculation tool MUST provide PDF export functionality suitable for professional submission:
- Include all input parameters with units clearly labeled
- Display formulas used with variable definitions
- Show intermediate calculation steps where helpful for verification
- Include standard references (e.g., "per IEEE 485 Section 4.2.1")
- Add calculation timestamp and system version
- Include disclaimer: "Calculations for informational purposes; PE stamp/certification is user's responsibility"

PDF reports MUST render correctly (95% success rate per SC-003) across Chrome, Firefox, Safari, and Edge browsers.

**Rationale**: Engineers submit calculations to clients, approval authorities, and project documentation. Professional formatting with traceability is essential for credibility and regulatory compliance. Calculations without documentation have limited professional value.

### VII. Progressive Enhancement and Incremental Value

Feature development MUST follow prioritized delivery:
- **P1 (Core Tools)**: Battery Backup Calculator, UPS Sizing, Voltage Drop/Cable Sizing - independently testable, deliver immediate value
- **P2 (Expansion)**: Solar Array Sizing, Charge Controller Selection - extend market reach
- **P3 (Decision Support)**: Battery Type Comparison - enhance existing tools

Each user story MUST be independently deployable and testable. No feature should depend on incomplete features from later priorities.

**Rationale**: Incremental delivery enables early user feedback, reduces risk of building unwanted features, and provides value faster to users. P1 tools address the most common engineering calculations (highest impact). P2/P3 expand capabilities after core platform validation.

## Engineering Standards Compliance

### Calculation Formula Verification

Before implementing any calculation:
1. Identify applicable standard (IEEE, IEC, NEC, BS, NREL)
2. Document standard version and section number
3. Extract formula from standard with variable definitions
4. Create test cases from standard examples or published solutions
5. Implement formula using Math.js for high-precision arithmetic
6. Validate results match test cases within specified tolerance
7. Document any assumptions (e.g., "power factor defaults to 0.8 per IEC 62040")

### Derating Factor Application

Cable sizing MUST apply derating factors correctly:
- Installation method (conduit, cable tray, direct burial, free air)
- Ambient temperature adjustments per NEC 310.15(B)(2)(a) or IEC 60364-5-52 Table B.52.14
- Grouping/bundling factors where multiple cables share conduit
- Altitude corrections for installations >2000m elevation (if applicable)

Display derating calculations in "Show Details" mode for user verification.

### Conservative Defaults

When standards allow ranges or user discretion, default to conservative (safe) values:
- Voltage drop limit: 3% (suitable for lighting and power, conservative)
- Battery aging factor: 0.8 (20% capacity reduction, industry standard)
- Power factor: 0.8 (typical for inductive loads)
- Ambient temperature: 30°C (86°F) unless user specifies otherwise
- UPS diversity factor: Calculated per IEEE 1100, no manual override to prevent unsafe reductions

**Exception**: Allow user adjustment where engineering judgment is appropriate (e.g., battery aging factor varies by technology and usage).

## Development Workflow

### Specification-Driven Development (SDD)

All features MUST follow SDD workflow:
1. `/sp.specify` - Create feature specification with user stories and acceptance criteria
2. `/sp.clarify` - Resolve ambiguities through targeted questions (max 5 questions)
3. `/sp.plan` - Design technical architecture and implementation approach
4. `/sp.tasks` - Generate testable task breakdown with test cases
5. Implementation - Red-Green-Refactor cycles for each task
6. `/sp.commit_pr` - Create PR with descriptive commit messages

### Architecture Decision Records (ADRs)

Document significant architectural decisions during planning:
- **Trigger**: When decision has long-term consequences, multiple viable alternatives exist, and influences system design cross-cuttingly
- **Process**: Suggest ADR to user ("📋 Architectural decision detected: <brief> — Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`")
- **Content**: Context, decision, alternatives considered, rationale, consequences
- **Storage**: `history/adr/` directory with sequential numbering

**Examples requiring ADRs**:
- Choice of calculation engine (Math.js vs native JavaScript arithmetic)
- Authentication strategy (BetterAuth vs alternatives)
- Database selection (Neon PostgreSQL vs alternatives)
- PDF generation approach (jsPDF vs server-side generation)

### Prompt History Records (PHRs)

MUST create PHR after every user interaction:
- Stage detection (constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general)
- Route to appropriate directory: `history/prompts/constitution/`, `history/prompts/<feature-name>/`, or `history/prompts/general/`
- Include full verbatim user input (PROMPT_TEXT)
- Include representative assistant output (RESPONSE_TEXT)
- Document files modified, tests run, outcome, and next steps
- Validate no unresolved placeholders remain

PHRs provide traceability, learning feedback, and project history documentation.

### Code Quality Standards

- **No hardcoded secrets**: Use environment variables and `.env` files
- **Smallest viable diff**: Avoid refactoring unrelated code in feature PRs
- **Code references**: Cite file:line for existing code discussions
- **Error handling**: Validate inputs, handle edge cases, provide user-friendly error messages
- **Accessibility**: Follow WCAG 2.1 Level AA standards for UI components
- **Responsive design**: Optimize for desktop and tablet (mobile-native apps out of scope)

### Security Requirements

- **Input validation**: All numerical inputs MUST be validated (positive, non-zero, within physical limits)
- **Authentication**: BetterAuth integration for registered users following best practices
- **Data retention**: 2-year retention for registered users with 30-day deletion warning
- **Database security**: Neon PostgreSQL handles backups and disaster recovery
- **No PII exposure**: Calculation data does not contain personally identifiable information
- **HTTPS required**: Production deployment MUST use encrypted connections

## Governance

This constitution supersedes all other development practices and preferences. All code reviews, feature designs, and implementations MUST verify compliance with constitutional principles.

### Amendment Process

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: Assess which templates/artifacts require updates for consistency
3. **Version Bump**: Apply semantic versioning (MAJOR.MINOR.PATCH)
   - **MAJOR**: Backward incompatible governance changes or principle removals
   - **MINOR**: New principles added or material expansions
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements
4. **Propagation**: Update dependent templates and documentation
5. **Approval**: Document approval and ratification date
6. **Migration**: Create migration plan if existing code affected

### Compliance Verification

Every pull request MUST include constitution compliance checklist:
- [ ] Calculation accuracy validated against standards
- [ ] Safety warnings implemented for dangerous conditions
- [ ] Standard references included in calculation outputs
- [ ] Unit conversion accuracy preserved
- [ ] Test-first development followed for calculation logic
- [ ] PDF export functionality provided
- [ ] Progressive enhancement principle respected (P1 before P2/P3)

### Complexity Justification

Complexity MUST be justified:
- Performance optimization: Show benchmarks proving necessity
- Abstraction layers: Demonstrate reuse across ≥3 locations
- External dependencies: Justify why standard library insufficient
- Design patterns: Explain problem solved that simpler approach cannot

**Principle**: Prefer boring, obvious code over clever, complex code.

### Runtime Development Guidance

Refer to `CLAUDE.md` for agent-specific development guidance including:
- PHR creation procedures
- ADR suggestion triggers
- Human-as-tool strategy (when to ask clarifying questions)
- Default policies (clarify first, smallest viable diff, no hardcoded secrets)
- Execution contract for every request

**Version**: 1.0.0 | **Ratified**: 2025-12-24 | **Last Amended**: 2025-12-24
