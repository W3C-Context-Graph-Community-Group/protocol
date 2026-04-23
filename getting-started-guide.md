# Context Graph Protocol — Getting Started Guide

When you hand an AI agent "2026-01-15" in a Date field, the agent makes assumptions.

Is this a trade date or a birthday? ISO format or US ordering? What timezone? Is "yesterday" already resolved, or is the agent about to resolve it from its own context?

Those assumptions drive the output. They determine whether the answer is right or wrong. But today they're invisible — and you can't fix what you can't see.

Without a shared coordinate system, you can't even tell there's something to measure. The dark assumptions stay dark because there's no geometry to locate them in.

We call the fraction of assumptions that are operating without being named **Dark Uncertainty**. It is computable, reducible, and — crucially — a prerequisite for anything else.

## Motivation

### Step 1 — See Dark Uncertainty (The Four Facet Model)

Every addressable unit in any system — a CSV column, a system prompt workflow on the backend, a UX field — gets four facets:

- **Data** — The content wrapped by **Context Graph Protocol Language** (*CGPL*) markup and captured at an interaction event.
- **Meaning** — The semantic domain the data refers to: what it *is about* in the world, not what it *is* on the page.
- **Structure** — The constraints, generators, and validators of a schema (JSON Schema syntax is default).
- **Context** — A time-ordered metadata log of events that have occurred on this unit — rule firings, resolutions, asks, answers, state changes.

Same four facets everywhere. That uniformity is the geometry. Once it's in place, the invisible becomes addressable with a URL. Before we can do anything, we need to be able to measure it. Without a shared geometry, there's no shared "perspective lines" to make comparisons at all.

### Step 2 — Score Dark Uncertainty in Real-Time (δ → "Dark Fraction Score")

With shared geometry, we can compute dark fraction:

$$\delta = 1 - \frac{|B_r|}{2^n}$$

<p align="center"><em>δ = 1 − |B<sub>r</sub>| / 2<sup>n</sup></em></p>

Data is part of the Shannon "message" — the communicated information in a transmission event. Its presence is what brings the spike into existence; a spike that isn't attached to the observatron's surface doesn't exist. Each spike is still a full tetrahedron geometrically, with Data as the base anchoring it to the node and Meaning, Structure, and Context rising as the three elevated faces. Uncertainty can only accumulate along those three elevated dimensions.

For a boundary with m variables, the formula operates on n = 3m verifiable facets — three per variable (Meaning, Structure, Context). r is how many of those facets have been verified. |B_r| is the Hamming ball cardinality. 2ⁿ is the joint configuration space.

Worked example — *δ = 74.61%*. A CSV drop with three variables: Date, Oil Price, Location. Only Date has been fully verified (all 3 of its facets populated); Oil Price and Location are untouched. So m = 3, n = 9, r = 3. The Hamming ball |B_3| = C(9,0) + C(9,1) + C(9,2) + C(9,3) = 1 + 9 + 36 + 84 = 130. That gives δ = 1 − 130/512 = 0.7461.

**The system is operating somewhere in a space of 512 possible configurations but can only confirm 130 of them. 74.61% of the boundary's interpretation space is unreachable by any within-boundary diagnostic.**

Closing each facet gap is a specific, countable action. Manual reduction becomes a measurable benchmark — the progression table below shows how δ moves as verifications accumulate.

#### Symbol Legend

| Symbol | Name | Description |
|---|---|---|
| `δ` | dark fraction | The computed score. Fraction of the joint configuration space still unresolved. Ranges from 0 (fully verified) to nearly 1 (fully dark). Unitless. |
| `m` | variable count | Number of variables at the boundary — columns in a dataset, fields in a form, slots in a query. |
| `n` | facet count | Total verifiable facets, always **3m**. Three facets per variable: Meaning, Structure, Context. Data anchors the spike but is not verifiable in the score. |
| `r` | verified count | How many of the n facets have been populated with a verification value. Moves from 0 to n as reduction happens. |
| `B_r` | Hamming ball of radius r | The set of configurations reachable within r verifications of the fully-verified state. |
| `\|B_r\|` | cardinality of B_r | Count of configurations in the Hamming ball. Computed as Σ C(n, k) for k = 0..r. |
| `2ⁿ` | joint configuration space (\|Ω\|) | All possible configurations across the n verifiable facets. For m=3, n=9 and 2⁹ = 512. |


#### Facet Population Progression (m=3, n=9)

For a three-variable boundary, δ moves through these values as facets are verified. Open the **Dark Fraction Calculator** and toggle facets to watch this progression live:

