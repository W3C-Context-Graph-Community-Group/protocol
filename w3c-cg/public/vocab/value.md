# value

**Column 5 of the Canonical Claim Form**

The value column answers: *what is being asserted?*

## Specification

- **Type:** Literal string or URI
- **Required:** Yes
- **Content:** Determined by the key

## Usage

The value carries the assertion's content. What goes here depends on the key:

| Key | Value contains |
|-----|---------------|
| `.../protocol/syn` | Cryptographic nonce |
| `.../protocol/syn-ack` | Responder nonce + hash of initiator nonce |
| `.../protocol/ack` | Hash of responder nonce |
| `.../facet/context` | Ask, response, or verdict |
| `.../facet/meaning` | Ask, response, or verdict |
| `.../facet/structure` | Ask, response, or verdict |
| `.../facet/data` | Ask, response, or verdict |

## Informational irreducibility

Without the value column, there is no content to compare. Claims exist but assert nothing.

---

Part of the [Context Graph Canonical Claim Form](https://w3c-cg.github.io/context-graph/).
