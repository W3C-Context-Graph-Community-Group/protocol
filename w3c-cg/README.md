# Context Graph

**A coherence protocol for system boundaries.**

Two systems exchange data. The bits arrive unchanged. The meaning may not. This repository provides the specification and a live demo of a protocol that detects codebook misalignment at system boundaries — the class of error that no existing instrument measures.

## The problem in one sentence

`temperature = 30` means "a warm room" in one system and "a deceased patient" in another. The column name matches. The value matches. Every standard instrument reports success. The answer is wrong.

## Repository structure

```
context-graph/
│
├── vocab/                     ← THE SPEC: Column definitions
│   ├── id.md                  Column 1: what is this claim about?
│   ├── source.md              Column 2: who makes this claim?
│   ├── timestamp.md           Column 3: when?
│   ├── key.md                 Column 4: what property?
│   └── value.md               Column 5: what assertion?
│
├── protocol/                  ← THE SPEC: Connection lifecycle
│   ├── syn.md                 Handshake initiation
│   ├── syn-ack.md             Handshake response
│   ├── ack.md                 Handshake completion
│   ├── fin.md                 Teardown initiation
│   ├── fin-ack.md             Teardown acknowledgment
│   ├── halt.md                Boundary undecidable
│   └── timeout.md             Connection timeout
│
├── facet/                     ← THE SPEC: Four-facet evaluation
│   ├── context.md             Resolution layer (checked first)
│   ├── meaning.md             What the value refers to
│   ├── structure.md           How the value is encoded
│   └── data.md                The raw value
│
└── demo/                      ← A LIVE DEMO: Two systems, one boundary
    ├── systems/
    │   ├── ron/               Ron's codebook
    │   │   ├── data/temperature.csv
    │   │   ├── meaning/temperature.md
    │   │   ├── structure/temperature.md
    │   │   └── context/temperature.md
    │   └── jacek/             Jacek's codebook
    │       ├── data/temperature.csv
    │       ├── meaning/temperature.md
    │       ├── structure/temperature.md
    │       └── context/temperature.md
    └── boundaries/
        └── ron--jacek/        The boundary between them
            ├── log.csv        ← THE LIQUID HYPERGRAPH
            └── README.md      Protocol result summary
```

## How to read the demo

1. **Start with the data.** Both systems have a file called `temperature.csv`. Both contain the value `30`. Open them — they're identical.

2. **Read the codebooks.** Open Ron's `meaning/temperature.md` and Jacek's `meaning/temperature.md` side by side. Ron means indoor air temperature. Jacek means patient body temperature. Same column name. Different referent.

3. **Read the log.** Open `boundaries/ron--jacek/log.csv`. This is the protocol trace — 17 canonical claims recording the complete handshake, facet evaluation, and teardown. Every URL in the `key` column links back to a spec page in this repository.

4. **Read the result.** Open `boundaries/ron--jacek/README.md`. The boundary is incoherent: meaning mismatch, structure mismatch, data comparison undefined.

## The canonical claim form

Every assertion from every system reduces to one row in a five-column table:

| id | source | timestamp | key | value |
|--------|----------|-----------|-----|-------|
| What is this about? | Who says so? | When? | What property? | What assertion? |

The five columns are informationally irreducible. Remove any one and the protocol breaks:

- No **id** → claims become unlinkable
- No **source** → cannot tell which side of the boundary produced the claim
- No **timestamp** → cannot detect drift or reconstruct sequence
- No **key** → no edges form; the graph collapses to a flat log
- No **value** → nothing to compare

## The protocol

1. **Handshake** (3 claims): SYN → SYN-ACK → ACK. Establishes gauge compatibility and bidirectional rotation. Does NOT establish any codebook alignment.

2. **Four-facet evaluation** (12 claims per field): Context → Meaning → Structure → Data. Each facet is a three-step rotation: Ask / Response / Verdict.

3. **Teardown** (2 claims): FIN → FIN-ACK. Records final boundary state.

The protocol produces three actions:

- **Halt:** Context insufficient. Cannot reason here at all.
- **Ask:** Mismatch identified. Uncertainty is reducible.
- **Act:** All facets aligned. Boundary is coherent. Proceed.

## The liquid hypergraph

The `log.csv` file IS the liquid hypergraph. Its edges exist because measurements were made. Its absent edges represent unmeasured boundaries. The construction principle: **no edge without rotation**.

Coherence coverage: C = |E| / N, where |E| is measured facets and N is total facets. In this demo: 3 facets measured out of 4 possible (data comparison was undefined due to upstream misalignment), so C = 3/4 = 0.75.

## Papers

- [Liquid Hypergraphs: Edges Constructed by Rotation, Not by Schema](https://github.com/w3c-cg/context-graph) (Itelman & Kowalski, 2026)
- [Decisions Under Null Uncertainty](https://zenodo.org/records/19192949) (Itelman, 2026)
- [Liquid Coherence](https://zenodo.org/records/19005457) (Itelman, 2026)

## W3C Context Graph Community Group

This work is developed under the [W3C Context Graph Community Group](https://www.w3.org/community/context-graph/).

## License

[W3C Community Contributor License Agreement](https://www.w3.org/community/about/agreements/cla/).
