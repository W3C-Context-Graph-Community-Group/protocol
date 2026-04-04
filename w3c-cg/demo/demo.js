/* Context Graph Protocol — Interactive Demo (vanilla JS, no dependencies) */
'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const GITHUB_BASE =
  'https://github.com/W3C-Context-Graph-Community-Group/protocol/blob/main/w3c-cg';

const RON_URI =
  'https://w3c-cg.github.io/context-graph/demo/systems/ron';
const JACEK_URI =
  'https://w3c-cg.github.io/context-graph/demo/systems/jacek';

const KEYS = {
  'protocol/syn':     GITHUB_BASE + '/protocol/syn.md',
  'protocol/syn-ack': GITHUB_BASE + '/protocol/syn-ack.md',
  'protocol/ack':     GITHUB_BASE + '/protocol/ack.md',
  'protocol/fin':     GITHUB_BASE + '/protocol/fin.md',
  'protocol/fin-ack': GITHUB_BASE + '/protocol/fin-ack.md',
  'facet/context':    GITHUB_BASE + '/facet/context.md',
  'facet/meaning':    GITHUB_BASE + '/facet/meaning.md',
  'facet/structure':  GITHUB_BASE + '/facet/structure.md',
  'facet/data':       GITHUB_BASE + '/facet/data.md',
};

// Full URIs used in the CSV id / source / key columns (match existing log.csv)
const KEY_URI_BASE = 'https://w3c-cg.github.io/context-graph/';

// Boundary id — dereferenceable HTTP URI, not a URN
const BOUNDARY_ID =
  'https://w3c-context-graph-community-group.github.io/protocol/w3c-cg/demo/boundaries/ron--jacek';
const FACET_ID = BOUNDARY_ID + '/temperature';

// ---------------------------------------------------------------------------
// GitHub Sync — pushes every claim to GitHub Pages in real time
// ---------------------------------------------------------------------------
const sync = {
  available: false,
  initialized: false,
  branchUrl: null,

  async check() {
    const el = document.getElementById('sync-status');
    const label = el && el.querySelector('.label');
    try {
      const res = await fetch('/api/sync/status');
      const data = await res.json();
      this.available = data.available;
      if (this.available) {
        console.log('[sync] GitHub sync available via', data.method);
        if (el) { el.className = 'connected'; }
        if (label) { label.textContent = 'GitHub: connected (' + data.method + ')'; }
      } else {
        console.log('[sync] GitHub sync unavailable:', data.reason);
        if (el) { el.className = 'disconnected'; }
        if (label) { label.textContent = 'GitHub: ' + (data.reason || 'unavailable'); }
      }
    } catch (_) {
      this.available = false;
      if (el) { el.className = 'disconnected'; }
      if (label) { label.textContent = 'GitHub: offline'; }
    }
  },

  async init(systemA, systemB) {
    if (!this.available) return;
    const label = document.querySelector('#sync-status .label');
    try {
      const res = await fetch('/api/sync/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemA, systemB }),
      });
      const data = await res.json();
      if (data.ok) {
        this.initialized = true;
        this.branchUrl = data.branchUrl;
        console.log('[sync] Session created:', data.branchName);
        if (label) { label.textContent = 'Syncing: ' + data.branchName; }
      }
    } catch (err) {
      console.warn('[sync] init failed:', err.message);
      if (label) { label.textContent = 'GitHub: init failed'; }
    }
  },

  async pushClaim(claim, clientState) {
    if (!this.available || !this.initialized) return;
    try {
      await fetch('/api/sync/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, state: clientState }),
      });
    } catch (err) {
      console.warn('[sync] claim push failed:', err.message);
    }
  },

  async finalize(clientState) {
    if (!this.available || !this.initialized) return;
    try {
      const res = await fetch('/api/sync/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: clientState }),
      });
      const data = await res.json();
      if (data.prUrl) console.log('[sync] PR created:', data.prUrl);
    } catch (err) {
      console.warn('[sync] finalize failed:', err.message);
    }
  },
};

