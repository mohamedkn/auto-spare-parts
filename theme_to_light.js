const fs = require('fs');
const path = require('path');

const apps = ['mobile-app', 'vendor-app'];
const root = 'd:\\قطع الغيار';

const replacements = [
  { from: /bg-\[\#09090b\]/g, to: 'bg-slate-50' },
  { from: /bg-zinc-900\/80/g, to: 'bg-white/90' },
  { from: /bg-zinc-900/g, to: 'bg-white' },
  { from: /bg-zinc-800\/50/g, to: 'bg-slate-100/50' },
  { from: /bg-zinc-800/g, to: 'bg-slate-100' },
  { from: /border-zinc-800\/50/g, to: 'border-slate-200' },
  { from: /border-zinc-800/g, to: 'border-slate-200' },
  { from: /border-zinc-850/g, to: 'border-slate-200' },
  { from: /border-zinc-700/g, to: 'border-slate-300' },
  { from: /text-white/g, to: 'text-slate-900' },
  { from: /text-zinc-100/g, to: 'text-slate-800' },
  { from: /text-zinc-300/g, to: 'text-slate-600' },
  { from: /text-zinc-400/g, to: 'text-slate-500' },
  { from: /text-zinc-500/g, to: 'text-slate-500' },
  { from: /color="#ffffff"/g, to: 'color="#0f172a"' },
  { from: /color="white"/g, to: 'color="#0f172a"' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const r of replacements) {
        newContent = newContent.replace(r.from, r.to);
      }
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

apps.forEach(app => {
  const srcPath = path.join(root, app, 'src');
  if (fs.existsSync(srcPath)) {
    processDir(srcPath);
  }
});
