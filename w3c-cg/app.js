const express = require('express');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSV, images, etc.)
app.use(express.static(__dirname));

// Interactive protocol demo
app.get('/demo', (req, res) => {
  res.render('demo', { title: 'Context Graph Protocol — Interactive Demo' });
});

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