// Check sync availability on load
sync.check();

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  protocolState: 'NULL',   // NULL → SYN-SENT → SYN-RECEIVED → ESTABLISHED → EVALUATING → CLOSING → CLOSED
  facetPhase: 'IDLE',      // IDLE → CONTEXT → MEANING → STRUCTURE → DATA → COMPLETE
  mu: { c: null, m: null, s: null, d: null },
  log: [],
  rowNum: 0,
  initiatorNonce: null,
  responderNonce: null,
  boundaryId: null,
  facetId: null,
};

// ---------------------------------------------------------------------------
// Concept state — per-system live concept pages
// ---------------------------------------------------------------------------
const U = '_unmeasured_';

function makeConceptState(systemLabel, systemName) {
  return {
    system: systemLabel,
    name: systemName,
    status: 'null \u2014 no protocol session',
    facetsMeasured: 0,
    data: { timestamp: U, value: U },
    structure: { unit: U, precision: U, validRange: U, format: U },
    meaning: U,
    context: U,
    rotationLog: [],
  };
}

const conceptState = {
  ron:   makeConceptState('Ron \u2014 HVAC', 'ron'),
  jacek: makeConceptState('Jacek \u2014 Clinical', 'jacek'),
};

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function cell(v) {
  return v === U ? '<span class="unmeasured">' + esc(U) + '</span>' : esc(String(v));
}

function buildConceptHTML(cs) {
  const rows = cs.rotationLog.length > 0
    ? cs.rotationLog.map(e => esc(e)).join('\n')
    : '<em>No rotations performed.</em>';

  const meaningHTML = cs.meaning === U
    ? '<em>No definition asserted. This facet is in null state.</em>'
    : esc(cs.meaning);

  const contextHTML = cs.context === U
    ? '<em>No context surfaced. This facet is in null state.</em>'
    : esc(cs.context);

  return '<div class="status-line">Status: ' + esc(cs.status) + '</div>' +
    '<h4>Data</h4>' +
    '<table><tr><th>timestamp</th><th>value</th></tr>' +
    '<tr><td>' + cell(cs.data.timestamp) + '</td><td>' + cell(cs.data.value) + '</td></tr></table>' +
    '<h4>Structure</h4>' +
    '<table><tr><th>property</th><th>value</th></tr>' +
    '<tr><td>unit</td><td>' + cell(cs.structure.unit) + '</td></tr>' +
    '<tr><td>precision</td><td>' + cell(cs.structure.precision) + '</td></tr>' +
    '<tr><td>valid range</td><td>' + cell(cs.structure.validRange) + '</td></tr>' +
    '<tr><td>format</td><td>' + cell(cs.structure.format) + '</td></tr></table>' +
    '<h4>Meaning</h4><p>' + meaningHTML + '</p>' +
    '<h4>Context</h4><p>' + contextHTML + '</p>' +
    '<h4>Rotation Log</h4><div class="rotation-log">' + rows + '</div>';
}

function renderConceptPanel(name) {
  const el = document.getElementById('concept-' + name);
  if (el) el.innerHTML = buildConceptHTML(conceptState[name]);
}

function updateConcept(name, facet, updates) {
  const cs = conceptState[name];
  if (updates.status) cs.status = updates.status;
  if (updates.data) Object.assign(cs.data, updates.data);
  if (updates.structure) Object.assign(cs.structure, updates.structure);
  if (updates.meaning !== undefined) cs.meaning = updates.meaning;
  if (updates.context !== undefined) cs.context = updates.context;
  if (updates.logEntry) cs.rotationLog.push(updates.logEntry);
  if (updates.facetsMeasured !== undefined) cs.facetsMeasured = updates.facetsMeasured;
  if (updates.facetsMeasured !== undefined && updates.facetsMeasured > 0 && updates.facetsMeasured < 4) {
    cs.status = 'evaluating \u2014 ' + cs.facetsMeasured + ' of 4 facets measured';
  }
  renderConceptPanel(name);
}

function toggleConcept(name) {
  const el = document.getElementById('concept-' + name);
  if (!el) return;
  el.classList.toggle('open');
  if (el.classList.contains('open')) renderConceptPanel(name);
}

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const $banner   = document.getElementById('status-banner');
const $logBody  = document.getElementById('log-body');
const $logScroll = document.getElementById('log-scroll');
const $btnSyn      = document.getElementById('btn-syn');
const $btnFacets   = document.getElementById('btn-facets');
const $btnTeardown = document.getElementById('btn-teardown');
const $btnCsv      = document.getElementById('btn-csv');
const $btnVerify   = document.getElementById('btn-verify');
const $statInterps = document.getElementById('stat-interps');
const $statBits    = document.getElementById('stat-bits');
const $statAction  = document.getElementById('stat-action');
const $interpSection = document.getElementById('interp-section');
const $interpBody  = document.getElementById('interp-body');
const $verdictBox  = document.getElementById('verdict-box');