| Facets verified (r) | \|B_r\| | δ = 1 − \|B_r\|/512 | Approximation |
|---|---|---|---|
| 0 | 1 | 1 − 1/512 | ~99.8% dark |
| 1 | 10 | 1 − 10/512 | ~98.0% dark |
| 2 | 46 | 1 − 46/512 | ~91.0% dark |
| 3 | 130 | 1 − 130/512 | ~74.6% dark |
| 4 | 256 | 1 − 256/512 | ~50.0% dark |
| 5 | 382 | 1 − 382/512 | ~25.4% dark |
| 6 | 466 | 1 − 466/512 | ~9.0% dark |
| 7 | 502 | 1 − 502/512 | ~2.0% dark |
| 8 | 511 | 1 − 511/512 | ~0.2% dark |
| 9 | 512 | 0 | 0% dark |

Notice the S-curve. The first verifications barely move δ — the unverified space is combinatorially enormous. The middle verifications drop δ sharply. The final verifications finish the collapse. Verification effort pays off most in the middle of the reduction loop.

#### Source of Truth
The Dark Fraction Calculator is the canonical reference implementation of this formula. Any claim in this spec about what δ should be for a given (m, r) pair can be verified by setting up that configuration in the calculator. The calculator handles large-m computation via log-space arithmetic; for m > 20, |Ω| exceeds a million configurations and naive integer math breaks. Implementations should follow the calculator's log-space approach when scaling.



### Step 3 — Minimize Dark Uncertainty with Observatrons

Observatrons can mechanize a specific task: *populate this facet given these inputs*. That's an engineering problem with a definition of done — not a vague "reduce uncertainty" goal. An **observatron** is the unit that performs this work: an autonomous state machine stationed at a boundary, watching what crosses, and resolving facets either deterministically or by asking a human.

In our **Getting Started** example, we will focus on Observatrons across the entire stack — minimal, but end-to-end:

- **UX**: The drag & drop area in HTML
- **API**: Back-end service layer
- **SQL**: Intent mapping to query slots


----

## What CGP Is

The **Context Graph Protocol** is a syntax that layers over any other syntax — HTML, system prompts, CSV, JSON, SQL, plain text — to bind addressable units across systems to a shared four-facet geometry.

Of the four facets introduced in Step 1, each plays a distinct role:

Data is the Shannon message — the communicated information in a transmission event. It anchors the spike to the observatron's surface.
Meaning and Structure describe the message statically — what it refers to and how it's encoded.
Context is different: it's a time-ordered log where external actions leave their trace on the node. If Meaning and Structure describe the message, Context records its collisions with the world. The graph grows by collision.

Because the graph's shape adapts as actions flow through it, we call it Liquid — the protocol's substrate moves between hosts and media without losing identity, taking whichever shape its container demands.

## Try It Yourself — Dark Fraction Calculator

Before diving into code, play with the geometry directly. The **Dark Fraction Calculator** lets you toggle facets on a single field and watch δ change in real time.

![Dark Fraction Calculator](figures/dark_fraction_calculator.png)

<a href="https://w3c-context-graph-community-group.github.io/dark_fraction/calculator/" target="_blank" rel="noopener noreferrer">→ Open the Dark Fraction Calculator</a>

Click **M** to populate Meaning, **S** for Structure, and **C** for Context. Each click closes one facet gap and reduces the dark fraction. Start with everything off and close facets one at a time until you reach δ = 0. That's the full manual reduction loop in about four clicks.

This is the core interaction the protocol enables. Everything in the rest of this guide — wrappers, URL structure, the runtime, the demo — is machinery to surface this same loop across real systems.

## Quick Start

The fastest path from zero to a working CGP observation. Wrap a DOM element, drop a CSV onto it, watch the four-facet graph materialize in real time.

### Install

```bash
npm install cgp-runtime cgp-components
```

### Wrap an element

Import the component once at the top of your page, then wrap any element you want to observe with a `<cgp-drag-and-drop>` tag:

```html
<script type="module">
  import "cgp-components/drag-and-drop";
</script>

<cgp-drag-and-drop system-id="0" observatron-id="1">
  <div class="drop-target">Drop a CSV here</div>
</cgp-drag-and-drop>
```

The tag takes two attributes:
- `system-id` — any URL-safe string; your system's identifier
- `observatron-id` — any URL-safe string; this observatron's identifier within the system

The wrapper is transparent. The inner `<div>` remains the drop target. On page load, the wrapper instantiates an observatron and mints two nodes: `cgp:/s/0` (the system) and `cgp:/s/0/o/1` (the observatron), each with their four facets populated.

### Listen for state changes

Every observation dispatches a `cgp-state-change` CustomEvent. Listen anywhere on the page:

```html
<script>
  document.addEventListener("cgp-state-change", (event) => {
    console.log(event.detail.state);
  });
</script>
```

The `event.detail.state` is a flat object keyed by URL, with each URL's four facets as its value.

