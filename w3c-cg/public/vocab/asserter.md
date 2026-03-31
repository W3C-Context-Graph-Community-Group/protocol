# asserter

**Column 2 of the Canonical Claim Form**

The asserter column answers: *who makes this claim?*

## Specification

- **Type:** URI (HTTP URI or URN)
- **Required:** Yes
- **Controlled by:** Each system provides its own asserter URI

## Usage

The asserter identifies which system or agent produced the claim. This is the column that makes rotation meaningful: without knowing who asserted a value, you cannot determine which reference frame produced it.

Each system brings its own identity. The protocol does not assign identities. A system's asserter URI can be any dereferenceable URI or a UUID URN. It must be consistent across all claims from that system.

## Examples

| System | Asserter value |
|--------|---------------|
| Ron's system | `https://w3c-cg.github.io/context-graph/demo/systems/ron` |
| Jacek's system | `https://w3c-cg.github.io/context-graph/demo/systems/jacek` |
| A trading desk | `https://company.com/systems/sgx-desk` |

## Informational irreducibility

Without the asserter column, frame identity is lost. You cannot determine which side of the boundary produced a claim, and inward/outward rotation collapses.

---

Part of the [Context Graph Canonical Claim Form](https://w3c-cg.github.io/context-graph/).