// ---------------------------------------------------------------------------
// Crypto utilities (real, not mocked)
// ---------------------------------------------------------------------------
function generateNonce() {
  const buf = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function now() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function setStatus(protocolState, label) {
  state.protocolState = protocolState;
  const cls = 'state-' + protocolState.toLowerCase().replace(/_/g, '-');
  $banner.className = cls;
  $banner.textContent = protocolState + ' — ' + label;
}

/** Build the full key URI as it appears in the CSV */
function keyURI(shortKey) {
  return KEY_URI_BASE + shortKey;
}

/** Shorten a full URI for display */
function shortSource(uri) {
  if (uri === RON_URI)  return 'ron';
  if (uri === JACEK_URI) return 'jacek';
  return uri;
}

/** Shorten a full key URI for display, return {label, href} */
function shortKey(fullKeyURI) {
  for (const [short, ghUrl] of Object.entries(KEYS)) {
    if (fullKeyURI === keyURI(short)) {
      return { label: short, href: ghUrl };
    }
  }
  return { label: fullKeyURI, href: null };
}

// ---------------------------------------------------------------------------
// Log table rendering
// ---------------------------------------------------------------------------
function addLogRow(claim) {
  state.rowNum++;
  state.log.push(claim);

  // Push claim to GitHub in background (non-blocking)
  sync.pushClaim(claim, {
    rowNum: state.rowNum,
    protocolState: state.protocolState,
    facetPhase: state.facetPhase,
    mu: { ...state.mu },
    log: state.log,
  });

  const tr = document.createElement('tr');
  const srcShort = shortSource(claim.source);
  tr.className = 'new-row source-' + srcShort;

  const kInfo = shortKey(claim.key);

  const cells = [
    state.rowNum,
    claim.id,
    srcShort,
    claim.timestamp,
    null, // key — special
    claim.value,
  ];

  cells.forEach((val, i) => {
    const td = document.createElement('td');
    if (i === 1) {
      // id cell: clickable link to boundary page
      const a = document.createElement('a');
      a.href = claim.id;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = claim.id;
      td.appendChild(a);
    } else if (i === 4) {
      // key cell: clickable link to spec page
      if (kInfo.href) {
        const a = document.createElement('a');
        a.href = kInfo.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = kInfo.label;
        td.appendChild(a);
      } else {
        td.textContent = kInfo.label;
      }
    } else {
      td.textContent = val;
    }
    tr.appendChild(td);
  });

  $logBody.appendChild(tr);
  $logScroll.scrollTop = $logScroll.scrollHeight;

  // Enable CSV download after first claim
  $btnCsv.disabled = false;
}

// ---------------------------------------------------------------------------
// Interpretation table (8 possible interpretations of "temperature = 30")
// ---------------------------------------------------------------------------
const INTERPRETATIONS = [
  { meaning: 'Indoor air temp',       unit: '°C', eliminated: false, by: null },
  { meaning: 'Indoor air temp',       unit: '°F', eliminated: false, by: null },
  { meaning: 'Outdoor air temp',      unit: '°C', eliminated: false, by: null },
  { meaning: 'Outdoor air temp',      unit: '°F', eliminated: false, by: null },
  { meaning: 'Body temp (oral)',       unit: '°C', eliminated: false, by: null },
  { meaning: 'Body temp (oral)',       unit: '°F', eliminated: false, by: null },
  { meaning: 'Equipment / process',   unit: '°C', eliminated: false, by: null },
  { meaning: 'Equipment / process',   unit: '°F', eliminated: false, by: null },
];

function renderInterpTable() {
  $interpBody.innerHTML = '';
  INTERPRETATIONS.forEach((row, i) => {
    const tr = document.createElement('tr');
    if (row.eliminated) tr.className = 'eliminated';

    const tdNum = document.createElement('td');
    tdNum.textContent = i + 1;
    tr.appendChild(tdNum);

    const tdM = document.createElement('td');
    tdM.textContent = row.meaning;
    tr.appendChild(tdM);

    const tdU = document.createElement('td');
    tdU.textContent = row.unit;
    tr.appendChild(tdU);

    const tdS = document.createElement('td');
    tdS.textContent = row.eliminated ? 'eliminated (' + row.by + ')' : 'possible';
    tr.appendChild(tdS);

    $interpBody.appendChild(tr);
  });
}

// ---------------------------------------------------------------------------
// Uncertainty stats
// ---------------------------------------------------------------------------
function updateUncertainty(interps, bits, action) {
  $statInterps.textContent = interps;
  $statBits.textContent = bits;
  $statAction.textContent = action;
}

function eliminateInterpretations(facet) {
  if (facet === 'context') {
    // Context reveals: Ron = HVAC (indoor air), Jacek = Clinical (body).
    // Eliminate outdoor and equipment rows.
    INTERPRETATIONS.forEach((row, i) => {
      if (row.meaning === 'Outdoor air temp' || row.meaning === 'Equipment / process') {
        row.eliminated = true;
        row.by = 'context';
      }
    });
  } else if (facet === 'meaning') {
    // Meaning reveals: Ron = indoor air, Jacek = body (oral).
    // They differ — but we now know exactly which meanings are in play.
    // Eliminate the other meaning that isn't either party's.
    // Remaining: indoor-air-°C, indoor-air-°F, body-oral-°C, body-oral-°F → but since
    // we know Ron=indoor-air and Jacek=body-oral, the "possible" set for THIS boundary
    // is only the two that match one of the two parties. But for the interpretation table
    // we show which combos remain plausible for the shared field — eliminate cross-combos.
    // After meaning: only Ron's actual (indoor air) and Jacek's actual (body oral) survive.
    // So we keep indoor air + body oral, both units still possible → 4 → 2 remaining per meaning.
    // Actually the plan says 8→4→2→1, so after meaning we should be at 2.
    // Context: 8→4 (eliminate outdoor + equipment = 4 rows gone, 4 remain)
    // Meaning: 4→2 (we learn Ron=indoor-air, Jacek=body-oral; since they MISMATCH,
    //   the "agreed" interpretation can only be one or the other;
    //   eliminate the unit variants that don't match either system's declaration)
    // Actually let's think about this differently: the 4 remaining after context are:
    //   indoor-air-°C, indoor-air-°F, body-oral-°C, body-oral-°F
    // After meaning mismatch, we know the two systems disagree on meaning.
    // The boundary must pick: is the field indoor-air or body-oral?
    // We can eliminate one meaning's rows. Since it's a mismatch (no resolution),
    // we mark that meaning can't be unified — but we still have 2 unit combos.
    // Plan says 4→2 after meaning. Let's eliminate body-oral rows (Jacek's meaning
    // doesn't match Ron's, and Ron is initiator, so we evaluate from Ron's perspective).
    INTERPRETATIONS.forEach(row => {
      if (!row.eliminated && row.meaning === 'Body temp (oral)') {
        row.eliminated = true;
        row.by = 'meaning';
      }
    });
  } else if (facet === 'structure') {
    // Structure reveals: Ron=°C, Jacek=°F — mismatch.
    // Eliminate the °F variant of indoor air temp → 1 remains.
    INTERPRETATIONS.forEach(row => {
      if (!row.eliminated && row.unit === '°F') {
        row.eliminated = true;
        row.by = 'structure';
      }
    });
  }
  renderInterpTable();
}

// ---------------------------------------------------------------------------
// Phase 1: Handshake
// ---------------------------------------------------------------------------
async function sendSyn() {
  $btnSyn.disabled = true;

  state.boundaryId = BOUNDARY_ID;
  state.facetId = FACET_ID;

  // Initialize GitHub sync session (creates branch + folder)
  await sync.init('ron', 'jacek');

  // --- SYN ---
  state.initiatorNonce = generateNonce();
  setStatus('SYN-SENT', 'Ron sent SYN');
  addLogRow({
    id: BOUNDARY_ID,
    source: RON_URI,
    timestamp: now(),
    key: keyURI('protocol/syn'),
    value: state.initiatorNonce,
  });

  await sleep(350);

  // --- SYN-ACK ---
  state.responderNonce = generateNonce();
  const hashRon = await sha256(state.initiatorNonce);
  setStatus('SYN-RECEIVED', 'Jacek sent SYN-ACK');
  addLogRow({
    id: BOUNDARY_ID,
    source: JACEK_URI,
    timestamp: now(),
    key: keyURI('protocol/syn-ack'),
    value: state.responderNonce + ':' + hashRon,
  });

  await sleep(350);

  // --- ACK ---
  const hashJacek = await sha256(state.responderNonce);
  setStatus('ESTABLISHED', 'Boundary established');
  addLogRow({
    id: BOUNDARY_ID,
    source: RON_URI,
    timestamp: now(),
    key: keyURI('protocol/ack'),
    value: hashJacek,
  });

  // Show interpretation table and update uncertainty
  $interpSection.style.display = '';
  renderInterpTable();
  updateUncertainty('8', '3.00', 'HALT — context not surfaced');

  // Update concept pages — initialized
  updateConcept('ron', 'init', { status: 'initialized', data: { value: '30' } });
  updateConcept('jacek', 'init', { status: 'initialized', data: { value: '30' } });

  $btnFacets.disabled = false;
  $btnVerify.disabled = false;
}

// ---------------------------------------------------------------------------
// Phase 2: Facet Evaluation
// ---------------------------------------------------------------------------
async function beginFacets() {
  $btnFacets.disabled = true;
  setStatus('EVALUATING', 'Facet evaluation in progress');

  const fid = state.facetId;

  // ---- CONTEXT (rows 4-6) ----
  state.facetPhase = 'CONTEXT';
  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/context'),
    value: 'ask:domain,unit-system,measurement-type',
  });
  updateConcept('ron', 'context', { logEntry: '[context] ask \u2192 domain, unit-system, measurement-type' });
  await sleep(300);

  addLogRow({
    id: fid, source: JACEK_URI, timestamp: now(),
    key: keyURI('facet/context'),
    value: 'domain:clinical,units:imperial,type:body-oral',
  });
  updateConcept('jacek', 'context', { context: 'domain: clinical, units: imperial, type: body-oral' });
  await sleep(300);

  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/context'),
    value: 'verdict:sufficient,mu_c:1,note:domains-differ(HVAC-vs-clinical)',
  });
  state.mu.c = 1;
  eliminateInterpretations('context');
  updateUncertainty('4', '2.00', 'continue — domains differ');
  updateConcept('ron', 'context', { context: 'domain: HVAC, units: metric, type: indoor-air', facetsMeasured: 1, logEntry: '[context] verdict \u2192 sufficient, domains differ' });
  updateConcept('jacek', 'context', { facetsMeasured: 1, logEntry: '[context] verdict \u2192 sufficient, domains differ' });
  await sleep(300);

  // ---- MEANING (rows 7-9) ----
  state.facetPhase = 'MEANING';
  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/meaning'),
    value: 'ask:definition-of-temperature',
  });
  updateConcept('ron', 'meaning', { logEntry: '[meaning] ask \u2192 definition-of-temperature' });
  await sleep(300);

  addLogRow({
    id: fid, source: JACEK_URI, timestamp: now(),
    key: keyURI('facet/meaning'),
    value: 'def:patient-body-temperature-oral-reading',
  });
  updateConcept('jacek', 'meaning', { meaning: 'Patient body temperature (oral reading)' });
  await sleep(300);

  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/meaning'),
    value: 'verdict:mismatch,mu_m:1,ron:indoor-air-temperature,jacek:patient-body-temperature',
  });
  state.mu.m = 1;
  eliminateInterpretations('meaning');
  updateUncertainty('2', '1.00', 'mismatch detected');
  updateConcept('ron', 'meaning', { meaning: 'Indoor air temperature (ceiling-mounted sensor)', facetsMeasured: 2, logEntry: '[meaning] verdict \u2192 mismatch, ron=indoor-air, jacek=body-oral' });
  updateConcept('jacek', 'meaning', { facetsMeasured: 2, logEntry: '[meaning] verdict \u2192 mismatch, ron=indoor-air, jacek=body-oral' });
  await sleep(300);

  // ---- STRUCTURE (rows 10-12) ----
  state.facetPhase = 'STRUCTURE';
  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/structure'),
    value: 'ask:unit,precision,valid-range',
  });
  updateConcept('ron', 'structure', { logEntry: '[structure] ask \u2192 unit, precision, valid-range' });
  await sleep(300);

  addLogRow({
    id: fid, source: JACEK_URI, timestamp: now(),
    key: keyURI('facet/structure'),
    value: 'unit:fahrenheit,precision:1,range:90-110',
  });
  updateConcept('jacek', 'structure', { structure: { unit: 'Fahrenheit (\u00b0F)', precision: '1', validRange: '90 \u2013 110' } });
  await sleep(300);

  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/structure'),
    value: 'verdict:mismatch,mu_s:1,ron:celsius,jacek:fahrenheit',
  });
  state.mu.s = 1;
  eliminateInterpretations('structure');
  updateUncertainty('1', '0.00', 'resolved but incoherent');
  updateConcept('ron', 'structure', { structure: { unit: 'Celsius (\u00b0C)', precision: '0.1', validRange: '15 \u2013 45' }, facetsMeasured: 3, logEntry: '[structure] verdict \u2192 mismatch, ron=celsius, jacek=fahrenheit' });
  updateConcept('jacek', 'structure', { facetsMeasured: 3, logEntry: '[structure] verdict \u2192 mismatch, ron=celsius, jacek=fahrenheit' });
  await sleep(300);

  // ---- DATA (rows 13-15) ----
  state.facetPhase = 'DATA';
  const dataTs = now();
  addLogRow({
    id: fid, source: RON_URI, timestamp: dataTs,
    key: keyURI('facet/data'),
    value: 'ask:current-value',
  });
  updateConcept('ron', 'data', { logEntry: '[data] ask \u2192 current-value' });
  await sleep(300);

  addLogRow({
    id: fid, source: JACEK_URI, timestamp: now(),
    key: keyURI('facet/data'),
    value: 'val:30',
  });
  updateConcept('ron', 'data', { data: { timestamp: dataTs, value: '30' } });
  updateConcept('jacek', 'data', { data: { timestamp: dataTs, value: '30' } });
  await sleep(300);

  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/data'),
    value: 'verdict:halt,mu_d:undefined,reason:meaning-and-structure-misaligned,note:30F-outside-clinical-range(90-110)-and-30C-is-room-temp-not-body-temp',
  });
  state.mu.d = undefined;
  state.facetPhase = 'COMPLETE';
  updateConcept('ron', 'data', { facetsMeasured: 4, logEntry: '[data] verdict \u2192 halt, meaning and structure misaligned' });
  updateConcept('jacek', 'data', { facetsMeasured: 4, logEntry: '[data] verdict \u2192 halt, meaning and structure misaligned' });

  $btnTeardown.disabled = false;
}

