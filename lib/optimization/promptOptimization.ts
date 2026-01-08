/**
 * Prompt Engineering Utilities
 *
 * Token-efficient prompting strategies for LLM interactions in ElectroMate.
 * Designed to minimize token consumption while maintaining accuracy.
 *
 * Strategies:
 * 1. **Structured Output** - Use JSON schema to enforce deterministic responses
 * 2. **Few-Shot Examples** - Provide examples inline to avoid separate API calls
 * 3. **Role Definition** - Establish expert role to guide output quality
 * 4. **Constraint Specification** - Explicit boundaries reduce correction loops
 * 5. **Output Format** - Specify exact format to avoid reformatting
 *
 * @module PromptOptimization
 */

/**
 * Structured prompt builder for electrical calculations
 *
 * Combines system role, constraints, and examples into an optimized prompt.
 * Reduces back-and-forth by being explicit about format and expectations.
 */
export class StructuredPromptBuilder {
  private role: string = '';
  private constraints: string[] = [];
  private examples: Array<{ input: string; output: string }> = [];
  private outputSchema: string = '';
  private task: string = '';

  /**
   * Set expert role for the LLM
   */
  withRole(role: string): this {
    this.role = role;
    return this;
  }

  /**
   * Add constraint (hard requirement)
   */
  addConstraint(constraint: string): this {
    this.constraints.push(`- ${constraint}`);
    return this;
  }

  /**
   * Add few-shot example
   */
  addExample(input: string, output: string): this {
    this.examples.push({ input, output });
    return this;
  }

  /**
   * Define output schema (JSON structure expected)
   */
  withOutputSchema(schema: string): this {
    this.outputSchema = schema;
    return this;
  }

  /**
   * Define the main task/question
   */
  withTask(task: string): this {
    this.task = task;
    return this;
  }

  /**
   * Build the optimized prompt string
   */
  build(): string {
    const parts: string[] = [];

    if (this.role) {
      parts.push(`Role: ${this.role}\n`);
    }

    if (this.task) {
      parts.push(`Task: ${this.task}\n`);
    }

    if (this.constraints.length > 0) {
      parts.push(`Constraints:\n${this.constraints.join('\n')}\n`);
    }

    if (this.outputSchema) {
      parts.push(`Output format (JSON):\n${this.outputSchema}\n`);
    }

    if (this.examples.length > 0) {
      parts.push('Examples:\n');
      for (const example of this.examples) {
        parts.push(`Input: ${example.input}`);
        parts.push(`Output: ${example.output}\n`);
      }
    }

    return parts.join('\n').trim();
  }

  /**
   * Reset builder for reuse
   */
  reset(): this {
    this.role = '';
    this.constraints = [];
    this.examples = [];
    this.outputSchema = '';
    this.task = '';
    return this;
  }
}

/**
 * Token-efficient prompts for common ElectroMate scenarios
 *
 * Pre-crafted prompts that minimize tokens while maintaining quality.
 * Use these as templates for your specific queries.
 */
