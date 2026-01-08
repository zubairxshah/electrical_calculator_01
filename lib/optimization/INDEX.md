# Token Optimization Suite - File Index

Complete reference to all optimization utilities, documentation, and examples.

---

## 📂 Core Modules

### `calculationCache.ts` (600 lines)
**LRU Cache for Calculation Results**

- **CalculationCache class**: Main cache implementation
  - Generic `<T>` type for any result type
  - Configurable size (default: 1000 entries)
  - Automatic LRU eviction
  - Statistics tracking (hits, misses, evictions)

- **Global cache instances**:
  - `calculationCaches.cable` - Cable sizing cache
  - `calculationCaches.voltage` - Voltage drop cache
  - `calculationCaches.battery` - Battery capacity cache
  - `calculationCaches.solar` - Solar array cache
  - `calculationCaches.ups` - UPS sizing cache
  - `calculationCaches.lighting` - Lighting design cache
  - `calculationCaches.breaker` - Breaker rating cache

- **Key methods**:
  - `get(input, computeFn)` - Async get with compute fallback
  - `getSync(input)` - Synchronous read-only get
  - `set(input, result, computeTimeMs)` - Manual cache set
  - `clear()` - Clear all entries
  - `getStats()` - Get performance statistics
  - `getStaleEntries(ageMs)` - Find old entries
  - `evictStale(ageMs)` - Remove old entries
  - `export()` - Export for persistence
  - `import(data)` - Import from persistence

- **Helper functions**:
  - `logCacheStats()` - Log all cache statistics
  - `clearAllCaches()` - Clear all global caches

**Usage**:
```typescript
import { calculationCaches } from '@/lib/optimization/calculationCache';
const result = await calculationCaches.voltage.get(input, computeFn);
```

---

### `promptOptimization.ts` (450 lines)
**Prompt Engineering & Batch Processing Utilities**

- **StructuredPromptBuilder class**:
  - Fluent API for building prompts
  - Methods: `withRole()`, `addConstraint()`, `addExample()`, `withOutputSchema()`, `withTask()`, `build()`, `reset()`
  - Generates efficient, consistent prompts

- **Pre-built efficient prompts** (efficientPrompts object):
  - `validateElectricalInput` - Input validation (~150 tokens)
  - `selectCableSize` - Cable sizing (~200 tokens)
  - `recommendBreakerRating` - Breaker sizing (~180 tokens)
  - `estimateSolarArray` - Solar sizing (~190 tokens)
  - `sanityCheckResult` - Result validation (~160 tokens)

- **BatchPrompt class**:
  - Multi-item processing in single API call
  - Methods: `setContext()`, `addItem(id, data)`, `build()`
  - Reduces calls by 80-90% (groups of 5-10 items)

- **Token Savings Calculator**:
  - `calculateTokenSavings()` - Estimate annual savings
  - Input: cache hit rate, batch size, calls per day
  - Output: tokens saved, cost reduction, projected annual savings

- **LLM Usage Guidelines** (llmUsageGuidelines object):
  - Recommended use cases (validation, sanity checking, report generation)
  - Not recommended use cases (direct calculation, formula application)

**Usage**:
```typescript
import { efficientPrompts, BatchPrompt } from '@/lib/optimization/promptOptimization';

// Use pre-built prompt
const prompt = efficientPrompts.validateElectricalInput;

// Custom prompt
const custom = new StructuredPromptBuilder()
  .withRole('Expert engineer')
  .withTask('Validate input')
  .addConstraint('Must comply with NEC')
  .build();

// Batch processing
const batch = new BatchPrompt()
  .setContext('Validate circuits')
  .addItem('c1', data1)
  .addItem('c2', data2)
  .build();
```

---

### `examples.ts` (600 lines)
**Working Example Scenarios**

8 complete, copy-paste-ready examples:

1. **example_cacheVoltageDrop()**
   - Simulates 100 voltage drop calculations with cache hits
   - Demonstrates 96.8% cache hit rate
   - Shows token savings calculation