### Drop a CSV

Drop a single-column CSV onto the target. The console logs the full URL set:

```json
{
  "cgp:/s/0":                       { "/data": "0", "/meaning": "0", "/structure": { "kind": "system" }, "/context": [ /* ... */ ] },
  "cgp:/s/0/o/1":                   { "/data": "1", "/meaning": "1", "/structure": { "kind": "observatron" }, "/context": [ /* ... */ ] },
  "cgp:/s/0/o/1/e/0":               { "/data": [ /* ... */ ], "/meaning": "0", "/structure": { "kind": "emission", "trigger": "drop" }, "/context": [ /* ... */ ] },
  "cgp:/s/0/o/1/e/0/d/0":           { "/data": "Date\n2026-01-15\n2026-01-16", "/meaning": "sales.csv", "/structure": { "kind": "dataset", "format": "csv" }, "/context": [ /* ... */ ] },
  "cgp:/s/0/o/1/e/0/d/0/p/0":       { "/data": ["2026-01-15", "2026-01-16"], "/meaning": "Date", "/structure": { "kind": "path", "type": "string" }, "/context": [ /* ... */ ] }
}
```

Five nodes. Each path node is a spike — a column with its four facets ready for dark fraction measurement.

### What you just ran

1. **A system was declared** (`cgp:/s/0`) when the page loaded.
2. **An observatron was stationed** at the wrapped boundary (`cgp:/s/0/o/1`).
3. **An emission fired** when you dropped the file (`cgp:/s/0/o/1/e/0`).
4. **A dataset was minted** for the CSV (`cgp:/s/0/o/1/e/0/d/0`).
5. **A path was minted** for the Date column (`cgp:/s/0/o/1/e/0/d/0/p/0`).

Each node carries its four facets. The Date column is a spike with three verifiable facets (Meaning, Structure, Context). Data — the column values — anchors the spike to the observatron's surface. At drop time, none of the three verifiable facets have actual verification values yet: the header "Date" is just a label, not a semantic resolution. So this one-column boundary has m=1, n=3, r=0, and δ ≈ 0.875. That's where dark uncertainty lives, and the rest of this guide explains how to close those gaps.

## CGP URL Structure

Every URL is five positional slots. Each is prefixed by a single letter.

```
/s/<system-id>/o/<observatron-id>/e/<emission-id>/d/<dataset-id>/p/<path>
```

Full form with scheme: `cgp:/s/1/o/1/e/0/d/0/p/0`.

### Slots

| Slot | Prefix | What it addresses |
|---|---|---|
| system | `s` | Unit of scope. Instantiates observatrons. |
| observatron | `o` | Agent stationed at a boundary. The node. |
| emission | `e` | One act of observation. |
| dataset | `d` | One data region produced by an emission (e.g., one CSV, one JSON, one message). |
| path | `p` | One unit within a dataset (e.g., one column, one JSON Pointer target). |

### IDs

**System and observatron IDs are user-supplied** — typically integers, but any URL-safe string works.

**Emission, dataset, and path IDs are auto-generated integers starting at 0**, scoped to their parent. Counters reset per parent: each emission numbers its own datasets from `0`; each dataset numbers its own paths from `0`.

### Facets

Every URL has four facets, written as terminal path segments:

```
<url>/data        what it is
<url>/meaning     what it refers to
<url>/structure   how it is encoded
<url>/context     a time-ordered log of what has happened
```

All four apply at every slot depth. `/s/1/data` is valid. So is `/s/1/o/1/e/0/d/0/p/0/data`.

Every `/context` facet is a four-column table — `timestamp`, `category`, `key`, `value` — where rows accumulate in append-only order. Context is the collision surface: where actions, events, and timestamped interactions leave their trace on a node.

### Truncation

Any prefix of the slot pattern is a node. Each has its own four facets.

```
/s/1                          the system
/s/1/o/1                      an observatron
/s/1/o/1/e/0                  an emission
/s/1/o/1/e/0/d/0              a dataset
/s/1/o/1/e/0/d/0/p/0          a path
```

### Reserved

The system id `root` is reserved for the protocol's own self-description. All other IDs — including `0`, `1`, `2`, … — are available to user systems.

Reserved namespaces under `cgp:/root`:

| Segment | Purpose |
|---|---|
| `cgp:/root/events` | Registry of event type definitions. Each event lives at `cgp:/root/events/<source>/<name>` with the standard four facets. |
| `cgp:/root/claims` | Reserved for future claim log storage. See Claims section. |

## Claims

A **claim** is a single assertion: at a specific time, a specific node said something about something. Claims are how CGP graphs are exchanged between systems and how the graph's history is made portable.

