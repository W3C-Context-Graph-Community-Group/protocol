# Context Graph Protocol

Two systems exchange data. This protocol determines whether they mean the same thing.

**Base URI:** `https://w3c-context-graph-community-group.github.io/protocol/`  
**Prefix:** `cg:` (Context Graph)  
**Version:** 0.7 — April 2026  
**Status:** Working draft.

---

## The Problem

Every algorithm that takes a data matrix as input assumes all rows share a common codebook — that column j means the same thing in row i as in row i′. This assumption is never checked. When it fails at a system boundary, the algorithm executes, the loss function reports a number, and the output is confidently wrong.

The information needed to verify the assumption is on the other side of the boundary. No computation within a single system can produce it.

## The Fix

Put an instrument at the boundary. Let it ask.

---

## How It Works

### 1. Instantiate an observatron

The observatron is the protocol's measurement instrument. Your system creates one and grants it access to your codebook.

```
source = cg:protocol/observatron/your-system-name
```

If you don't provide a name, one is auto-generated.

### 2. Deploy it at a boundary

Point the observatron at the system you're exchanging data with. This assigns a boundary id.

```
id = cg:protocol/boundary/your-system--their-system
```

The observatron now has two channels: inward (your codebook) and outward (their signals).

### 3. Handshake

**Bilateral** — both sides run the protocol. Cryptographic nonce exchange proves receipt.

```
SYN       →  value: 7a3f9b2e (nonce)
SYN-ACK   ←  value: c4d5e6f7:sha256(7a3f9b2e)
ACK       →  value: sha256(c4d5e6f7)
```

**Unilateral** — the other side doesn't run the protocol (a human, a legacy API). Your observatron still logs the handshake, recording observed signals instead of protocol responses.

### 4. Evaluate four facets

Each facet is compared in dependency order. If an upstream facet fails, downstream evaluation stops.

```
context   →  Are we in the same reference frame?     (if no → Halt)
meaning   →  Do we mean the same thing?              (if no → Ask)
structure →  Is it encoded the same way?              (if no → Ask)
data      →  Does the value match?                    (if no → Ask, if yes → Act)
```

**Halt** = can't reason here. **Ask** = need more information. **Act** = codebooks aligned, proceed.

### 5. Record every measurement

Every ask, response, and verdict is a canonical claim — one row, five columns:

| id | source | timestamp | key | value |
|---|---|---|---|---|
| boundary URI | observatron URI | ISO 8601 UTC | facet URI | the assertion |

Claims sharing an `(id, key)` pair form a hyperedge in the graph. Edges exist only because measurements were made. Absent edges are unmeasured boundaries.

### 6. Close

```
FIN       →  value: reason:complete
FIN-ACK   ←  value: ack
```

The full trace — SYN to FIN-ACK — is your audit trail.

---

## Three Boundary States

Every boundary facet you haven't measured is in one of these states:

| State | What it means | What it looks like from inside |
|---|---|---|
| **Null** | No slot exists. You don't know you don't know. | Confidence. No alarm. |
| **Undefined** | Slot exists, no value. You know you have a gap. | Known gap. |
| **Verified** | Measured. Match, mismatch, or conditional. | Confidence. No alarm. |

Null and verified are indistinguishable from inside. That's the problem this protocol solves.

---

## Coherence Coverage

```
C = |E| / N
```

|E| = boundary facets measured. N = total boundary facets. C ∈ [0, 1].

C measures awareness, not correctness. Two systems measured and found misaligned still contribute to |E|. The graph shows you exactly which facets remain unmeasured.

---

## Vocabulary

37 definitions. 185 dereferenceable URIs.

| Path | What it defines | Count |
|---|---|---|
| [`substrate/`](substrate/) | The five canonical columns: id, source, timestamp, key, value | 5 |
| [`facet/`](facet/) | The four comparison facets: context, meaning, structure, data | 4 |
| [`epistemic/`](epistemic/) | Three boundary states: null, undefined, verified | 3 |
| [`protocol/`](./) | Reasoning modes (halt, ask, act) and verbs (syn, syn-ack, ack, fin, fin-ack, halt, timeout) | 10 |
| [`handshake/`](handshake/) | Two modes: bilateral, unilateral | 2 |
| [`lifecycle/`](lifecycle/) | Two setup steps: instantiation, deployment | 2 |
| [`connection/`](connection/) | Seven connection states | 7 |
| [`operation/`](operation/) | Rotation: the unit of measurement | 1 |
| [`metric/`](metric/) | Coherence coverage: C = \|E\|/N | 1 |
| [`rule/`](rule/) | No edge without rotation | 1 |
| [`model/`](model/) | The observatron's intent map (decision engine) | 1 |

---

## Quick Start

```bash
# Clone the protocol
git clone https://github.com/W3C-Context-Graph-Community-Group/protocol.git ~/w3c/cg/protocol

# Clone the log (where observed claims go)
git clone https://github.com/W3C-Context-Graph-Community-Group/log.git ~/w3c/cg/log

# Clone the demo (working example)
git clone https://github.com/W3C-Context-Graph-Community-Group/demo.git ~/w3c/cg/demo
```

The protocol repo is definitions. The log repo is observations. The demo repo is implementation. Definitions are not instances.

---

## Links

- **Paper:** [Liquid Hypergraphs: A Context Graph Protocol](https://zenodo.org/records/19192949) (working draft)
- **W3C Community Group:** [W3C Context Graph Community Group](https://www.w3.org/community/context-graph/)
- **GitHub:** [W3C-Context-Graph-Community-Group](https://github.com/W3C-Context-Graph-Community-Group)