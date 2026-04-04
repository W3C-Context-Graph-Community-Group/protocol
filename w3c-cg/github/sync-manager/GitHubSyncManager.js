'use strict';

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * GitHubSyncManager — syncs every protocol claim to a GitHub branch in real time.
 *
 * Auth: tries `gh` CLI first, falls back to GITHUB_TOKEN env var.
 * Strategy: one branch per session — `run/{timestamp}-{systemA}--{systemB}`
 */
class GitHubSyncManager {
  constructor({ repoOwner, repoName, baseBranch = 'main' }) {
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.baseBranch = baseBranch;
    this.authMethod = null; // 'gh' | 'token' | null
    this.branchName = null;
    this.boundaryDir = null; // relative path inside repo, e.g. demo/boundaries/ron--jacek
    this.systemA = null;
    this.systemB = null;
  }

  // ---------------------------------------------------------------------------
  // Shell helper
  // ---------------------------------------------------------------------------
  _exec(cmd, args, opts = {}) {
    return new Promise((resolve, reject) => {
      execFile(cmd, args, { cwd: REPO_ROOT, maxBuffer: 10 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
        if (err) {
          err.stderr = stderr;
          err.stdout = stdout;
          return reject(err);
        }
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Auth detection
  // ---------------------------------------------------------------------------
  async detectAuth() {
    // 1. Try gh CLI
    try {
      await this._exec('gh', ['auth', 'status']);
      this.authMethod = 'gh';
      return 'gh';
    } catch (_) { /* gh not available or not logged in */ }

    // 2. Try GITHUB_TOKEN env var
    if (process.env.GITHUB_TOKEN) {
      this.authMethod = 'token';
      return 'token';
    }

    this.authMethod = null;
    return null;
  }

  async verifyAccess() {
    const method = this.authMethod || await this.detectAuth();
    if (!method) {
      return { ok: false, method: null, error: 'No GitHub auth available (need gh CLI or GITHUB_TOKEN)' };
    }

    try {
      if (method === 'gh') {
        await this._exec('gh', ['repo', 'view', `${this.repoOwner}/${this.repoName}`]);
      } else {
        const token = process.env.GITHUB_TOKEN;
        await this._exec('git', [
          'ls-remote',
          `https://${token}@github.com/${this.repoOwner}/${this.repoName}.git`,
          'HEAD',
        ]);
      }
      return { ok: true, method };
    } catch (err) {
      return { ok: false, method, error: err.message || String(err) };
    }
  }

  // ---------------------------------------------------------------------------
  // Session lifecycle
  // ---------------------------------------------------------------------------
  async initSession(systemA, systemB) {
    this.systemA = systemA;
    this.systemB = systemB;

    // Generate branch name: run/{YYYY-MM-DDTHH-MM}-{systemA}--{systemB}
    const ts = new Date().toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, '');
    this.branchName = `run/${ts}-${systemA}--${systemB}`;
    this.boundaryDir = `demo/boundaries/${systemA}--${systemB}`;

    // Create branch from current HEAD
    await this._exec('git', ['checkout', '-b', this.branchName]);

    // Create scaffold files
    const absDir = path.join(REPO_ROOT, this.boundaryDir);
    fs.mkdirSync(absDir, { recursive: true });

    // Initial README
    const readme = `# Boundary: ${systemA} \u2194 ${systemB}\n\n## Status: PENDING\n\nSession started. Protocol running...\n`;
    fs.writeFileSync(path.join(absDir, 'README.md'), readme, 'utf-8');

    // Initial index.html (GitHub Pages dereferenceable URI)
    const initState = { protocolState: 'NULL', facetPhase: 'IDLE', mu: {}, log: [] };
    fs.writeFileSync(path.join(absDir, 'index.html'), this.generateBoundaryHTML(initState), 'utf-8');

    // Log CSV — header only
    fs.writeFileSync(path.join(absDir, 'log.csv'), 'id,source,timestamp,key,value\n', 'utf-8');

    // Commit + push
    await this._commitAndPush(
      `init: boundary ${systemA} \u2194 ${systemB}`,
      [path.join(this.boundaryDir, 'README.md'), path.join(this.boundaryDir, 'index.html'), path.join(this.boundaryDir, 'log.csv')],
    );

    const branchUrl = `https://github.com/${this.repoOwner}/${this.repoName}/tree/${this.branchName}`;
    return { branchName: this.branchName, branchUrl };
  }

  async syncClaim(claim, clientState) {
    if (!this.branchName || !this.boundaryDir) {
      throw new Error('No active sync session — call initSession first');
    }

    const absDir = path.join(REPO_ROOT, this.boundaryDir);
    const filesToCommit = [];

    // 1. Append to log.csv
    const csvRow = this._claimToCSVRow(claim);
    fs.appendFileSync(path.join(absDir, 'log.csv'), csvRow + '\n', 'utf-8');
    filesToCommit.push(path.join(this.boundaryDir, 'log.csv'));

    // 2. Update boundary README + index.html
    const readme = this.generateBoundaryREADME(clientState);
    fs.writeFileSync(path.join(absDir, 'README.md'), readme, 'utf-8');
    filesToCommit.push(path.join(this.boundaryDir, 'README.md'));

    fs.writeFileSync(path.join(absDir, 'index.html'), this.generateBoundaryHTML(clientState), 'utf-8');
    filesToCommit.push(path.join(this.boundaryDir, 'index.html'));

    // 3. If this is a facet claim, create/update temperature dir
    const key = claim.key || '';
    if (key.includes('facet/')) {
      const facetDir = path.join(absDir, 'temperature');
      fs.mkdirSync(facetDir, { recursive: true });

      const facetReadme = this.generateFacetREADME(clientState, 'temperature');
      fs.writeFileSync(path.join(facetDir, 'README.md'), facetReadme, 'utf-8');
      filesToCommit.push(path.join(this.boundaryDir, 'temperature', 'README.md'));

      fs.writeFileSync(path.join(facetDir, 'index.html'), this.generateFacetHTML(clientState, 'temperature'), 'utf-8');
      filesToCommit.push(path.join(this.boundaryDir, 'temperature', 'index.html'));
    }

    // 4. Commit + push
    const rowNum = clientState.rowNum || '?';
    const shortKey = this._shortKey(claim.key);
    const source = this._shortSource(claim.source);
    const message = `claim #${rowNum}: ${shortKey} from ${source}`;
    const hash = await this._commitAndPush(message, filesToCommit);

    return { ok: true, commitHash: hash };
  }

  async finalizeSession(clientState) {
    if (!this.branchName || !this.boundaryDir) {
      throw new Error('No active sync session');
    }

    const absDir = path.join(REPO_ROOT, this.boundaryDir);
    const filesToCommit = [];

    // Generate final README + index.html with full verdict
    const readme = this.generateBoundaryREADME(clientState);
    fs.writeFileSync(path.join(absDir, 'README.md'), readme, 'utf-8');
    filesToCommit.push(path.join(this.boundaryDir, 'README.md'));

    fs.writeFileSync(path.join(absDir, 'index.html'), this.generateBoundaryHTML(clientState), 'utf-8');
    filesToCommit.push(path.join(this.boundaryDir, 'index.html'));

    // Update facet README + index.html too
    const facetDir = path.join(absDir, 'temperature');
    if (fs.existsSync(facetDir)) {
      const facetReadme = this.generateFacetREADME(clientState, 'temperature');
      fs.writeFileSync(path.join(facetDir, 'README.md'), facetReadme, 'utf-8');
      filesToCommit.push(path.join(this.boundaryDir, 'temperature', 'README.md'));

      fs.writeFileSync(path.join(facetDir, 'index.html'), this.generateFacetHTML(clientState, 'temperature'), 'utf-8');
      filesToCommit.push(path.join(this.boundaryDir, 'temperature', 'index.html'));
    }

    // Final commit
    await this._commitAndPush('finalize: session complete', filesToCommit);

    // Try to open a PR (non-fatal if it fails)
    let prUrl = null;
    try {
      if (this.authMethod === 'gh') {
        const { stdout } = await this._exec('gh', [
          'pr', 'create',
          '--title', `Boundary: ${this.systemA} \u2194 ${this.systemB}`,
          '--body', `Automated protocol run.\n\nBranch: \`${this.branchName}\``,
          '--base', this.baseBranch,
          '--head', this.branchName,
        ]);
        prUrl = stdout.trim();
      }
    } catch (_) { /* PR creation is optional */ }

    // Switch back to base branch
    try {
      await this._exec('git', ['checkout', this.baseBranch]);
    } catch (_) { /* best effort */ }

    return { ok: true, prUrl };
  }

  // ---------------------------------------------------------------------------
  // File generation
  // ---------------------------------------------------------------------------
  generateLogCSV(log) {
    const header = 'id,source,timestamp,key,value';
    const rows = (log || []).map(c => this._claimToCSVRow(c));
    return header + '\n' + rows.join('\n') + '\n';
  }

  generateBoundaryREADME(clientState) {
    const a = this.systemA || 'SystemA';
    const b = this.systemB || 'SystemB';
    const mu = clientState.mu || {};
    const status = this._deriveStatus(clientState);

    let facetTable = '| Facet | Result | Detail |\n|-------|--------|--------|\n';
    if (mu.c !== null && mu.c !== undefined) {
      facetTable += `| Context (\u03bc_C) | \u2705 Sufficient | Both sides surfaced domain, units, measurement type |\n`;
    }
    if (mu.m !== null && mu.m !== undefined) {
      facetTable += `| Meaning (\u03bc_M) | \u274c Mismatch | ${a}: indoor air temperature \u00b7 ${b}: patient body temperature |\n`;
    }
    if (mu.s !== null && mu.s !== undefined) {
      facetTable += `| Structure (\u03bc_S) | \u274c Mismatch | ${a}: Celsius, integer, range 15\u201345 \u00b7 ${b}: Fahrenheit, integer, range 90\u2013110 |\n`;
    }
    if (mu.d !== undefined && mu.d !== null) {
      facetTable += `| Data (\u03bc_D) | \u26d4 Undefined | Cannot interpret \u2014 meaning and structure are misaligned |\n`;
    } else if (clientState.facetPhase === 'COMPLETE' || clientState.protocolState === 'CLOSED') {
      facetTable += `| Data (\u03bc_D) | \u26d4 Undefined | Cannot interpret \u2014 meaning and structure are misaligned |\n`;
    }

    const claimCount = (clientState.log || []).length;

    let md = `# Boundary: ${a} \u2194 ${b}\n\n`;
    md += `## Status: ${status}\n\n`;
    md += facetTable + '\n';
    md += `## Protocol trace\n\n`;
    md += `${claimCount} claims recorded. See [log.csv](log.csv) for the full trace.\n\n`;

    if (status === 'INCOHERENT' || status === 'CLOSED') {
      md += `## What happened\n\n`;
      md += `Both systems have a field called \`temperature\` with the value \`30\`. `;
      md += `The column name matches. The value matches. Shannon reports perfect transmission.\n\n`;
      md += `The protocol surfaced three misalignments invisible to every standard instrument:\n\n`;
      md += `1. **Meaning mismatch:** ${a} measures room air temperature. ${b} measures patient body temperature.\n`;
      md += `2. **Structure mismatch:** ${a} encodes in Celsius. ${b} encodes in Fahrenheit.\n`;
      md += `3. **Data incoherence:** The value \`30\` means completely different things under different codebooks.\n\n`;
      md += `## Protocol action: HALT\n\n`;
      md += `The boundary is incoherent. Any computation that merges these two \`temperature\` values will produce a confidently wrong result.\n`;
    }

    return md;
  }

  generateFacetREADME(clientState, facet) {
    const a = this.systemA || 'SystemA';
    const b = this.systemB || 'SystemB';
    const mu = clientState.mu || {};
    const phase = clientState.facetPhase || 'IDLE';

    let md = `# Facet evaluation: ${facet}\n\n`;
    md += `Boundary: ${a} \u2194 ${b}\n\n`;

    if (mu.c !== null && mu.c !== undefined) {
      md += `## Context (\u03bc_C = ${mu.c})\n\nBoth sides surfaced domain, units, measurement type. Domains differ (HVAC vs clinical).\n\n`;
    }
    if (mu.m !== null && mu.m !== undefined) {
      md += `## Meaning (\u03bc_M = ${mu.m})\n\n${a}: indoor air temperature. ${b}: patient body temperature. **Mismatch.**\n\n`;
    }
    if (mu.s !== null && mu.s !== undefined) {
      md += `## Structure (\u03bc_S = ${mu.s})\n\n${a}: Celsius, range 15\u201345. ${b}: Fahrenheit, range 90\u2013110. **Mismatch.**\n\n`;
    }
    if (phase === 'COMPLETE' || clientState.protocolState === 'CLOSED') {
      md += `## Data (\u03bc_D = undefined)\n\nCannot interpret \u2014 meaning and structure are misaligned. **Halted.**\n\n`;
    }

    md += `## Current phase: ${phase}\n`;
    return md;
  }

  // ---------------------------------------------------------------------------
  // HTML generation (GitHub Pages dereferenceable URIs)
  // ---------------------------------------------------------------------------
  _htmlShell(title, subtitle, body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this._escHtml(title)} \u2014 Context Graph Protocol</title>
<style>
:root{--bg:#fff;--t:#1a1a2e;--td:rgba(0,0,0,0.45);--border:rgba(0,0,0,0.1);--cyan:#0891b2;--green:#059669;--red:#dc2626;--yellow:#d97706;--pur:#7c3aed;--panel:rgba(0,0,0,0.025)}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--t);font-family:'JetBrains Mono',monospace;max-width:700px;margin:0 auto;padding:40px 20px;line-height:1.7}
h1{font-size:1.6em;margin-bottom:4px}
.sub{color:var(--td);font-size:.8em;margin-bottom:24px}
h2{font-size:1.1em;margin:24px 0 8px;color:var(--cyan)}
p,li{font-size:.85em}
code{background:rgba(0,0,0,.06);padding:2px 6px;border-radius:3px;font-size:.85em}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:.8em}
th,td{text-align:left;padding:6px 10px;border-bottom:1px solid var(--border)}
th{color:var(--td);font-weight:400;text-transform:uppercase;font-size:.75em;letter-spacing:1px}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
.badge{display:inline-block;padding:3px 10px;border-radius:4px;font-weight:700;font-size:.85em;margin:4px 0}
.badge.green{background:rgba(52,211,153,0.15);color:var(--green)}
.badge.red{background:rgba(239,68,68,0.15);color:var(--red)}
.badge.yellow{background:rgba(251,191,36,0.15);color:var(--yellow)}
.badge.purple{background:rgba(167,139,250,0.15);color:var(--pur)}
.nav{margin-top:32px;padding-top:16px;border-top:1px solid var(--border);font-size:.75em;color:var(--td)}
</style>
</head>
<body>
<h1>${this._escHtml(title)}</h1>
<p class="sub">${this._escHtml(subtitle)}</p>
${body}
</body>
</html>`;
  }

  _escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  generateBoundaryHTML(clientState) {
    const a = this.systemA || 'SystemA';
    const b = this.systemB || 'SystemB';
    const mu = clientState.mu || {};
    const status = this._deriveStatus(clientState);
    const claimCount = (clientState.log || []).length;

    const statusClass = status === 'INCOHERENT' ? 'red' : status === 'COHERENT' ? 'green' : status === 'ESTABLISHED' ? 'purple' : 'yellow';

    let body = `<p><span class="badge ${statusClass}">${this._escHtml(status)}</span></p>\n`;

    // Facet table
    body += '<h2>Facet evaluation</h2>\n<table>\n<tr><th>Facet</th><th>Result</th><th>Detail</th></tr>\n';
    if (mu.c !== null && mu.c !== undefined) {
      body += `<tr><td>\u03bc<sub>C</sub> Context</td><td><span class="badge green">Sufficient</span></td><td>Both sides surfaced domain, units, measurement type</td></tr>\n`;
    }
    if (mu.m !== null && mu.m !== undefined) {
      body += `<tr><td>\u03bc<sub>M</sub> Meaning</td><td><span class="badge red">Mismatch</span></td><td>${this._escHtml(a)}: indoor air temperature \u00b7 ${this._escHtml(b)}: patient body temperature</td></tr>\n`;
    }
    if (mu.s !== null && mu.s !== undefined) {
      body += `<tr><td>\u03bc<sub>S</sub> Structure</td><td><span class="badge red">Mismatch</span></td><td>${this._escHtml(a)}: Celsius \u00b7 ${this._escHtml(b)}: Fahrenheit</td></tr>\n`;
    }
    if (mu.d !== undefined && mu.d !== null || clientState.facetPhase === 'COMPLETE' || clientState.protocolState === 'CLOSED') {
      body += `<tr><td>\u03bc<sub>D</sub> Data</td><td><span class="badge yellow">Undefined</span></td><td>Cannot interpret \u2014 meaning and structure are misaligned</td></tr>\n`;
    }
    body += '</table>\n';

    body += `<h2>Protocol trace</h2>\n<p>${claimCount} claims recorded. <a href="log.csv">Download log.csv</a></p>\n`;

    if (status === 'INCOHERENT' || status === 'CLOSED') {
      body += '<h2>What happened</h2>\n';
      body += `<p>Both systems have a field called <code>temperature</code> with the value <code>30</code>. The column name matches. The value matches. Shannon reports perfect transmission.</p>\n`;
      body += '<p>The protocol surfaced three misalignments invisible to every standard instrument:</p>\n<ol>\n';
      body += `<li><strong>Meaning mismatch:</strong> ${this._escHtml(a)} measures room air temperature. ${this._escHtml(b)} measures patient body temperature.</li>\n`;
      body += `<li><strong>Structure mismatch:</strong> ${this._escHtml(a)} encodes in Celsius. ${this._escHtml(b)} encodes in Fahrenheit.</li>\n`;
      body += '<li><strong>Data incoherence:</strong> The value <code>30</code> means completely different things under different codebooks.</li>\n</ol>\n';
      body += '<h2>Protocol action</h2>\n<p><span class="badge red">HALT</span> \u2014 The boundary is incoherent.</p>\n';
    }

    body += `<div class="nav"><a href="../">&#8592; boundaries</a> &middot; <a href="temperature/">temperature field</a> &middot; <a href="log.csv">log.csv</a></div>\n`;

    return this._htmlShell(`Boundary: ${a} \u2194 ${b}`, `${a} \u2194 ${b} \u00b7 field: temperature = 30`, body);
  }

  generateFacetHTML(clientState, facet) {
    const a = this.systemA || 'SystemA';
    const b = this.systemB || 'SystemB';
    const mu = clientState.mu || {};
    const phase = clientState.facetPhase || 'IDLE';

    let body = '';

    if (mu.c !== null && mu.c !== undefined) {
      body += `<h2>Context (\u03bc<sub>C</sub> = ${mu.c})</h2>\n`;
      body += '<p>Both sides surfaced domain, units, measurement type. Domains differ (HVAC vs clinical).</p>\n';
    }
    if (mu.m !== null && mu.m !== undefined) {
      body += `<h2>Meaning (\u03bc<sub>M</sub> = ${mu.m})</h2>\n`;
      body += `<p>${this._escHtml(a)}: indoor air temperature. ${this._escHtml(b)}: patient body temperature. <span class="badge red">Mismatch</span></p>\n`;
    }
    if (mu.s !== null && mu.s !== undefined) {
      body += `<h2>Structure (\u03bc<sub>S</sub> = ${mu.s})</h2>\n`;
      body += `<p>${this._escHtml(a)}: Celsius, range 15\u201345. ${this._escHtml(b)}: Fahrenheit, range 90\u2013110. <span class="badge red">Mismatch</span></p>\n`;
    }
    if (phase === 'COMPLETE' || clientState.protocolState === 'CLOSED') {
      body += '<h2>Data (\u03bc<sub>D</sub> = undefined)</h2>\n';
      body += '<p>Cannot interpret \u2014 meaning and structure are misaligned. <span class="badge yellow">Halted</span></p>\n';
    }

    body += `<p>Current phase: <span class="badge purple">${this._escHtml(phase)}</span></p>\n`;
    body += `<div class="nav"><a href="../">&#8592; ${this._escHtml(a)} \u2194 ${this._escHtml(b)}</a> &middot; <a href="../log.csv">log.csv</a></div>\n`;

    return this._htmlShell(`Facet: ${facet}`, `${a} \u2194 ${b} \u00b7 ${facet}`, body);
  }

  // ---------------------------------------------------------------------------
  // Git operations (internal)
  // ---------------------------------------------------------------------------
  async _commitAndPush(message, files) {
    // Set up token-based remote if needed
    if (this.authMethod === 'token' && !this._remoteConfigured) {
      const token = process.env.GITHUB_TOKEN;
      const url = `https://${token}@github.com/${this.repoOwner}/${this.repoName}.git`;
      try {
        await this._exec('git', ['remote', 'set-url', 'origin', url]);
      } catch (_) {
        await this._exec('git', ['remote', 'add', 'origin', url]);
      }
      this._remoteConfigured = true;
    }

    // git add
    for (const f of files) {
      await this._exec('git', ['add', f]);
    }

    // git commit
    await this._exec('git', ['commit', '-m', message]);

    // Get commit hash
    const { stdout: hash } = await this._exec('git', ['rev-parse', '--short', 'HEAD']);

    // git push
    if (!this._pushed) {
      await this._exec('git', ['push', '-u', 'origin', this.branchName]);
      this._pushed = true;
    } else {
      await this._exec('git', ['push']);
    }

    return hash.trim();
  }

  // ---------------------------------------------------------------------------
  // Utilities (internal)
  // ---------------------------------------------------------------------------
  _claimToCSVRow(claim) {
    const vals = [claim.id, claim.source, claim.timestamp, claim.key, claim.value];
    return vals.map(v => {
      const s = String(v);
      return s.includes(',') ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',');
  }

  _shortKey(fullKeyURI) {
    if (!fullKeyURI) return 'unknown';
    const base = 'https://w3c-cg.github.io/context-graph/';
    if (fullKeyURI.startsWith(base)) return fullKeyURI.slice(base.length);
    return fullKeyURI;
  }

  _shortSource(uri) {
    if (!uri) return 'unknown';
    if (uri.includes('/ron')) return 'ron';
    if (uri.includes('/jacek')) return 'jacek';
    return uri;
  }

  _deriveStatus(clientState) {
    const ps = clientState.protocolState || 'NULL';
    if (ps === 'CLOSED') {
      const mu = clientState.mu || {};
      if (mu.m === 1 || mu.s === 1) return 'INCOHERENT';
      return 'COHERENT';
    }
    if (ps === 'CLOSING') return 'CLOSING';
    if (ps === 'EVALUATING') return 'EVALUATING';
    if (ps === 'ESTABLISHED') return 'ESTABLISHED';
    return 'PENDING';
  }
}

module.exports = GitHubSyncManager;
