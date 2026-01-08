# Token Optimization Guide for ElectroMate

This directory contains utilities for minimizing LLM token consumption while maintaining calculation accuracy and user experience.

## Quick Start

### 1. Calculation Caching

Cache expensive calculations to avoid redundant LLM calls:

```typescript
import { calculationCaches } from '@/lib/optimization/calculationCache';

// Cache a voltage drop calculation
const voltageDropResult = await calculationCaches.voltage.get(
  { voltage: 240, current: 50, distance: 100, material: 'copper' },
  async () => {
    // Expensive calculation here
    return await calculateVoltageDrop(240, 50, 100, 'copper');
  }
);

// Same input -> returns cached result (0 tokens spent)
// Different input -> computes and caches
```

### 2. Structured Prompting

Use efficient prompt templates to reduce back-and-forth:

```typescript
import { efficientPrompts } from '@/lib/optimization/promptOptimization';

// Pre-built, optimized prompts for common tasks
const validationPrompt = efficientPrompts.validateElectricalInput;
const breakerPrompt = efficientPrompts.recommendBreakerRating;

// Use with your LLM API:
const response = await client.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 500,
  system: breakerPrompt,
  messages: [
    {
      role: 'user',
      content: 'Load: 80A continuous, inductive (motor), 240V single-phase',
    },
  ],
});
```

### 3. Batch Processing

Process multiple items in one API call instead of individually:

```typescript
import { BatchPrompt } from '@/lib/optimization/promptOptimization';

const batch = new BatchPrompt()
  .setContext('Validate these electrical inputs for NEC compliance')
  .addItem('circuit-1', { voltage: 240, current: 50, distance: 100 })
  .addItem('circuit-2', { voltage: 480, current: 100, distance: 50 })
  .addItem('circuit-3', { voltage: 120, current: 20, distance: 25 });

// One API call for 3 items (~300 tokens saved vs 3x individual calls)
const response = await client.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 1000,
  messages: [{ role: 'user', content: batch.build() }],
});
```

## Architecture Overview

```
User Input
    ↓
Validation (Local Zod)
    ↓
Check Cache (CalculationCache)
    ├─ Hit → Return cached result (0 tokens)
    └─ Miss → Proceed to calculation
    ↓
Local Calculation (math.js)
    ↓
Optional: LLM Sanity Check (efficientPrompts.sanityCheckResult)
    ├─ Only if confidence < threshold
    └─ Cached for same inputs
    ↓
Store in DB + Cache
    ↓
Response to User
```

## Token Savings Estimate

### Scenario: 1000 electrical calculations/day

**Without optimization:**
- 1000 calls × 500 tokens/call = 500,000 tokens/day
- 500,000 tokens × 365 days = 182.5M tokens/year
- Cost: ~$365/year

**With optimization (70% cache hit rate + batching):**
- Cache hits: 1000 × 0.7 = 700 calls saved → 350,000 tokens saved
- Remaining 300 calls batched in groups of 10 → 30 calls → ~15,000 tokens
- Total: 15,000 tokens/day = 5.5M tokens/year
- Cost: ~$11/year
- **Savings: 97% reduction in tokens ($354/year saved)**

## Best Practices

### ✅ DO

1. **Cache calculation inputs with identical electrical parameters**
   ```typescript
   // GOOD: Same cable, voltage, current → cache hit
   cableCache.get({ material: 'copper', size: 4, temp: 60 }, computeFn);
   cableCache.get({ material: 'copper', size: 4, temp: 60 }, computeFn); // Hit!
   ```

2. **Use batch prompts for multiple related items**
   ```typescript
   // GOOD: Batch 5-10 similar validations
   const batch = new BatchPrompt().setContext('...').addItem(...).addItem(...);
   ```

3. **Validate locally first, then LLM second**
   ```typescript
   // GOOD: Reject invalid inputs before hitting LLM
   if (!validateLocalConstraints(input)) {
     return { error: 'Invalid input' }; // 0 tokens
   }
   const llmCheck = await llmValidate(input); // Only valid inputs reach LLM
   ```

4. **Use LLM for interpretation, not computation**
   ```typescript
   // GOOD: LLM reviews calculation, not performs it
   const calculated = await calculateVoltageDropLocal();
   const sanityCheck = await llmSanityCheck(calculated); // Simple review
   ```

5. **Pre-populate cache with standard tables**
   ```typescript
   // GOOD: Cache standard cable ampacities on startup
   for (const cableSize of STANDARD_SIZES) {
     cableCache.set(cableSize, standardAmpacity[cableSize]);
   }
   ```

### ❌ DON'T

1. **Don't use LLM for deterministic calculations**
   ```typescript
   // BAD: Calculating voltage drop with LLM (500+ tokens, unreliable)
   const vd = await llm.calculate('voltage drop for 240V, 50A, 100ft copper');

   // GOOD: Use local math
   const vd = calculateVoltageDrop(240, 50, 100, 'copper'); // 0 tokens
   ```

