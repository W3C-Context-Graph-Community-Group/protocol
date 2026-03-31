# key

**Column 4 of the Canonical Claim Form**

The key column answers: *what property is being asserted?*

## Specification

- **Type:** URI (HTTP URI pointing to a vocabulary term)
- **Required:** Yes
- **Resolves to:** A documentation page defining the term

## Usage

The key identifies what property the claim asserts. Every key URI should be dereferenceable — following the link gives you the definition. The key column is where the Context Graph vocabulary URLs appear.

The key column is the **edge-forming mechanism**: any two claims sharing a key form a hyperedge in the liquid hypergraph. This is what makes the accumulating record a graph rather than a flat log.

## Key namespaces

| Prefix | Purpose | Example |
|--------|---------|---------|
| `.../protocol/` | Handshake and lifecycle | `.../protocol/syn` |
| `.../facet/` | Four-facet evaluation | `.../facet/meaning` |

The namespace is open. Any domain can mint keys under its own authority.

## Informational irreducibility

Without the key column, no edges form. The graph collapses to a flat log with no structure.

---

Part of the [Context Graph Canonical Claim Form](https://w3c-cg.github.io/context-graph/).