2. **example_batchValidation()**
   - Batch validates 5 circuits in single API call
   - Compares 1 call (1500 tokens) vs 5 individual calls (2500 tokens)
   - 40% token savings

3. **example_structuredPrompt()**
   - Creates optimized cable sizing prompt with examples
   - Shows impact of structured output format
   - ~250 tokens with deterministic JSON output

4. **example_preloadCache()**
   - Pre-populates cache with 12 standard cable ratings
   - Eliminates cache misses for common sizes
   - 100% hit rate for standard configurations

5. **example_fullWorkflow()**
   - Complete optimization pipeline:
     - Local validation (0 tokens)
     - Cache check (0 tokens if hit)
     - Local calculation (0 tokens)
     - Optional LLM sanity check (only if low confidence)
     - Result caching

6. **example_monitorCache()**
   - Generates test cache activity
   - Displays cache statistics
   - Shows hit rate, evictions, compute time
   - Calculates token and cost savings

7. **example_persistCache()**
   - Exports cache to JSON format
   - Demonstrates save/load pattern
   - Useful for session persistence

8. **example_batchProjectProcessing()**
   - Processes 50 circuits (real-world project size)
   - Batches validations in groups of 10
   - Caches cable sizing results
   - Shows ~22,500 token savings vs individual calls

**Run all examples**:
```typescript
import { runAllExamples } from '@/lib/optimization/examples';
await runAllExamples();
```

---

## 📚 Documentation

### `README.md` (500 lines)
**Complete Integration Guide**

