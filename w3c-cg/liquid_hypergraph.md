# Liquid Hypergraph Protocol — Implementation Instructions for Claude Code

## Context

This document contains everything needed to build the empirical test for the Liquid Hypergraph Protocol on GitHub. It incorporates corrections and specifications from Jacek Kowalski (Mathematics Committee Chair) delivered April 2, 2026.

## Critical Corrections from Jacek (DO NOT IGNORE)

### 1. Translation, NOT Rotation
The vec4 gauge receives **translation impulses**, not rotations. There is nothing to rotate — vec4 is too small for meaningful quaternion rotation. The entropic noise of floating-point operations on transcendental functions would exceed the signal. Just track where the vector lands after each impulse.

### 2. Boundary Classes, NOT Fixed Points
We are NOT in Hilbert space. We operate in Finsler geometry (optimistically near the simplest case which approximates Riemannian). Operations are NOT invertible — neither pulse nor rotation can be exactly reversed. Mathematical definitions live in boundary classes, not points. Drift exists everywhere.

### 3. The Geometric Regime Ladder
The space behaves differently depending on how far apart vectors are:
- **Both vectors identical** → Hilbert works (trivial case)
- **Slightly off** → Riemannian regime, can rotate embedding to align
- **More off** → Still rotate but divergence grows with each step, directional
- **Way off** → Norms diverge, never going to agree

### 4. Distance is Euclidean (for now)
"You still do not know what the metric of the space is, but distance between vectors is Euclidean. You have nothing better and there is no point of solving this." Your vectors already have two metrics:
- **Cosine similarity** of normed |1| (hypermetric, direction alignment)
- **Euclidean distance** (unnormed, raw vec) — purely Euclidean

### 5. What You Must Define FIRST
Before any computation means anything, specify:
- What are the **inputs** and how to push them into **0-1 range**
- What are the **operations** (already have: gauge, accumulator)
- What are the **outputs**, what do they **mean** (color? position? z-buffer?)
- Whether outputs need **scaling**
- What is the **expected result** for each input (training pairs)

### 6. The Accumulation Exponent
The exponent does NOT have to be 2. Any number > 1 works. The exponent determines which normed space you operate in. Finsler tells you what behavior to expect for a given exponent. Start with 2. Change later if needed.

### 7. Scaling with Representation Width
- **vec4** (4 Booleans): Need real impulse to change configuration. Many measurements needed for confidence.
- **vec16**: ~30 measurements worst case (often 2 to know if nonsense)
- **vec768**: One measurement and you know. "Pure math :)"
- The original paper uses 17 values — there is a reason for that number with f32/f64.

### 8. URLs are Just Address Numbers
"What you wanna do to URLs? Those are just address numbers." The URLs are identifiers pointing to definitions. They are not magic. They are addresses. Keep them simple.

### 9. Build the Sidescroller
"What you are exactly doing is a control system in 4D space, not different from steering a drone in 4D, where inertia (accumulated entropy, numerical drift) exists and you get answer if target is hit, or how much it is missed. So — how much sense from the target answer is in distance 0-1. What you get with your timestamp is a sidescroller where you are controlling in 4D the character (this vec4) and moving between configurations of next impulses."

---

## Repository Structure