// ---------------------------------------------------------------------------
// Phase 3: Teardown
// ---------------------------------------------------------------------------
async function initTeardown() {
  $btnTeardown.disabled = true;
  setStatus('CLOSING', 'Teardown in progress');

  // FIN
  addLogRow({
    id: BOUNDARY_ID,
    source: RON_URI,
    timestamp: now(),
    key: keyURI('protocol/fin'),
    value: 'reason:evaluation-complete,status:incoherent,mu_c:1,mu_m:1,mu_s:1,mu_d:undefined',
  });
  await sleep(350);

  // FIN-ACK
  addLogRow({
    id: BOUNDARY_ID,
    source: JACEK_URI,
    timestamp: now(),
    key: keyURI('protocol/fin-ack'),
    value: 'ack:ron',
  });

  setStatus('CLOSED', 'CLOSED (INCOHERENT)');
  updateUncertainty('resolved', '0.00', 'HALT — upstream misaligned');

  // Finalize GitHub sync (creates PR)
  sync.finalize({
    protocolState: state.protocolState,
    facetPhase: state.facetPhase,
    mu: { ...state.mu },
    log: state.log,
  });

  // Update concept pages — incoherent
  updateConcept('ron', 'teardown', { status: 'incoherent', logEntry: '[teardown] FIN \u2192 incoherent' });
  updateConcept('jacek', 'teardown', { status: 'incoherent', logEntry: '[teardown] FIN-ACK \u2192 incoherent' });

  // Show final verdict
  $verdictBox.style.display = 'block';
  $verdictBox.innerHTML =
    '<strong>Final Verdict: INCOHERENT</strong><br>' +
    '<code>temperature = 30</code> means "<em>86 °F warm room</em>" in Ron\'s codebook ' +
    'and "<em>impossible clinical reading</em>" in Jacek\'s codebook.<br><br>' +
    'Facet results: ' +
    '<strong>context</strong> \u03bc<sub>c</sub>=1 (domains differ), ' +
    '<strong>meaning</strong> \u03bc<sub>m</sub>=1 (mismatch), ' +
    '<strong>structure</strong> \u03bc<sub>s</sub>=1 (mismatch), ' +
    '<strong>data</strong> \u03bc<sub>d</sub>=undefined (halted).';
}

