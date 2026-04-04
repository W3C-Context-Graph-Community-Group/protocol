const express = require('express');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const GitHubSyncManager = require('./github/sync-manager/GitHubSyncManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

// Sync manager — one instance shared across all API calls
const syncManager = new GitHubSyncManager({
  repoOwner: 'W3C-Context-Graph-Community-Group',
  repoName: 'protocol',
  baseBranch: 'main',
});

// ---------------------------------------------------------------------------
// Sync API
// ---------------------------------------------------------------------------
app.get('/api/sync/status', async (req, res) => {
  const access = await syncManager.verifyAccess();
  res.json({
    available: access.ok,
    method: access.method,
    reason: access.ok ? null : access.error,
  });
});

app.post('/api/sync/init', async (req, res) => {
  try {
    const { systemA, systemB } = req.body;
    const result = await syncManager.initSession(systemA, systemB);
    res.json({ ok: true, branchName: result.branchName, branchUrl: result.branchUrl });
  } catch (err) {
    console.error('[sync] init error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/sync/claim', async (req, res) => {
  try {
    const { claim, state } = req.body;
    const result = await syncManager.syncClaim(claim, state);
    res.json(result);
  } catch (err) {
    console.error('[sync] claim error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/sync/finalize', async (req, res) => {
  try {
    const { state } = req.body;
    const result = await syncManager.finalizeSession(state);
    res.json(result);
  } catch (err) {
    console.error('[sync] finalize error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Interactive protocol demo (must precede static middleware to avoid demo/ directory redirect)
app.get('/demo', (req, res) => {
  res.render('demo', { title: 'Context Graph Protocol — Interactive Demo' });
});

// Serve static files (CSV, images, etc.)
app.use(express.static(__dirname));

// Render markdown files as HTML
app.use((req, res, next) => {
  // Try to find a .md file for the requested path
  const candidates = [
    path.join(__dirname, req.path + '.md'),
    path.join(__dirname, req.path, 'index.md'),
    path.join(__dirname, req.path, 'README.md'),
  ];

  const mdFile = candidates.find((f) => fs.existsSync(f));
  if (!mdFile) return next();

  const markdown = fs.readFileSync(mdFile, 'utf-8');
  const htmlContent = marked(markdown);

  res.render('markdown', {
    title: path.basename(req.path) || 'Context Graph',
    content: htmlContent,
  });
});

app.get('/', (req, res) => {
  // Serve the root README as the homepage
  const readmePath = path.join(__dirname, 'README.md');
  if (fs.existsSync(readmePath)) {
    const markdown = fs.readFileSync(readmePath, 'utf-8');
    const htmlContent = marked(markdown);
    return res.render('markdown', {
      title: 'W3C Context Graph',
      content: htmlContent,
    });
  }
  res.render('index', { title: 'W3C Context Graph', message: 'Hello World!' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