```
protocol-test/
├── README.md
├── boundaries/
│   └── ron-jacek/
│       ├── claims.csv              # 17 canonical claims (5 columns)
│       ├── gauge.json              # Gauge state vector
│       ├── drift.json              # Drift vector, E score, direction
│       ├── measures.json           # All computed measures with units
│       └── training/
│           ├── input_output.csv    # Training pairs: input + expected output
│           └── README.md           # What each column means, units, range
├── math/
│   ├── exponent-q.json             # cg:math/exponent-q definition
│   ├── drift-length-E.json         # cg:math/drift-length-E definition
│   ├── coverage-C.json             # cg:math/coverage-C definition
│   ├── entropy-boundary.json       # cg:math/entropy-boundary definition
│   ├── null-bound.json             # cg:math/null-bound definition
│   ├── impulse-type.json           # cg:math/impulse-type definition
│   ├── representation-width.json   # cg:math/representation-width definition
│   ├── cosine-similarity.json      # cg:math/cosine-similarity definition
│   ├── euclidean-distance.json     # cg:math/euclidean-distance definition
│   └── README.md                   # Index of all math definitions
├── lib/
│   ├── parser.js                   # Parse claims.csv
│   ├── gauge.js                    # Compute gauge vector
│   ├── drift.js                    # Compute drift (quadratic accumulator)
│   ├── measures.js                 # Compute all measures
│   ├── normalize.js                # Push all inputs to 0-1 range
│   └── distance.js                 # Euclidean distance + cosine similarity
├── observatron/
│   └── index.html                  # Static page: fetch, compute, render
├── tests/
│   ├── test_claims.js
│   ├── test_gauge.js
│   ├── test_drift.js
│   ├── test_measures.js
│   ├── test_normalize.js           # Verify all values in 0-1 range
│   ├── test_distance.js            # Verify both metrics computed
│   └── test_pass_fail.js           # All 9 pass/fail criteria
└── docs/
    ├── UNITS.md                    # What each output means
    ├── FALSIFICATION.md            # Criteria and results
    └── JACEK_CORRECTIONS.md        # This section, preserved for audit
```

## Step 1: Claims CSV

File: `boundaries/ron-jacek/claims.csv`

5 columns. Header row. 17 data rows. Exactly as specified in the paper.

```csv
id,source,timestamp,key,value
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:00.000Z,cg:protocol/syn,nonce:7a3f9b2e
cg:boundary/ron-jacek,cg:system/jacek,2026-04-02T10:00:00.347Z,cg:protocol/syn-ack,nonce:c4d5e6f7:hash:sha256(7a3f9b2e)
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:00.712Z,cg:protocol/ack,hash:sha256(c4d5e6f7)
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:01.000Z,cg:facet/context,ask:domain+location+unit-system
cg:boundary/ron-jacek,cg:system/jacek,2026-04-02T10:00:01.200Z,cg:facet/context,domain:HVAC+loc:building-7+units:metric
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:01.500Z,cg:facet/context,verdict:sufficient+mu_C:0
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:02.000Z,cg:facet/meaning,ask:definition-of-temperature
cg:boundary/ron-jacek,cg:system/jacek,2026-04-02T10:00:02.200Z,cg:facet/meaning,def:indoor-air-temperature-sensor
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:02.500Z,cg:facet/meaning,verdict:mismatch+mu_M:1
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:03.000Z,cg:facet/structure,ask:unit+precision+range
cg:boundary/ron-jacek,cg:system/jacek,2026-04-02T10:00:03.200Z,cg:facet/structure,unit:celsius+precision:int+range:15-45
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:03.500Z,cg:facet/structure,verdict:mismatch+mu_S:1
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:04.000Z,cg:facet/data,gated:mu_M=1+mu_S=1
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:04.100Z,cg:facet/data,verdict:undefined+mu_D:undefined
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:04.200Z,cg:protocol/action,halt:boundary-incoherent
cg:boundary/ron-jacek,cg:system/ron,2026-04-02T10:00:05.000Z,cg:protocol/fin,reason:complete
cg:boundary/ron-jacek,cg:system/jacek,2026-04-02T10:00:05.200Z,cg:protocol/fin-ack,ack:ron
```

## Step 2: Normalize Inputs to 0-1 Range

Per Jacek: all inputs should be representable in 0-1 range. Not because they must be, but because it's easier to follow the steps.

