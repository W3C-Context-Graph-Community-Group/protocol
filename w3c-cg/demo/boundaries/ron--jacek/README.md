# Boundary: Ron ↔ Jacek

## Status: INCOHERENT

| Facet | Result | Detail |
|-------|--------|--------|
| Context (μ_C) | ✅ Sufficient | Both sides surfaced domain, units, measurement type |
| Meaning (μ_M) | ❌ Mismatch | Ron: indoor air temperature · Jacek: patient body temperature |
| Structure (μ_S) | ❌ Mismatch | Ron: Celsius, integer, range 15–45 · Jacek: Fahrenheit, integer, range 90–110 |
| Data (μ_D) | ⛔ Undefined | Cannot interpret — meaning and structure are misaligned |

## What happened

Both systems have a field called `temperature` with the value `30`. The column name matches. The value matches. Shannon reports perfect transmission.

The protocol surfaced three misalignments invisible to every standard instrument:

1. **Meaning mismatch:** Ron measures room air temperature. Jacek measures patient body temperature. These are not the same physical quantity. Comparing them is semantically void.

2. **Structure mismatch:** Ron encodes in Celsius. Jacek encodes in Fahrenheit. Even if they measured the same thing, the values are in different units.

3. **Data incoherence:** The value `30` in Ron's codebook means "a warm room" (30°C = 86°F). In Jacek's codebook, 30°F is outside the valid clinical range (90–110°F) — it would indicate a deceased patient. The same number, under different codebooks, means completely different things.

## Protocol action: HALT

The boundary is incoherent. Any computation that merges these two `temperature` values — averaging them, comparing them, feeding them to a model — will produce a confidently wrong result.

## The log

The complete protocol trace is in [log.csv](log.csv). Every row is a canonical claim. Every URL in the `key` column is dereferenceable to its specification page. The 17 claims form 5 hyperedges on shared keys.

## Cost

3 rotations. 17 claims. ~5 seconds of protocol time. The alternative: silent misalignment propagating through every downstream computation.

## Codebook comparison

| | Ron | Jacek |
|--|-----|-------|
| **Meaning** | [Indoor air temperature](../../systems/ron/meaning/temperature.md) | [Patient body temperature](../../systems/jacek/meaning/temperature.md) |
| **Structure** | [Celsius, int, 15–45](../../systems/ron/structure/temperature.md) | [Fahrenheit, int, 90–110](../../systems/jacek/structure/temperature.md) |
| **Context** | [HVAC, Building 7, metric](../../systems/ron/context/temperature.md) | [Clinical, Ward 4B, imperial](../../systems/jacek/context/temperature.md) |
| **Data** | [30](../../systems/ron/data/temperature.csv) | [30](../../systems/jacek/data/temperature.csv) |
