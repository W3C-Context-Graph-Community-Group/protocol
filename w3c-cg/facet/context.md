# facet/context

**Context evaluation — checked first**

- **Key:** `https://w3c-cg.github.io/context-graph/facet/context`
- **Indicator:** μ_C ∈ {0, 1} — completion check, not comparison
- **If μ_C = 0:** **Halt** — no downstream comparison is valid

## Semantics

Context is not a fourth dimension alongside Meaning, Structure, and Data. It is the resolution layer: the accumulated record of what was missing, surfaced, and resolved across the other three.

## Three-step rotation

1. **Ask:** `ask:{what context is needed}` — e.g., `ask:domain,location,unit-system`
2. **Response:** Context declarations — e.g., `domain:HVAC,loc:building-7,units:metric`
3. **Verdict:** `verdict:sufficient,mu_c:1` or `verdict:insufficient,mu_c:0`

---

Part of the [Context Graph](https://w3c-cg.github.io/context-graph/).