```javascript
// normalize.js
// Each facet verdict maps to 0-1:
//   aligned = 0.0
//   misaligned = 1.0
//   undefined/gated = null (excluded from computation)

function normalizeGauge(gauge) {
  return {
    context:   gauge.mu_C === 0 ? 0.0 : gauge.mu_C === 1 ? 1.0 : null,
    meaning:   gauge.mu_M === 0 ? 0.0 : gauge.mu_M === 1 ? 1.0 : null,
    structure: gauge.mu_S === 0 ? 0.0 : gauge.mu_S === 1 ? 1.0 : null,
    data:      gauge.mu_D === 0 ? 0.0 : gauge.mu_D === 1 ? 1.0 : null
  };
}

// Current state as vec4 in 0-1:
// [0.0, 1.0, 1.0, null] → for computation, null is excluded
// Active dimensions: [0.0, 1.0, 1.0] (3 of 4 measured)
```

## Step 3: Compute Two Distances

Per Jacek: your vectors already have two metrics. Compute both.

```javascript
// distance.js

// 1. Euclidean distance (unnormed, raw vec)
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== null && b[i] !== null) {
      sum += (a[i] - b[i]) ** 2;
    }
  }
  return Math.sqrt(sum);
}

// 2. Cosine similarity (normed |1|, direction alignment)
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== null && b[i] !== null) {
      dot += a[i] * b[i];
      normA += a[i] ** 2;
      normB += b[i] ** 2;
    }
  }
  if (normA === 0 || normB === 0) return null;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Target state: [0, 0, 0, 0] (all aligned)
// Current state: [0, 1, 1, 0]
// Euclidean distance: sqrt(0 + 1 + 1 + 0) = 1.414
// Cosine similarity: 0 (orthogonal to target — target is zero vector, undefined)
// Note: cosine is undefined when target is zero vector. This is correct.
// Cosine becomes meaningful when comparing two non-zero boundary measurements.
```

## Step 4: Quadratic Accumulator (Translation Impulse)

```javascript
// drift.js

const DEFAULT_EXPONENT = 2; // q > 1, start with 2

function applyImpulse(currentVec, change, q = DEFAULT_EXPONENT) {
  return currentVec.map((v, i) => {
    if (change[i] === null) return v; // gated facet, no impulse
    return Math.pow(Math.abs(v), q) + Math.pow(Math.abs(change[i]), q);
  });
}

function driftLength(vec, q = DEFAULT_EXPONENT) {
  const measured = vec.filter(v => v !== null);
  const sum = measured.reduce((acc, v) => acc + Math.pow(Math.abs(v), q), 0);
  return Math.pow(sum, 1/q);
}

function dominantFacet(vec) {
  const labels = ['context', 'meaning', 'structure', 'data'];
  let maxVal = -1, maxIdx = -1;
  vec.forEach((v, i) => {
    if (v !== null && Math.abs(v) > maxVal) {
      maxVal = Math.abs(v);
      maxIdx = i;
    }
  });
  return maxIdx >= 0 ? labels[maxIdx] : null;
}

// CRITICAL: applying negative impulse does NOT return to origin.
// This is path-dependent. The cost of going there and back is NOT zero.
// Example:
//   start: [0, 0, 0, 0]
//   impulse: [0, 1, 1, 0]
//   after:  [0, 1, 1, 0]
//   negative impulse: [0, -1, -1, 0]
//   after:  [0, 1+1, 1+1, 0] = [0, 2, 2, 0]  ← NOT back to origin
```

## Step 5: Compute All Measures

File: `boundaries/ron-jacek/measures.json`

Every measure must specify: name, value, unit, formula, range, interpretation.

### Direction Measures
| Measure | Value | Unit | Range | Formula |
|---------|-------|------|-------|---------|
| misalignment_context | 0.0 | binary 0-1 | [0,1] | gauge verdict |
| misalignment_meaning | 1.0 | binary 0-1 | [0,1] | gauge verdict |
| misalignment_structure | 1.0 | binary 0-1 | [0,1] | gauge verdict |
| misalignment_data | null | gated | — | dependency ordering |
| priority_weight | [0, 0.5, 0.5, 0] | normalized | sum=1 | misalignment[i]/sum |
| dominant_facet | meaning+structure | label | — | argmax(current_vec) |

