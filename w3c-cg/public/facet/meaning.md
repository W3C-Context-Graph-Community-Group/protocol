# facet/meaning

**Meaning comparison — what the value refers to**

- **Key:** `https://w3c-cg.github.io/context-graph/facet/meaning`
- **Dependency:** Valid only when μ_C = 1
- **Indicator:** μ_M ∈ {0, 1} — 0 = match, 1 = mismatch

## Three-step rotation

1. **Ask:** `ask:definition-of-{field}`
2. **Response:** The other system's definition
3. **Verdict:** `verdict:match,mu_m:0` or `verdict:mismatch,mu_m:1`

Comparison is by string equality. A mismatch triggers **Ask**, not Halt.

---

Part of the [Context Graph](https://w3c-cg.github.io/context-graph/).
