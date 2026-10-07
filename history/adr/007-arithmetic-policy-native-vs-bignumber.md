# ADR-007: Calculation Arithmetic Policy — Native Doubles by Default, BigNumber Where It Earns Its Cost

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted (amends ADR-003)
- **Date:** 2026-10-08
- **Feature:** Cross-cutting. Triggered by 012-arc-flash and 013-panel-schedule
- **Context:** ADR-003 (2025-12-24) mandates mathjs BigNumber at 64-digit precision for **all** calculation logic. Its argument is that IEEE 754 rounding (`0.1 + 0.2 ≠ 0.3`) threatens the accuracy tolerances in Constitution Principle I. Practice has since diverged. **9 of 17** calculation modules use native `number`: arc-flash, earthing, generator-sizing, harmonic-analysis, lighting, panel-schedule, power-factor-correction, short-circuit and transformer-sizing. The other 8 use mathjs: battery, breaker, cables, conduit-fill, motor-breaker, solar, ups and voltage-drop. Both recent plans (012, 013) recorded the deviation in Complexity Tracking. Meanwhile the evidence shows that double precision is not the limiting factor. The arc-flash native engine reproduces all 144,000 official IEEE 1584-2018 spreadsheet cases to a max relative error of 2.4e-6. The panel-schedule worked examples match to 1e-6. Both are orders of magnitude inside the tightest constitutional tolerance (±0.1 %). The binding error sources are the inputs and standard coefficients themselves (3–6 significant figures), not arithmetic. A blanket rule that most modules ignore is worse than a clear policy.

<!-- Significance checklist
     1) Impact: ✅ governs how every calculation module is written and reviewed; affects accuracy guarantees (Constitution I)
     2) Alternatives: ✅ keep ADR-003 strictly / native everywhere / tiered policy / decimal.js
     3) Scope: ✅ cross-cutting — all lib/calculations/* modules, validation, PDF formatting, test tolerances
-->

## Decision

A **tiered arithmetic policy** for `lib/calculations/**`:

- **Default: native `number` (IEEE 754 double)** for engineering models whose inputs and coefficients carry ≤ 15 significant figures. That covers empirical/log-power models (IEEE 1584), per-unit impedance chains, phasor/vector sums, demand-factor tables, and sums/products of tabulated data.
- **BigNumber is optional, not mandated.** Use mathjs BigNumber only where a module has a demonstrated need. Examples: long iterative accumulations where error compounds (≥ 10⁴ steps), exact-decimal comparisons that decide a code-compliance pass/fail at a tabulated boundary, or a published test case that native arithmetic measurably fails.
- **Existing mathjs modules stay as they are.** There is no rewrite in either direction. A migration happens only when a module is otherwise being reworked, and only with a passing accuracy suite.
- **Guardrails that replace the blanket rule** (required for every calculation module, native or BigNumber):
  1. **Accuracy is proven by tests, not by number type.** Each module has published or hand-worked reference cases, asserted at a tolerance at least 10× tighter than its constitutional requirement.
  2. **Round only at the edges.** Internal values stay unrounded, and rounding happens only in UI/PDF formatting.
  3. **Boundary comparisons use an explicit epsilon** (e.g. `x <= limit + 1e-9`) whenever a result is compared to a code threshold (breaker ≥ 125 % load, imbalance ≤ target, design current ≤ bus rating).
  4. **Equations mirror the standard.** Code follows the published equation form so reviewers can check it line-by-line.

## Consequences

### Positive

- **Policy matches reality.** 9 compliant modules stop being "deviations", and plans no longer need a Complexity Tracking row for every new calculator.
- **Accuracy is better evidenced.** The guarantee rests on reference-case tests (e.g. 144k IEEE 1584 rows) rather than on an assumption that a number type makes code correct.
- **More reviewable code.** `Math.log10`, `**`, and operators read like the standard. BigNumber call chains are roughly 3× more verbose for polynomial/log models.
- **Faster validation.** No BigNumber overhead (~10×), which keeps < 100 ms real-time validation (Constitution II) easy, e.g. a 200-panel balancing study in ~0.5 s.
- **Smaller dependency surface** for new modules (no mathjs import).

### Negative

- **Two coexisting styles** across modules (native vs mathjs). Contributors must read the module they touch. Mitigation: the rule is stated here, and new modules default to native.
- **Rounding hazards still exist** at threshold comparisons. Mitigation: guardrail 3 plus boundary tests.
- **Judgement is required** to decide when BigNumber is warranted, and the decision can be misjudged. Mitigation: the criteria above, plus a reviewer question in plan Constitution Checks.
- **ADR-003's stated rationale is partly superseded.** Older docs still say "all calculations use BigNumber" until they are updated.

## Alternatives Considered

**A. Enforce ADR-003 strictly (BigNumber everywhere, migrate the 9 native modules).**
Rejected. It needs a large rewrite with no measured accuracy benefit, because errors are already ≤ 2.4e-6 relative, against 2e-2 to 1e-3 requirements. It also makes empirical-model code diverge from the printed equations, which makes review harder, and it adds about 10× runtime cost.

**B. Native everywhere (migrate the 8 mathjs modules off BigNumber).**
Rejected for now. It churns stable, tested modules (battery, cables, voltage-drop) for no user-visible gain. The tiered policy allows it later, module by module, if a rework happens anyway.

**C. Switch to decimal.js / big.js for exact decimal arithmetic.**
Rejected. These lack the transcendental functions (`log10`, `pow` with fractional exponents, trig) that the models need, and they add a third numeric style.

**D. Keep ADR-003 and keep logging per-feature deviations.**
Rejected. The "exception" is now the majority (9/17). Leaving it this way means the ADR misdescribes the codebase and every plan carries boilerplate justification.

## References

- Feature Spec: [specs/013-panel-schedule/spec.md](../../specs/013-panel-schedule/spec.md) (SC-002 ±0.1 %); [specs/012-arc-flash/spec.md](../../specs/012-arc-flash/spec.md) (SC-001 ±2 %)
- Implementation Plan: [specs/013-panel-schedule/plan.md](../../specs/013-panel-schedule/plan.md) (D7, Complexity Tracking); [specs/012-arc-flash/plan.md](../../specs/012-arc-flash/plan.md) (D2, Complexity Tracking)
- Research: [specs/013-panel-schedule/research.md](../../specs/013-panel-schedule/research.md) R8; [specs/012-arc-flash/research.md](../../specs/012-arc-flash/research.md) R2, R5
- Verification: [specs/012-arc-flash/verification.md](../../specs/012-arc-flash/verification.md) (144k golden, 2.43e-6); [specs/013-panel-schedule/verification.md](../../specs/013-panel-schedule/verification.md)
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) Principle I; "Calculation Formula Verification" step 5 ("Implement formula using Math.js") should be updated to reference this ADR
- Related ADRs: ADR-003 (amended by this ADR)
- Evaluator Evidence: [history/prompts/013-panel-schedule/001-auto-panel-schedule-spec-to-implement.green.prompt.md](../prompts/013-panel-schedule/001-auto-panel-schedule-spec-to-implement.green.prompt.md)