### Distance Measures
| Measure | Value | Unit | Range | Formula |
|---------|-------|------|-------|---------|
| euclidean_to_target | 1.414 | L2 distance | [0, 2] | sqrt(sum((target-current)²)) |
| cosine_to_target | undefined | cosine | [-1, 1] | undefined (target is zero vec) |
| coherence_distance | 0.5 | ratio | [0, 1] | misaligned_facets / measured_facets |

### Uncertainty Measures
| Measure | Value | Unit | Range | Formula |
|---------|-------|------|-------|---------|
| entropy_pre | 3.0 | bits | [0, ∞) | log2(interpretations) |
| entropy_post | 0.0 | bits | [0, ∞) | log2(1) |
| info_gained | 3.0 | bits | [0, ∞) | entropy_pre - entropy_post |
| coverage_C | 0.75 | ratio | [0, 1] | |E|/N = 3/4 |
| coverage_gap | 0.25 | ratio | [0, 1] | 1 - C |
| null_exposure | 1 | facet count | [0, N] | unmeasured facets |

### Accumulation Measures
| Measure | Value | Unit | Range | Formula |
|---------|-------|------|-------|---------|
| drift_length_E | 1.414 | Lq norm | [0, ∞) | (sum(|v[i]|^q))^(1/q) |
| drift_velocity | null | delta E / step | — | first measurement |
| path_cost | 3 | rotation count | [0, ∞) | completed rotations |
| inertia | null | delta² E / step² | — | first measurement |

### Control Measures (Sidescroller)
| Measure | Value | Unit | Range | Formula |
|---------|-------|------|-------|---------|
| target_state | [0,0,0,0] | vec4 0-1 | — | all aligned |
| current_state | [0,1,1,0] | vec4 0-1 | — | after impulse |
| error | 1.414 | L2 distance | [0, 2] | euclidean(target, current) |
| correction_impulse | [0,-1,-1,0] | vec4 delta | — | target - current |
| reversible | NO | boolean | — | path dependent (q>1) |

## Step 6: Math Definition URLs

Each file in `/math/` is a JSON definition. These are the dereferenceable codebook entries.

Example: `math/drift-length-E.json`
```json
{
  "id": "cg:math/drift-length-E",
  "type": "MathDefinition",
  "label": "Drift Length E",
  "description": "Total accumulated boundary misalignment. The QCO detector.",
  "formula": "E = (sum_i |current_vec[i]|^q)^(1/q)",
  "parameters": {
    "current_vec": "cg:math/current-vec",
    "q": "cg:math/exponent-q"
  },
  "unit": "Lq norm",
  "range": "[0, infinity)",
  "interpretation": {
    "E_near_0": "boundary is stable",
    "E_growing": "boundary is diverging, requires attention",
    "E_direction": "dominant component of current_vec identifies priority facet"
  },
  "input_range": "0-1 per dimension (normalized gauge verdicts)",
  "output_range": "[0, sqrt(dimensions)] for L2",
  "distance_metric": "euclidean (between raw vectors)",
  "direction_metric": "cosine similarity (between normed vectors)",
  "status": "defined",
  "source": "Kowalski (2026), Hierarchical Metric Flow on Data Graphs"
}
```

Example: `math/exponent-q.json`
```json
{
  "id": "cg:math/exponent-q",
  "type": "MathDefinition",
  "label": "Accumulation Exponent q",
  "description": "Controls the normed space of the accumulator. Must be > 1.",
  "formula": "current_vec[i] <- |current_vec[i]|^q + |change[i]|^q",
  "constraints": "q > 1",
  "default": 2,
  "interpretation": {
    "q_equals_2": "L2 norm, standard Euclidean behavior on accumulation",
    "q_greater": "stronger amplification of large drifts, stronger decay of small drifts",
    "q_approaches_1": "approaches linear accumulation, loses nonlinear properties"
  },
  "note": "The exponent determines which normed space. Finsler geometry explains the behavior but is not a dependency. It is a lens.",
  "status": "defined",
  "source": "Kowalski (2026)"
}
```