The protocol's primary storage is the URL-addressed facet store you just saw in the Quick Start. Claims are a **view** over that store — projected when needed, not stored as the authoritative form. A running implementation reads and writes facets directly; claims are generated for export, comparison, and audit.

### The Five Columns

Every claim has exactly five columns.

| Column | Holds | Example |
|---|---|---|
| `event-type` | URL of the kind of claim being made. References a definition under `cgp:/root/events/`. | `cgp:/root/events/observatron/state-change` |
| `source` | URL of the node the claim originated from. | `cgp:/s/0/o/1/e/0` |
| `timestamp` | When the claim was made. ISO 8601 UTC, millisecond precision. | `2026-04-22T22:30:00.003Z` |
| `key` | The URL the claim is about, typically with a facet reference. | `cgp:/s/0/o/1/e/0/d/0/p/0/data` |
| `value` | The asserted value. A literal or a URL. | `["2026-01-15", "2026-01-16"]` |

Read a claim left-to-right as a sentence: *at `timestamp`, `source` asserted that `key` has `value`, as a claim of kind `event-type`*.

### Identity Is Positional

When claims are stored as an ordered array, the position in the array is the claim's identity. No `id` column is needed — index N is claim N.

Individual claims become URL-addressable when they need to be referenced: claim N in observatron O's log is addressable as `cgp:/s/<sid>/o/<oid>/claims/<n>`. The URL is constructed on demand from the log's location and the claim's index; it does not live inside the claim itself.

### When Claims Are Needed

Claims become load-bearing when two independent systems must **compare** their graphs. In a single-implementation, single-session context — like the Quick Start above — reading facets directly from the store is sufficient. Claims are needed for:

- Exchanging graph state between implementations (wire format).
- Auditing who asserted what, when (provenance).
- Reconciling disagreements across observatrons (comparison).
- Replaying history deterministically (fixtures, testing).

Until one of these use cases is active, the claims log is not instantiated. The facet store remains the source of truth, and the claim form is projected on demand when exchange or audit is needed.

## Machinery Summary

Every section of this guide introduces one piece of machinery serving the three-step loop:

- **URLs** address the nodes (→ URL Structure section).
- **Facets** store the content (→ Step 1, Quick Start).
- **Emissions** record what crossed the boundary (→ Quick Start).
- **Claims** exchange the graph between systems (→ Claims section).
- **Observatrons** do the work (→ Step 3, Pilot).

## The Pilot

The protocol is tested end-to-end with a **single-observatron, two-boundary pilot**. One observatron watches a user-facing CSV drop and a database-facing SQL resolution — the same protocol, the same geometry, running across the front-to-back seam most systems fail at silently.

### Boundary 1 — Front End

A user drops a CSV containing columns like name (with values like "John Smith") and date (with values like "2026-01-15"). The observatron over the drag-and-drop wrapper mints the usual nodes and populates facets. Each column arrives with Data anchored but Meaning, Structure, and Context not yet verified — which name refers to which real-world person? what timezone applies to the dates? Dark fraction is measurable. The observatron either resolves facets with deterministic rules or fires an ASK to the user.

### Boundary 2 — Back End

The same observatron also watches the SQL query that attempts to resolve "John Smith" against a `users` table. If there are ten John Smiths in the database, the query's result column has ten candidate values — high dark fraction on `/meaning` (which John?). The observatron surfaces this ambiguity the same way it surfaces front-end ambiguity: by measuring δ and firing an ASK.

### What the Pilot Proves

| Claim | How it's demonstrated |
|---|---|
| Front-end and back-end geometries are the same geometry. | Both boundaries use the same four facets, the same URL structure, the same δ formula. No translation layer. |
| Dark fraction reduction composes across boundaries. | The user's front-end disambiguation directly lowers back-end δ by narrowing the SQL result set. |
| δ is the single metric. | The pilot measures δ_start and δ_end on both sides. The difference is the value the observatron delivered. |

### The Simplest Agentic Workflow

Agent receives CSV → protocol measures δ → agent closes facet gaps (deterministically or by asking the user) → disambiguated result becomes a SQL query → back-end observatron measures query's δ → loop exits when δ is below threshold.

No black-box "did it work." Just a measurable reduction from δ_start to δ_end, visible at every step.

## What's Next

The getting-started guide above covers the protocol's concepts and the front-end demo. Subsequent documents cover:

- **Runtime API** — `createObservatron`, `mintEmission`, `mintDataset`, `mintPath`, `getState`.
- **Derivation fixtures** — input/output pairs that conforming implementations must match byte-for-byte.
- **Events registry** — the canonical list of event-type URLs and their facet definitions.
- **Back-end bindings** — how observatrons are stationed on SQL boundaries, API endpoints, and other non-DOM surfaces.