// ---------------------------------------------------------------------------
// SHA-256 Handshake Verification
// ---------------------------------------------------------------------------
async function verifyHandshake() {
  const $box = document.getElementById('verify-box');
  if (!$box) return;

  // Find the handshake rows
  const synRow    = state.log.find(c => c.key === keyURI('protocol/syn'));
  const synAckRow = state.log.find(c => c.key === keyURI('protocol/syn-ack'));
  const ackRow    = state.log.find(c => c.key === keyURI('protocol/ack'));

  if (!synRow || !synAckRow || !ackRow) {
    $box.style.display = 'block';
    $box.innerHTML = '<strong>Cannot verify:</strong> handshake has not completed yet.';
    return;
  }

  const synNonce = synRow.value;
  const colonIdx = synAckRow.value.indexOf(':');
  const synAckNonce = synAckRow.value.slice(0, colonIdx);
  const synAckHash  = synAckRow.value.slice(colonIdx + 1);
  const ackHash = ackRow.value;

  const expected1 = await sha256(synNonce);
  const check1 = expected1 === synAckHash;

  const expected2 = await sha256(synAckNonce);
  const check2 = expected2 === ackHash;

  const overall = check1 && check2;
  const tag = function(pass) { return pass ? '<span class="verify-pass">PASS</span>' : '<span class="verify-fail">FAIL</span>'; };

  $box.style.display = 'block';
  $box.innerHTML =
    '<strong>SHA-256 Handshake Verification</strong><br><br>' +
    '<table class="verify-table">' +
    '<tr><th>Step</th><th>Check</th><th>Result</th></tr>' +
    '<tr><td>SYN</td><td>nonce = <code>' + esc(synNonce) + '</code></td><td>—</td></tr>' +
    '<tr><td>SYN-ACK</td><td>sha256(<code>' + esc(synNonce) + '</code>)<br>= <code class="hash">' + esc(expected1) + '</code><br>' +
      (check1 ? 'matches' : 'expected') + ' hash in value</td><td>' + tag(check1) + '</td></tr>' +
    '<tr><td>ACK</td><td>sha256(<code>' + esc(synAckNonce) + '</code>)<br>= <code class="hash">' + esc(expected2) + '</code><br>' +
      (check2 ? 'matches' : 'expected') + ' hash in value</td><td>' + tag(check2) + '</td></tr>' +
    '</table><br>' +
    '<strong>Overall: ' + tag(overall) + '</strong> — The SHA-256 chain is ' +
    (overall ? 'cryptographically valid.' : '<span class="verify-fail">BROKEN</span>.') +
    '<br><small>Download <code>log.csv</code> and run <code>node verify-handshake.mjs log.csv</code> to verify independently.</small>';
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------
function downloadCSV() {
  const header = 'id,source,timestamp,key,value';
  const rows = state.log.map(c => {
    const vals = [c.id, c.source, c.timestamp, c.key, c.value];
    return vals.map(v => {
      const s = String(v);
      return s.includes(',') ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',');
  });

  const csv = header + '\n' + rows.join('\n') + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'log.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Expose to onclick handlers
window.sendSyn = sendSyn;
window.beginFacets = beginFacets;
window.initTeardown = initTeardown;
window.downloadCSV = downloadCSV;
window.verifyHandshake = verifyHandshake;
window.toggleConcept = toggleConcept;
