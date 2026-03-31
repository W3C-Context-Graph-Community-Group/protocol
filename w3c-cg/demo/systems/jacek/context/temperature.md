# Context: temperature

**Source:** [Jacek's system](https://w3c-cg.github.io/context-graph/demo/systems/jacek)

## Context declarations

| Property | Value |
|----------|-------|
| Domain | Clinical / inpatient care |
| Location | Ward 4B, City Hospital |
| Unit system | Imperial (US customary) |
| Measurement method | Oral thermometer, nursing staff |
| Calibration | Device-level, per hospital protocol |
| Sampling | Per vitals check (typically every 4 hours) |

## Required context for valid comparison

Any system comparing its `temperature` field against this one must surface at minimum: domain (clinical vs. non-clinical), unit system, and measurement method. A room temperature reading and a body temperature reading are not comparable regardless of unit alignment.
