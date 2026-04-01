# Boundary: ron ↔ jacek

## Status: INCOHERENT

| Facet | Result | Detail |
|-------|--------|--------|
| Context (μ_C) | ✅ Sufficient | Both sides surfaced domain, units, measurement type |
| Meaning (μ_M) | ❌ Mismatch | ron: indoor air temperature · jacek: patient body temperature |
| Structure (μ_S) | ❌ Mismatch | ron: Celsius, integer, range 15–45 · jacek: Fahrenheit, integer, range 90–110 |
| Data (μ_D) | ⛔ Undefined | Cannot interpret — meaning and structure are misaligned |

## Protocol trace

17 claims recorded. See [log.csv](log.csv) for the full trace.

## What happened

Both systems have a field called `temperature` with the value `30`. The column name matches. The value matches. Shannon reports perfect transmission.

The protocol surfaced three misalignments invisible to every standard instrument:

1. **Meaning mismatch:** ron measures room air temperature. jacek measures patient body temperature.
2. **Structure mismatch:** ron encodes in Celsius. jacek encodes in Fahrenheit.
3. **Data incoherence:** The value `30` means completely different things under different codebooks.

## Protocol action: HALT

The boundary is incoherent. Any computation that merges these two `temperature` values will produce a confidently wrong result.
