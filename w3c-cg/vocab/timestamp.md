# timestamp

**Column 3 of the Canonical Claim Form**

The timestamp column answers: *when was this claim made?*

## Specification

- **Type:** ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SS.sssZ`)
- **Required:** Yes
- **Produced by:** The asserting system at the moment of claim generation

## Usage

The timestamp records when the claim was produced. All timestamps are in UTC. This enables sequence reconstruction, drift detection, and latency measurement across boundaries.

## Informational irreducibility

Without the timestamp column, sequence is lost. You cannot determine which claim came first, whether codebooks have drifted over time, or how long a handshake took.

---

Part of the [Context Graph Canonical Claim Form](https://w3c-cg.github.io/context-graph/).
