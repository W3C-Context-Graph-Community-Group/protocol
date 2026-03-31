# protocol/syn

**Handshake initiation**

## Specification

The initiating system sends a SYN claim to establish a boundary with another system.

- **State transition:** `NULL → SYN-SENT`
- **Key:** `https://w3c-cg.github.io/context-graph/protocol/syn`
- **Value:** A cryptographic nonce (random hex string)
- **Id:** A boundary URI minted by the initiator

## Semantics

The SYN claim says: "I want to establish a measured boundary with you. Here is a nonce proving this message is fresh."

## Timeout

If no [syn-ack](syn-ack.md) is received within the configured timeout, the initiator retransmits with exponential backoff. After all retries fail, a [timeout](timeout.md) claim is recorded.

## Example

```csv
id,source,timestamp,key,value
urn:boundary:ron-jacek,https://w3c-cg.../demo/systems/ron,2026-03-30T10:00:00.000Z,https://w3c-cg.../protocol/syn,7a3f9b2e
```

---

Part of the [Context Graph Protocol](https://w3c-cg.github.io/context-graph/).
