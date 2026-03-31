# Context Graph — Specification Index

This is the working specification for the **Context Graph** protocol, developed by the [W3C Context Graph Community Group](https://www.w3.org/community/context-graph/).

---

## Vocabulary (Canonical Claim Form)

Every claim is a five-column row:

| Column | Field | Description |
|--------|-------|-------------|
| 1 | [id](vocab/id) | What is this claim about? |
| 2 | [source](vocab/source) | Who makes this claim? |
| 3 | [timestamp](vocab/timestamp) | When was this claim made? |
| 4 | [key](vocab/key) | What property is being asserted? |
| 5 | [value](vocab/value) | What is the asserted value? |

## Protocol (Connection Lifecycle)

| Phase | Message | Description |
|-------|---------|-------------|
| Handshake | [syn](protocol/syn) | Handshake initiation |
| | [syn-ack](protocol/syn-ack) | Handshake response |
| | [ack](protocol/ack) | Handshake completion |
| Teardown | [fin](protocol/fin) | Teardown initiation |
| | [fin-ack](protocol/fin-ack) | Teardown acknowledgment |
| Error | [halt](protocol/halt) | Boundary undecidable |
| | [timeout](protocol/timeout) | Connection timeout |

## Facets (Four-Facet Evaluation)

| Order | Facet | Description |
|-------|-------|-------------|
| 1 | [context](facet/context) | Context evaluation — checked first |
| 2 | [meaning](facet/meaning) | Meaning comparison — what the value refers to |
| 3 | [structure](facet/structure) | Structure comparison — how the value is encoded |
| 4 | [data](facet/data) | Data comparison — the raw value |

## Demo

| Type | Page | Description |
|------|------|-------------|
| System | [Ron's System](demo/systems/ron) | A source system publishing claims |
| System | [Jacek's System](demo/systems/jacek) | A source system publishing claims |
| Boundary | [Ron ↔ Jacek](demo/boundaries/ron--jacek) | Cross-system boundary evaluation |
