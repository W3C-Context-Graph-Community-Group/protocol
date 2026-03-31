# Structure: temperature

**Asserter:** [Jacek's system](https://w3c-cg.github.io/context-graph/demo/systems/jacek)

## Specification

| Property | Value |
|----------|-------|
| Unit | Fahrenheit (°F) |
| Data type | Integer |
| Precision | 1°F |
| Valid range | 90–110 |
| Null allowed | No |
| Format | Bare integer, no unit suffix |

## Note

A value of `30` in this system would be **outside the valid range** (90–110°F). This would indicate either a sensor malfunction, a data entry error, or — most likely — that the value originated from a different codebook entirely.