export const efficientPrompts = {
  /**
   * Validate user input for electrical calculations
   *
   * Tokens: ~150
   * Use for: Input validation before expensive calculations
   */
  validateElectricalInput: new StructuredPromptBuilder()
    .withRole('Electrical engineer specialized in NEC/IEC compliance')
    .withTask('Validate electrical calculation inputs for compliance and reasonableness')
    .addConstraint('Reject values outside 10V-1000V for voltage')
    .addConstraint('Reject currents > 10,000A or < 0.1A')
    .addConstraint('Reject distances > 500 meters (1640 ft)')
    .withOutputSchema(
      JSON.stringify({
        isValid: 'boolean',
        errors: '["error message 1", "error message 2"]',
        warnings: '["warning message 1"]',
        standardCompliant: 'NEC | IEC | both | unknown',
      }, null, 2)
    )
    .addExample(
      'Voltage: 240V, Current: 100A, Distance: 50m, Material: copper',
      JSON.stringify({
        isValid: true,
        errors: [],
        warnings: [],
        standardCompliant: 'both',
      })
    )
    .addExample(
      'Voltage: 1500V, Current: 100A, Distance: 50m',
      JSON.stringify({
        isValid: false,
        errors: ['Voltage 1500V exceeds common industrial maximum (1000V)'],
        warnings: [],
        standardCompliant: 'unknown',
      })
    )
    .build(),

  /**
   * Select appropriate cable size from standard options
   *
   * Tokens: ~200
   * Use for: Comparing calculated cable requirements against standard sizes
   */
  selectCableSize: new StructuredPromptBuilder()
    .withRole('Cable sizing expert (NEC/IEC standards)')
    .withTask('Select closest standard cable size that meets or exceeds calculated requirements')
    .addConstraint('Only use standard AWG (14, 12, 10, 8, 6, 4, 2, 1, 0, 2/0, 3/0, 4/0) or mm² (1.5-240)')
    .addConstraint('Always round UP to next standard size if calculated size falls between standards')
    .addConstraint('Return exact standard designation (e.g., "2/0 AWG" or "50 mm²")')
    .withOutputSchema(
      JSON.stringify({
        selected: 'cable size designation',
        amperageRating: 'amperes at specified temperature',
        voltageDropCompliance: 'boolean (≤3% single-phase, ≤2% three-phase)',
        margin: 'percentage above minimum requirement',
      }, null, 2)
    )
    .addExample(
      'Calculated: 47.3A @ 240V, distance 100ft, copper',
      JSON.stringify({
        selected: '#6 AWG',
        amperageRating: 65,
        voltageDropCompliance: true,
        margin: 37,
      })
    )
    .build(),

  /**
   * Recommend breaker rating based on circuit characteristics
   *
   * Tokens: ~180
   * Use for: Breaker sizing decisions
   */
  recommendBreakerRating: new StructuredPromptBuilder()
    .withRole('Electrical safety engineer (NEC Article 430, IEC 60364)')
    .withTask('Recommend standard breaker rating for circuit with specified load and characteristics')
    .addConstraint('Round UP to next standard breaker size (125% for continuous, 100% for non-continuous)')
    .addConstraint('Standard sizes: 15, 20, 30, 40, 50, 60, 70, 80, 100, 125, 150, 200, 225, 250, 300, 350, 400, 500, 600, 800, 1000, 1200, 1600A')
    .addConstraint('Consider inrush current for inductive loads (5-7x running current)')
    .withOutputSchema(
      JSON.stringify({
        breaker: 'standard breaker amperage',
        type: 'Type: A (general), B (moderate inrush), C (high inrush), D (extreme inrush)',
        standard: 'NEC | IEC',
        margin: 'percentage above minimum load current',
        notes: 'brief explanation if not standard selection',
      }, null, 2)
    )
    .addExample(
      'Load: 80A continuous, inductive (motor), 240V single-phase',
      JSON.stringify({
        breaker: 100,
        type: 'Type C (high inrush)',
        standard: 'NEC',
        margin: 25,
        notes: 'Inductive load requires Type C for 3-5x inrush protection',
      })
    )
    .build(),

  /**
   * Estimate solar array capacity needed
   *
   * Tokens: ~190
   * Use for: Quick solar sizing validation
   */
  estimateSolarArray: new StructuredPromptBuilder()
    .withRole('Solar engineer (NREL methodology, IEC 61215)')
    .withTask('Estimate solar array capacity (kW) needed to meet daily energy requirement')
    .addConstraint('Consider 25% system losses (inverter, wiring, temperature)')
    .addConstraint('Use 3.5 peak sun hours as baseline (adjust based on location)')
    .addConstraint('Round UP to nearest 0.5 kW increment')
    .withOutputSchema(
      JSON.stringify({
        arrayCapacity: 'kW (DC rating)',
        estimatedAnnualProduction: 'kWh/year',
        panelCount: 'count @ 400W per panel',
        oversizing: 'percentage above minimum requirement',
        assumptions: 'list of assumptions made',
      }, null, 2)
    )
    .addExample(
      'Daily energy need: 50 kWh, Location: Southwest USA, Roof: South-facing, Tilt: 30°',
      JSON.stringify({
        arrayCapacity: 15,
        estimatedAnnualProduction: 22500,
        panelCount: 38,
        oversizing: 15,
        assumptions: [
          '3.5 peak sun hours average',
          '25% system losses',
          '400W panels at STC',
          '30° tilt angle optimization',
        ],
      })
    )
    .build(),

  /**
   * Check calculation result for reasonableness
   *
   * Tokens: ~160
   * Use for: Quick sanity check before committing result
   */
  sanityCheckResult: new StructuredPromptBuilder()
    .withRole('Senior electrical engineer (fault-finding mode)')
    .withTask('Review calculation result for obvious errors or unreasonable values')
    .addConstraint('Focus on physics-based red flags (e.g., 0.1% voltage drop on 500m run)')
    .addConstraint('Check order-of-magnitude reasonableness')
    .addConstraint('Do NOT recalculate; only flag suspicious results')
    .withOutputSchema(
      JSON.stringify({
        isReasonable: 'boolean',
        redFlags: '["issue 1", "issue 2"] or [] if none',
        confidence: '0.0-1.0 (certainty of assessment)',
        recommendation: 'string (accept | review | recalculate)',
      }, null, 2)
    )
    .addExample(
      'Calculated voltage drop: 0.05% over 500m at 100A copper wire',
      JSON.stringify({
        isReasonable: false,
        redFlags: [
          'Voltage drop ~0.05% is extremely low for 500m run',
          'Suggests undersized wire or calculation error',
        ],
        confidence: 0.95,
        recommendation: 'recalculate',
      })
    )
    .build(),
};

