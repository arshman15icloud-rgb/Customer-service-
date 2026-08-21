import fs from 'fs';
import path from 'path';

function fixImportsInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixImportsInDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const updated = content.replace(/from\s+(['"])(\.\.?[^'"]*?)\.js\1/g, 'from $1$2$1');
      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log('Fixed imports in', fullPath);
      }
    }
  }
}

fixImportsInDir('./src');
