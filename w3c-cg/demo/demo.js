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
// DOM refs
// ---------------------------------------------------------------------------
const $banner   = document.getElementById('status-banner');
const $logBody  = document.getElementById('log-body');
const $logScroll = document.getElementById('log-scroll');
const $btnSyn      = document.getElementById('btn-syn');
const $btnFacets   = document.getElementById('btn-facets');
const $btnTeardown = document.getElementById('btn-teardown');
const $btnCsv      = document.getElementById('btn-csv');
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

  $btnFacets.disabled = false;
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
  await sleep(300);

  addLogRow({
    id: fid, source: JACEK_URI, timestamp: now(),
    key: keyURI('facet/context'),
    value: 'domain:clinical,units:imperial,type:body-oral',
  });
  await sleep(300);

  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/context'),
    value: 'verdict:sufficient,mu_c:1,note:domains-differ(HVAC-vs-clinical)',
  });
  state.mu.c = 1;
  eliminateInterpretations('context');
  updateUncertainty('4', '2.00', 'continue — domains differ');
  await sleep(300);

  // ---- MEANING (rows 7-9) ----
  state.facetPhase = 'MEANING';
  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/meaning'),
    value: 'ask:definition-of-temperature',
  });
  await sleep(300);

  addLogRow({
    id: fid, source: JACEK_URI, timestamp: now(),
    key: keyURI('facet/meaning'),
    value: 'def:patient-body-temperature-oral-reading',
  });
  await sleep(300);

  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/meaning'),
    value: 'verdict:mismatch,mu_m:1,ron:indoor-air-temperature,jacek:patient-body-temperature',
  });
  state.mu.m = 1;
  eliminateInterpretations('meaning');
  updateUncertainty('2', '1.00', 'mismatch detected');
  await sleep(300);

  // ---- STRUCTURE (rows 10-12) ----
  state.facetPhase = 'STRUCTURE';
  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/structure'),
    value: 'ask:unit,precision,valid-range',
  });
  await sleep(300);

  addLogRow({
    id: fid, source: JACEK_URI, timestamp: now(),
    key: keyURI('facet/structure'),
    value: 'unit:fahrenheit,precision:1,range:90-110',
  });
  await sleep(300);

  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/structure'),
    value: 'verdict:mismatch,mu_s:1,ron:celsius,jacek:fahrenheit',
  });
  state.mu.s = 1;
  eliminateInterpretations('structure');
  updateUncertainty('1', '0.00', 'resolved but incoherent');
  await sleep(300);

  // ---- DATA (rows 13-15) ----
  state.facetPhase = 'DATA';
  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/data'),
    value: 'ask:current-value',
  });
  await sleep(300);

  addLogRow({
    id: fid, source: JACEK_URI, timestamp: now(),
    key: keyURI('facet/data'),
    value: 'val:30',
  });
  await sleep(300);

  addLogRow({
    id: fid, source: RON_URI, timestamp: now(),
    key: keyURI('facet/data'),
    value: 'verdict:halt,mu_d:undefined,reason:meaning-and-structure-misaligned,note:30F-outside-clinical-range(90-110)-and-30C-is-room-temp-not-body-temp',
  });
  state.mu.d = undefined;
  state.facetPhase = 'COMPLETE';

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
