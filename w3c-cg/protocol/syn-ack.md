# protocol/syn-ack

**Handshake response**

## Specification

The responding system acknowledges the SYN and proves receipt.

- **State transition:** `SYN-SENT → SYN-RECEIVED`
- **Key:** `https://w3c-cg.github.io/context-graph/protocol/syn-ack`
- **Value:** Responder's nonce + `:` + SHA-256 hash of initiator's nonce
- **Id:** Same boundary URI from the SYN claim

## Semantics

The SYN-ACK says: "I received your nonce (here's the hash proving it). Here is my own nonce. I accept the boundary."

## Example

```csv
id,source,timestamp,key,value
urn:boundary:ron-jacek,https://w3c-cg.../demo/systems/jacek,2026-03-30T10:00:00.347Z,https://w3c-cg.../protocol/syn-ack,c4d5e6f7:sha256(7a3f9b2e)
```

---

Part of the [Context Graph Protocol](https://w3c-cg.github.io/context-graph/).