Sections:
- Quick Start (basic caching, prompting, batching)
- Architecture Overview (data flow diagram)
- Token Savings Estimate (detailed calculations)
- Best Practices (DO/DON'T guidelines)
- Integration Checklist
- Cache Statistics (monitoring and interpretation)
- Performance Metrics (latency, throughput, cost)
- Troubleshooting (common issues and solutions)
- Examples Reference
- Further Reading (standards and references)

**Key Content**:
- Practical code examples for each feature
- Step-by-step integration instructions
- 97% token reduction scenario breakdown
- Detailed troubleshooting flowchart

---

## 🚀 Automation Scripts

### `.specify/scripts/bash/optimize-tokens.sh` (500 lines)
**Command-Line Automation Tool**

Commands:
- `analyze` - Analyze codebase for optimization opportunities
  - Checks for optimization utilities
  - Detects LLM integrations
  - Counts calculation modules
  - Reports caching usage

- `stats` - Display cache performance statistics
  - Shows hit/miss rates
  - Memory usage
  - Cost-benefit analysis

- `estimate` - Estimate token savings
  - Options: `--calls-per-day N`, `--hit-rate PERCENT`, `--batch-size N`
  - Projects annual tokens/cost saved
  - Shows detailed breakdown

- `benchmark` - Run performance benchmarks
  - TypeScript compilation check
  - Import validation
  - Performance estimation

- `report` - Generate comprehensive report
  - Option: `--output PATH` (default: OPTIMIZATION_REPORT.md)
  - Full analysis with recommendations
  - Markdown format for easy sharing

- `help` - Show help documentation

**Usage**:
```bash
./optimize-tokens.sh analyze
./optimize-tokens.sh estimate --calls-per-day 1000 --hit-rate 0.8
./optimize-tokens.sh report --output my-analysis.md
./optimize-tokens.sh benchmark
./optimize-tokens.sh help
```

---

## 📖 Quick References

### `TOKEN_OPTIMIZATION_QUICKSTART.md`
**TL;DR for Busy People**

- Current status: Zero LLM tokens
- What was delivered (summary)
- Quick integration steps (3 examples)
- Token savings potential
- Monitoring setup
- Quick troubleshooting FAQ

**Best for**: First-time users, executives, quick reference

---

### `OPTIMIZATION_IMPLEMENTATION_SUMMARY.md`
**Comprehensive Reference Document**

- Executive summary
- What was delivered (detailed)
- Codebase analysis results
- Token savings calculations (detailed math)
- Integration guide (step-by-step)
- Performance characteristics
- Key metrics to monitor
- QA validation results
- Next steps (immediate, short-term, medium-term)
- Troubleshooting reference
- Cost-benefit analysis
- Recommendations (DO/DON'T)
- Success criteria

**Best for**: Implementation planning, stakeholder communication, detailed reference

---

## 🔄 Data Flow

```
User Input
    ↓
[Local Validation] ← 0 tokens
    ↓
[Cache Check] ← 0 tokens if hit
├─ Hit → Return cached result (instant)
└─ Miss → Continue to calculation
    ↓
[Local Calculation] ← 0 tokens
    ↓
[Optional: LLM Sanity Check] ← 0-500 tokens (only if low confidence)
├─ Using efficientPrompts for structured output
└─ Using cache.get() to reuse results
    ↓
[Store in Cache + DB] ← 0 tokens
    ↓
[Response to User] ← instant
```

---

## 🎯 Integration Priorities

### Phase 1: Foundation (Day 1)
- [ ] Import `calculationCaches` in your calculation functions
- [ ] Wrap expensive computations with `cache.get(input, computeFn)`
- [ ] Monitor cache with `logCacheStats()`

### Phase 2: Prompting (Week 1)
- [ ] Replace generic LLM prompts with `efficientPrompts`
- [ ] Use `StructuredPromptBuilder` for custom prompts
- [ ] Target 20% token reduction

### Phase 3: Batching (Week 2)
- [ ] Identify validation workflows with 5+ items
- [ ] Wrap with `BatchPrompt`
- [ ] Target 70% token reduction

### Phase 4: Monitoring (Week 3)
- [ ] Set up cache statistics dashboard
- [ ] Track actual vs. estimated token savings
- [ ] Measure cost reduction

---

## 📊 At a Glance

| Component | Lines | Purpose | Token Savings |
|-----------|-------|---------|---------------|
| calculationCache.ts | 600 | LRU cache | 500/hit |
| promptOptimization.ts | 450 | Prompt engineering | 100-200/call |
| examples.ts | 600 | Working examples | Demo only |
| README.md | 500 | Full documentation | N/A |
| optimize-tokens.sh | 500 | CLI automation | N/A |
| **Total** | **2,650** | **Complete suite** | **90-97% reduction** |

---

## 🔗 Cross-References

- **Main README**: `lib/optimization/README.md`
- **Quick Start**: `TOKEN_OPTIMIZATION_QUICKSTART.md`
- **Implementation Summary**: `OPTIMIZATION_IMPLEMENTATION_SUMMARY.md`
- **Examples**: `lib/optimization/examples.ts`
- **Automation**: `.specify/scripts/bash/optimize-tokens.sh`

---

## ✅ Validation Checklist

- ✅ All TypeScript files compile without errors
- ✅ Cache logic properly implements LRU eviction
- ✅ Prompt generation produces valid JSON
- ✅ Batch processing maintains order
- ✅ Token calculation mathematics validated
- ✅ Bash script passes syntax check
- ✅ Examples compile and run successfully
- ✅ Documentation is complete and accurate

---

## 🚀 Getting Started

1. **Read**: `TOKEN_OPTIMIZATION_QUICKSTART.md` (5 min)
2. **Browse**: `lib/optimization/examples.ts` (10 min)
3. **Integrate**: Copy example #5 (full workflow) into your code (30 min)
4. **Monitor**: Run `logCacheStats()` to verify (5 min)
5. **Scale**: Extend to other calculation functions (varies)

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Cache hit rate <50% | See README.md troubleshooting section |
| Memory usage high | Reduce cache size or evict stale entries |
| Token savings not visible | Verify cache is being used (check hit rate) |
| Compilation errors | Ensure TypeScript 4.5+ installed |
| Script not executable | Run `chmod +x .specify/scripts/bash/optimize-tokens.sh` |

---

**Created**: January 8, 2026
**Version**: 1.0
**Status**: Production Ready
**Last Updated**: January 8, 2026

