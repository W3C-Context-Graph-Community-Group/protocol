# Jacek's System

**Asserter URI:** `https://w3c-cg.github.io/context-graph/demo/systems/jacek`

## Domain

Clinical / inpatient electronic health records for City Hospital.

## Data fields

| Field | Meaning | Unit | Source |
|-------|---------|------|--------|
| temperature | Patient body temperature | Fahrenheit (°F) | Oral thermometer, nursing staff |

## Codebook

- [Data](data/temperature.csv) — The raw value
- [Meaning](meaning/temperature.md) — What the value refers to
- [Structure](structure/temperature.md) — How the value is encoded
- [Context](context/temperature.md) — Domain, location, measurement method

## Boundaries

- [Jacek ↔ Ron](../../boundaries/ron--jacek/) — **INCOHERENT** (meaning and structure mismatch)
