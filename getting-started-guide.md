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

## Quick Start

[... existing Quick Start content ...]
