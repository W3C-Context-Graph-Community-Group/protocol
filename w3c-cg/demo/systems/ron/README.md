# Ron's System

**Source URI:** `https://w3c-cg.github.io/context-graph/demo/systems/ron`

## Domain

HVAC / building management system for Building 7.

## Data fields

| Field | Meaning | Unit | Source |
|-------|---------|------|--------|
| temperature | Indoor air temperature | Celsius (°C) | Ceiling-mounted sensor, Room 301 |

## Codebook

- [Data](data/temperature.csv) — The raw value
- [Meaning](meaning/temperature.md) — What the value refers to
- [Structure](structure/temperature.md) — How the value is encoded
- [Context](context/temperature.md) — Domain, location, calibration
- [Concept](concepts/temperature.md) — Live concept page (null state)

## Boundaries

- [Ron ↔ Jacek](../../boundaries/ron--jacek/) — **INCOHERENT** (meaning and structure mismatch)
