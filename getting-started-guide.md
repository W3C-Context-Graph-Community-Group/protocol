# Context Graph Protocol — Getting Started Guide

When you hand an AI agent "2026-01-15" in a Date field, the agent makes assumptions.

Is this a trade date or a birthday? ISO format or US ordering? What timezone? Is "yesterday" already resolved, or is the agent about to resolve it from its own context?

Those assumptions drive the output. They determine whether the answer is right or wrong. But today they're invisible — and you can't fix what you can't see.

Without a shared coordinate system, you can't even tell there's something to measure. The dark assumptions stay dark because there's no geometry to locate them in.

We call the fraction of assumptions that are operating without being named **Dark Uncertainty**. It is computable, reducible, and — crucially — a prerequisite for anything else.

## Motivation

### Step 1 — See Dark Uncertainty

Every addressable unit in any system — a CSV column, a system prompt section, a UX field — gets four facets: what it is, what it refers to, how it's encoded, and what's happened to it. Same four facets everywhere. That uniformity is the geometry. Once it's in place, the invisible becomes addressable.

### Step 2 — Quantify and Reduce It

With shared geometry, we can compute dark fraction: the portion of facets that are unpopulated. A field with three unresolved facets is 75% dark. Closing each gap is a specific, countable action. Manual reduction becomes a measurable benchmark.

### Step 3 — Automate It

Now automation has a target. You can't automate "reduce uncertainty" — that's not a spec. You can automate "populate this field's meaning facet given these inputs" — that's an engineering problem with a definition of done.

### Why This Matters

Skip steps 1 and 2 and you don't get interoperable AI. You don't get semantic exchange across systems.

You get closed-system illusions that hold together until they meet another system and silently diverge, because nobody ever made the assumptions visible enough to compare. That's when things start silently breaking in hard-to-trace patterns.

## What CGP Is

The **Context Graph Protocol** is a syntax that layers over any other syntax — HTML, system prompts, CSV, JSON, plain text — to bind addressable units across systems to a shared four-facet geometry.

Three facets describe a unit at rest:
- **Data** — what it is
- **Meaning** — what it refers to
- **Structure** — how it's encoded

The fourth is different: **Context** is a time-ordered log where external actions leave their trace on the node. If data, meaning, and structure are the node's shape, context is where energy meets that shape. Every interaction, every event, every timestamped action appends a row to some unit's context. The graph grows by collision.

Because the graph's shape adapts as actions flow through it, we call it **Liquid** — the protocol's substrate moves between hosts and media without losing identity, taking whichever shape its container demands.

This guide shows you how to wrap any component on any medium with CGP tags, compute dark fraction against the four-facet geometry, and build the first piece of machinery — the drag-and-drop demo — that makes this concrete.

## Core Mission: Minimize Dark Uncertainty for Better Decisions

Following principles from Active Inference, the core purpose of the protocol is to identify and minimize dark uncertainty in a transparent way, so that beliefs across the system and with the intent of the user can be verified.

This is different than the semantic approach of **invariance**. In CGP, the user, in their local environment, and with their own words, has **semantic sovereignty**. They are responsible their intent and their language can be understood by a system that can integrate with semantic interoperability, if chosen by the CGP architect.

When the fraction of Dark Uncertainty is higher than a threshold, an "ASK" event is fired, which is an **internal** decision gate. **External** decision models will have a clear understanding of dark uncertainty so that they can make better decisions.

Minimizing Dark Uncertainty means thinking about the internals and externals of system boundaries.

We introduce **observatrons** as a computable automata for designing and architecting a unit on a system boundary that can observe dark uncertainty and resolve it by using a combination of decision-making with and without human interactions.

### Dark Fraction Calculator

Before diving into code, play with the geometry directly. The **Dark Fraction Calculator** lets you toggle facets on a single field and watch δ change in real time.

![Dark Fraction Calculator](figures/figure-1.png)

<a href="https://w3c-context-graph-community-group.github.io/dark_fraction/calculator/" target="_blank" rel="noopener noreferrer">→ Open the Dark Fraction Calculator</a>

Click **M** to populate Meaning, **S** for Structure, and **C** for Context. Each click closes one facet gap and reduces the dark fraction. Start with everything off and close facets one at a time until you reach δ = 0. That's the full manual reduction loop in about four clicks.

This is the core interaction the protocol enables. Everything in the rest of this guide — wrappers, URL structure, the runtime, the demo — is machinery to surface this same loop across real systems.

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
<url>/meaning     definition
<url>/structure   constraints & validation
<url>/context     a time-ordered metadata log 
```

All four apply at every slot depth. `/s/1/data` is valid. So is `/s/1/o/1/e/0/d/0/p/0/data`.

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

### Extending Vocabulary

- root
- claims
- events
