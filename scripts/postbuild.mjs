/**
 * Prepends "use client" directive to the React entry point build outputs.
 * tsup strips directives during bundling, so we add them back after build.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const DIRECTIVE = '"use client";\n';
const files = ['dist/react.mjs', 'dist/react.js'];

for (const file of files) {
  try {
    const content = readFileSync(file, 'utf-8');
    if (!content.startsWith('"use client"')) {
      writeFileSync(file, DIRECTIVE + content);
      console.log(`✓ Added "use client" to ${file}`);
    } else {
      console.log(`✓ ${file} already has "use client"`);
    }
  } catch (err) {
    console.error(`✗ Failed to process ${file}:`, err.message);
    process.exit(1);
  }
}