Example: `math/euclidean-distance.json`
```json
{
  "id": "cg:math/euclidean-distance",
  "type": "MathDefinition",
  "label": "Euclidean Distance",
  "description": "Distance between raw (unnormed) vectors. The default distance metric.",
  "formula": "d(a,b) = sqrt(sum_i (a[i] - b[i])^2)",
  "applies_to": "unnormed vectors in 0-1 range",
  "note": "Per Kowalski: 'distance between vectors is Euclidean. You have nothing better and there is no point of solving this.'",
  "status": "defined",
  "source": "Kowalski (2026-04-02, direct communication)"
}
```

Example: `math/cosine-similarity.json`
```json
{
  "id": "cg:math/cosine-similarity",
  "type": "MathDefinition",
  "label": "Cosine Similarity",
  "description": "Direction alignment between normed |1| vectors. Hypermetric.",
  "formula": "cos(a,b) = dot(a,b) / (|a| * |b|)",
  "applies_to": "normed vectors (direction only, magnitude removed)",
  "range": "[-1, 1]",
  "interpretation": {
    "1": "identical direction",
    "0": "orthogonal",
    "-1": "opposite direction"
  },
  "note": "Undefined when either vector is zero. Becomes meaningful for comparing two non-zero boundary measurements.",
  "status": "defined",
  "source": "Kowalski (2026-04-02, direct communication)"
}
```

Example: `math/impulse-type.json`
```json
{
  "id": "cg:math/impulse-type",
  "type": "MathDefinition",
  "label": "Impulse Type",
  "description": "How verdicts enter the Kowalski Space",
  "value": "translation",
  "not": "rotation",
  "reason": "vec4 is not worth quaternion rotation — it would be a trivial quaternion without entropic noise beyond FPU on transcendental functions. 4 binary values have nothing to rotate.",
  "note": "Rotation becomes meaningful at higher representation widths (vec16+) where angular relationships carry signal above floating point noise floor.",
  "status": "defined",
  "source": "Kowalski (2026-04-02, direct communication)"
}
```

Example: `math/representation-width.json`
```json
{
  "id": "cg:math/representation-width",
  "type": "MathDefinition",
  "label": "Representation Width",
  "description": "Number of dimensions in the measurement vector",
  "current_value": 4,
  "scaling": {
    "vec4": {
      "dimensions": 4,
      "input": "Boolean gauge verdicts",
      "confidence": "low — many measurements needed",
      "impulse_type": "translation"
    },
    "vec16": {
      "dimensions": 16,
      "input": "projected from gauge via trained bottleneck",
      "confidence": "~30 measurements worst case, often 2",
      "impulse_type": "rotation becomes viable"
    },
    "vec768": {
      "dimensions": 768,
      "input": "full embedding",
      "confidence": "1 measurement",
      "impulse_type": "full rotation",
      "note": "pure math :)"
    }
  },
  "path_to_scale": "Accumulate boundary measurements → train perceptron (input, bottleneck, output) → get probabilistic control model → increase width",
  "status": "defined — currently operating at vec4",
  "source": "Kowalski (2026-04-02, direct communication)"
}
```

## Step 7: Training Data Pairs (For Jacek)

File: `boundaries/ron-jacek/training/input_output.csv`

Per Jacek: "You need to prepare input and expected result."

```csv
measurement_id,input_mu_C,input_mu_M,input_mu_S,input_mu_D,expected_action,expected_E_direction,expected_dominant_facet
1,0,1,1,null,halt,growing,meaning+structure
```

This file grows with each boundary measurement. When enough data accumulates, train the small NN (perceptron + bottleneck + output) to build the probabilistic control model.

