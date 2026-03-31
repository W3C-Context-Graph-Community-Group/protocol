# entity

**Column 1 of the Canonical Claim Form**

The entity column answers: *what is this claim about?*

## Specification

- **Type:** URI (HTTP URI or URN)
- **Required:** Yes
- **Minted by:** The system initiating the boundary

## Usage

The entity identifies the subject of the claim. All claims sharing an entity URI are about the same thing. At the protocol level, the entity for handshake claims is a boundary URI minted by the initiating system.

The entity does not need to be dereferenceable. A UUID URN (`urn:uuid:550e8400-...`) is valid. What matters is that it is consistent across all claims about the same subject.

## Examples

| Context | Entity value |
|---------|-------------|
| A boundary between two systems | `urn:boundary:ron-jacek` |
| A specific data field | `urn:field:temperature:sensor-7` |
| A trade record | `urn:trade:001` |

## Informational irreducibility

Without the entity column, claims become unlinkable. There is no way to determine which claims are about the same subject.

---

Part of the [Context Graph Canonical Claim Form](https://w3c-cg.github.io/context-graph/).
