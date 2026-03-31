# protocol/ack

**Handshake completion**

## Specification

The initiating system confirms the three-way handshake.

- **State transition:** `SYN-RECEIVED → ESTABLISHED`
- **Key:** `https://w3c-cg.github.io/context-graph/protocol/ack`
- **Value:** SHA-256 hash of responder's nonce
- **Id:** Same boundary URI

## Semantics

The ACK says: "I received your nonce (here's the hash). The boundary is established."

## What is now established

1. **Gauge compatibility** — both systems can project onto five columns
2. **Bidirectional rotation** — A can reach B, B can reach A
3. **Boundary visibility** — the boundary now exists in the hypergraph
4. **Identity** — both systems have source URIs on record

## What is NOT established

Any codebook alignment. That requires Phase 2 (facet evaluation).

---

Part of the [Context Graph Protocol](https://w3c-cg.github.io/context-graph/).