`training/README.md`:
```markdown
# Training Data

## What each column means
- measurement_id: sequential, matches claim log
- input_mu_*: normalized gauge verdicts in 0-1 (null = gated)
- expected_action: halt | ask | act
- expected_E_direction: growing | stable | shrinking
- expected_dominant_facet: which facet should be priority

## Units
- All inputs: 0-1 range (binary for now, continuous later)
- Action: categorical
- E direction: categorical
- Dominant facet: label

## Purpose
This file pairs every input with its expected output.
When sufficient rows exist, train:
  Input layer (vec4) → Bottleneck → Output layer
to produce a probabilistic model of boundary behavior.
This is the bridge from vec4 to vec16+.
```

## Step 8: Observatron (Static HTML on GitHub Pages)

### Display Requirements
1. Black background (Ron's illustration style)
2. Width toggle: vec4 / vec16 / vec768 — entire page reacts to selection
3. Gauge vector: 4 cells showing aligned/misaligned/gated with colors
4. Action badge: HALT / ASK / ACT prominently displayed
5. Drift score: E value, direction, velocity, path cost
6. Two distance metrics: Euclidean distance AND cosine similarity displayed
7. Claims log: all 17 rows, 5 columns, verdicts highlighted
8. Empty columns visible — they ARE the unmeasured exposure
9. URI table: every math variable with URL, value, unit, status
10. Self-reflection box: "This table is itself a set of protocol claims"
11. Confidence bar that changes with width toggle
12. Vector visualization that changes with width toggle

### The Self-Reflection Requirement
The URI table must include an entry for `cg:math/representation-width` that updates when the user toggles width. This demonstrates: changing a mathematical definition changes the space, and that change is itself a dereferenceable, auditable protocol entity. The page IS the protocol running on itself.

## Step 9: Pass/Fail Tests

### 11 Required Tests (updated from 9)

```
Test 1:  Claim count per rotation = exactly 3 (Ask, Response, Verdict)
Test 2:  Every claim has exactly 5 columns (i, s, t, k, v)
Test 3:  Edge count = rotation count (|E| = 3)
Test 4:  Gauge output per facet is 0, 1, or null
Test 5:  Dependency ordering enforced (mu_D null when mu_M=1 or mu_S=1)
Test 6:  Coverage C = |E|/N = 3/4 = 0.75
Test 7:  Pre-rotation state indistinguishable from aligned; post visible
Test 8:  Drift score E computable from claim log alone
Test 9:  Dominant component of current_vec identifies priority facet
Test 10: All inputs normalized to 0-1 range
Test 11: Both distance metrics (euclidean + cosine) computed
```

### Fail Conditions
- Claim doesn't fit 5-column form
- Gauge contains values other than {0, 1, null}
- Dependency ordering violated
- Edge count ≠ rotation count
- Drift score not computable from claims alone
- Any input value outside 0-1 range
- Only one distance metric computed
- Observatron renders ACT on misaligned boundary
- Negative impulse returns to origin (would violate path dependence)

## Step 10: Deployment Sequence

1. Create GitHub repo under W3C Context Graph Community Group org
2. Commit `claims.csv` — single source of truth
3. Compute and commit `gauge.json`
4. Compute and commit `drift.json`
5. Compute and commit `measures.json`
6. Commit all `math/*.json` definition files
7. Commit `training/input_output.csv` with first row
8. Deploy `observatron/index.html` to GitHub Pages
9. Run all 11 tests
10. Record results in `docs/FALSIFICATION.md`
11. Send Jacek the link and the numbers

## Key Principles

1. **The CSV is the single source of truth.** Everything is derived from it.
2. **All inputs in 0-1 range.** Per Jacek.
3. **Two metrics always.** Euclidean distance + cosine similarity.
4. **Translation impulse on vec4.** Not rotation.
5. **Path dependence.** Negative impulse ≠ reversal.
6. **Every math variable is a URL.** Dereferenceable, auditable, versionable.
7. **Build first, theorize after.** "Run concrete tests and check what numbers actually come out."
8. **Pair inputs with expected outputs.** This is how we build training data for the bridge to vec16+.
9. **Boundary classes, not fixed points.** Even math definitions drift across boundary classes.
10. **The page reflects itself.** The observatron demonstrates the protocol by running on its own definitions.