2. **Don't make individual LLM calls for batch operations**
   ```typescript
   // BAD: 100 individual calls = 50,000 tokens
   for (const item of items) {
     const result = await llm.validate(item); // ← Loop!
   }

   // GOOD: 1 batch call = 1,500 tokens
   const batch = new BatchPrompt().setContext('...').addItem(...).addItem(...);
   const results = await llm.process(batch.build());
   ```

3. **Don't skip input validation**
   ```typescript
   // BAD: Invalid input wastes LLM tokens on correction
   const result = await llm.validate(untrustedInput);

   // GOOD: Validate first (0 tokens)
   if (!isValidInput(untrustedInput)) return error;
   const result = await llm.validate(trustedInput);
   ```

4. **Don't recalculate the same inputs repeatedly**
   ```typescript
   // BAD: Recalculates every time (no cache)
   for (const i = 0; i < 1000; i++) {
     const vd = calculateVoltageDrop(240, 50, 100, 'copper'); // Repeated!
   }

   // GOOD: Cache the result
   const vd = await voltageCache.get({ voltage: 240, ... }, computeFn);
   // First call: computes. Next 999 calls: instant cache hit
   ```

5. **Don't store sensitive data in cache**
   ```typescript
   // BAD: User credentials in cache memory
   const cache = new CalculationCache();
   cache.set({ apiKey: userSecret }, result);

   // GOOD: Cache only calculation inputs/results
   cache.set({ voltage: 240, current: 50 }, result);
   ```

## Integration Checklist

- [ ] Install Math.js (already in `lib/mathConfig.ts`)
- [ ] Import `calculationCaches` in calculation functions
- [ ] Wrap expensive calculations with `cache.get()`
- [ ] Import `efficientPrompts` in LLM integration layer
- [ ] Use `BatchPrompt` for multi-item validation
- [ ] Monitor cache hit rate: `logCacheStats()`
- [ ] Clear stale entries periodically: `cache.evictStale(24*60*60*1000)`
- [ ] Export cache for persistence: `cache.export()`

## Cache Statistics

Monitor cache performance:

```typescript
import { logCacheStats } from '@/lib/optimization/calculationCache';

// Log all cache stats to console
logCacheStats();

// Example output:
// Cable: 850 hits, 150 misses (85.0%), 10 evictions
// Voltage: 920 hits, 80 misses (92.0%), 5 evictions
// Battery: 450 hits, 50 misses (90.0%), 0 evictions
```

Target: **>80% cache hit rate** for calculations
- <50%: Caching not effective for your usage pattern
- 50-80%: Good caching, consider larger cache size
- >80%: Excellent! Users seeing significant token savings

## Performance Metrics

### Cache Operations
- **get() with cache hit**: ~0.1ms
- **get() with cache miss**: ~10-100ms (depends on computation)
- **set()**: ~0.05ms
- **Memory per entry**: ~200 bytes average

### LLM Integration
- **Batch call (10 items)**: ~2 seconds, 1000-1500 tokens
- **Individual calls (10 items)**: ~20 seconds, 5000-7500 tokens
- **Cache hit vs miss**: 100x latency improvement

## Troubleshooting

### High miss rate (cache hit rate <50%)?

1. **Check cache key generation**
   ```typescript
   // Keys should be consistent for same inputs
   const cache = new CalculationCache();
   // Input order shouldn't matter (uses sorted key)
   cache.get({ voltage: 240, current: 50 }, fn);
   cache.get({ current: 50, voltage: 240 }, fn); // Should be same key
   ```

2. **Increase cache size**
   ```typescript
   const largeCache = new CalculationCache(5000); // Default is 1000
   ```

3. **Pre-populate with standard values**
   ```typescript
   // Cache common cable sizes on startup
   for (const size of STANDARD_CABLE_SIZES) {
     cableCache.set(size, getAmpacity(size));
   }
   ```

### Memory usage too high?

1. **Reduce cache size**
   ```typescript
   const smallCache = new CalculationCache(100); // Fewer entries
   ```

2. **Evict stale entries**
   ```typescript
   // Remove entries older than 1 day
   const evicted = cache.evictStale(24 * 60 * 60 * 1000);
   ```

3. **Monitor cache size**
   ```typescript
   const stats = cache.getStats();
   console.log(`Cache size: ${stats.size} entries`);
   ```

## Examples

See `/lib/optimization/examples/` for full working examples:
- `voltage-drop-cached.ts` - Caching voltage drop calculations
- `batch-validation.ts` - Batching input validations
- `prompt-engineering.ts` - Using structured prompts
- `cache-preload.ts` - Pre-populating cache with standards

## Further Reading

- **Prompt Engineering**: https://platform.openai.com/docs/guides/prompt-engineering
- **Caching Strategies**: https://redis.io/docs/about/
- **Electrical Standards**: NEC 2020 Article 310 (Cable ratings), IEC 60364-5-52 (Voltage drop)

---

**Questions?** Check `.specify/memory/constitution.md` for architecture principles and standards compliance.
