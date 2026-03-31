# Context: temperature

**Asserter:** [Ron's system](https://w3c-cg.github.io/context-graph/demo/systems/ron)

## Context declarations

These are the reference frames required to make Meaning and Structure comparisons well-defined for this field.

| Property | Value |
|----------|-------|
| Domain | HVAC / building management |
| Location | Building 7, Room 301 |
| Unit system | Metric (SI) |
| Sensor type | Ceiling-mounted air temperature sensor |
| Calibration | Factory calibrated, last verified 2025-11-01 |
| Sampling | Every 60 seconds, most recent reading |

## Required context for valid comparison

Any system comparing its `temperature` field against this one must surface at minimum: domain, unit system, and what the sensor measures. Without these, a match on Meaning or Structure is unverifiable.
