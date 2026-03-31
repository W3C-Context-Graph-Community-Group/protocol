# Context Graph — Specification Index

This is the working specification for the **Context Graph** protocol, developed by the [W3C Context Graph Community Group](https://www.w3.org/community/context-graph/).

---

## Getting Started

All spec pages and demo codebooks live on GitHub Pages. Boundary logs are CSV files committed to git — diffable, versionable, auditable.

**To start measuring:**

1. Fork this repo
2. Add your system under `demo/systems/{your-name}/`
3. Create `context/`, `meaning/`, `structure/`, and `data/` folders with your codebook
4. Run the protocol against another system
5. Commit your boundary log as a CSV under `demo/boundaries/{you}--{them}/log.csv`

No infrastructure needed beyond a GitHub account.

## Contributing Measurements

Fork the repo into your own GitHub account. Add your system folder under `demo/systems/{your-name}/` with your context, meaning, structure, and data files. Commit boundary logs as CSV files. Submit a pull request if you want your measurements in the shared repo. All free. No paid account needed.

---

## Vocabulary (Canonical Claim Form)

Every claim is a five-column row:

| Column | Field | Description |
|--------|-------|-------------|
| 1 | [id](w3c-cg/vocab/id) | What is this claim about? |
| 2 | [source](w3c-cg/vocab/source) | Who makes this claim? |
| 3 | [timestamp](w3c-cg/vocab/timestamp) | When was this claim made? |
| 4 | [key](w3c-cg/vocab/key) | What property is being asserted? |
| 5 | [value](w3c-cg/vocab/value) | What is the asserted value? |

## Protocol (Connection Lifecycle)

| Phase | Message | Description |
|-------|---------|-------------|
| Handshake | [syn](w3c-cg/protocol/syn) | Handshake initiation |
| | [syn-ack](w3c-cg/protocol/syn-ack) | Handshake response |
| | [ack](w3c-cg/protocol/ack) | Handshake completion |
| Teardown | [fin](w3c-cg/protocol/fin) | Teardown initiation |
| | [fin-ack](w3c-cg/protocol/fin-ack) | Teardown acknowledgment |
| Error | [halt](w3c-cg/protocol/halt) | Boundary undecidable |
| | [timeout](w3c-cg/protocol/timeout) | Connection timeout |

## Facets (Four-Facet Evaluation)

| Order | Facet | Description |
|-------|-------|-------------|
| 1 | [context](w3c-cg/facet/context) | Context evaluation — checked first |
| 2 | [meaning](w3c-cg/facet/meaning) | Meaning comparison — what the value refers to |
| 3 | [structure](w3c-cg/facet/structure) | Structure comparison — how the value is encoded |
| 4 | [data](w3c-cg/facet/data) | Data comparison — the raw value |

## Demo

| Type | Page | Description |
|------|------|-------------|
| System | [Ron's System](w3c-cg/demo/systems/ron) | A source system publishing claims |
| System | [Jacek's System](w3c-cg/demo/systems/jacek) | A source system publishing claims |
| Boundary | [Ron ↔ Jacek](w3c-cg/demo/boundaries/ron--jacek) | Cross-system boundary evaluation |