/**
 * Batch prompt for multiple related calculations
 *
 * Tokens: ~220 setup + content
 * More efficient than individual prompts when processing multiple items
 *
 * Example use:
 * ```
 * const batch = new BatchPrompt()
 *   .setContext('Validate and recommend breaker for these circuits')
 *   .addItem({ id: 'circuit-1', voltage: 240, current: 50, phase: 'single' })
 *   .addItem({ id: 'circuit-2', voltage: 480, current: 100, phase: 'three' })
 *   .build();
 * // Send to LLM once, get back all results
 * ```
 */
export class BatchPrompt {
  private context: string = '';
  private items: Array<{ id: string; data: Record<string, any> }> = [];

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  addItem(id: string, data: Record<string, any>): this {
    this.items.push({ id, data });
    return this;
  }

  build(): string {
    const parts: string[] = [this.context, '\nProcess these items in parallel:\n'];

    for (const item of this.items) {
      parts.push(`\n[${item.id}]\n${JSON.stringify(item.data, null, 2)}`);
    }

    parts.push(
      '\n\nReturn results as JSON array with structure: [{ id: string, result: {...} }, ...]'
    );

    return parts.join('');
  }
}

/**
 * Guidelines for LLM-assisted electrical calculations
 *
 * When to use LLM:
 * - ✅ Validation of user input for reasonableness
 * - ✅ Sanity checking of computed results
 * - ✅ Interpretation of standards documents
 * - ✅ Risk assessment and safety flag identification
 * - ✅ Report generation and explanation
 *
 * When NOT to use LLM:
 * - ❌ Direct calculation (always use local math functions)
 * - ❌ Standards table lookup (always use pre-computed tables)
 * - ❌ Any deterministic engineering formula (use math.js)
 * - ❌ High-frequency operations (cache results instead)
 */
export const llmUsageGuidelines = {
  recommended: [
    'Input validation (regex + LLM cross-check for edge cases)',
    'Result sanity checking (is 0.02% voltage drop on 100m possible?)',
    'Standards interpretation (ambiguous NEC/IEC clauses)',
    'Risk flagging (potential safety issues)',
    'Report generation (summaries, explanations)',
    'User query interpretation (convert natural language to parameters)',
  ],
  notRecommended: [
    'Voltage drop calculation (deterministic formula)',
    'Ampacity lookup (use standard tables)',
    'Cable sizing (deterministic algorithm)',
    'Breaker rating (use standard ratings table)',
    'Solar array sizing (use NREL formula)',
    'Lighting calculations (use lumen method formula)',
  ],
};

/**
 * Calculate token savings from caching and batching
 *
 * Helps estimate impact of optimizations:
 * - LLM API call: ~500 tokens average
 * - Cache hit: ~0 tokens
 * - Batch call: ~1 token per item + setup (vs ~500 per individual call)
 */
export interface TokenSavings {
  avgTokensPerCall: number;
  cacheHitSavings: number; // tokens saved per cache hit
  batchSavings: number; // % reduction from batching 10 items
  annualSavingsEstimate: {
    calls: number;
    tokens: number;
    costUSD: number;
  };
}

export const calculateTokenSavings = (
  cacheHitRate: number,
  batchSize: number,
  estimatedCallsPerDay: number
): TokenSavings => {
  const avgTokensPerCall = 500;
  const cacheHitSavings = avgTokensPerCall;
  const batchSavings = ((batchSize - 1) / batchSize) * 100; // % savings vs individual calls
  const callReduction = batchSize / 1; // Reduce N calls to 1

  const daysPerYear = 365;
  const totalCallsPerYear = estimatedCallsPerDay * daysPerYear;
  const callsAfterBatching = totalCallsPerYear / batchSize;
  const callsSavedByCache = callsAfterBatching * cacheHitRate;
  const remainingCalls = callsAfterBatching - callsSavedByCache;

  return {
    avgTokensPerCall,
    cacheHitSavings,
    batchSavings,
    annualSavingsEstimate: {
      calls: Math.round(callsSavedByCache),
      tokens: Math.round(callsSavedByCache * avgTokensPerCall),
      costUSD: Math.round(callsSavedByCache * avgTokensPerCall * 0.000002), // $0.002 per 1M tokens
    },
  };
};
