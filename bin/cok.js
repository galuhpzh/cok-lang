#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Runtime } from '../src/runtime.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Loh rek, file-e endi sing mau dijalanno?");
  process.exit(1);
}

const arg = args[0];

if (arg === '--versi' || arg === '--version') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  console.log(`cok-lang versi ${pkg.version}`);
  process.exit(0);
}

if (arg === '--tulung' || arg === '--help') {
  console.log(`
Cara panggunaan:
  cok <file.cok>

Opsi:
  --tulung, --help         Tampilkan bantuan
  --versi, --version       Tampilkan versi
  --debug-token <file>     Tampilkan daftar token
  --debug-ast <file>       Tampilkan struktur AST
  --debug-js <file>        Tampilkan output JS
  `);
  process.exit(0);
}

let filePath = arg;
let debugMode = null;

if (arg.startsWith('--debug-')) {
  debugMode = arg;
  filePath = args[1];
  if (!filePath) {
    console.log("Loh rek, file-e endi sing mau didebug?");
    process.exit(1);
  }
}

if (!filePath.endsWith('.cok')) {
  console.warn("\x1b[33mWarning: Ekstensi file dudu .cok rek!\x1b[0m");
}

const runtime = new Runtime();

if (debugMode) {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const { tokens, ast, jsCode } = runtime.compile(source);
    
    if (debugMode === '--debug-token') {
      console.log(tokens);
    } else if (debugMode === '--debug-ast') {
      console.log(JSON.stringify(ast, null, 2));
    } else if (debugMode === '--debug-js') {
      console.log(jsCode);
    } else {
      console.log("Opsi debug gak dikenal rek!");
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
} else {
  runtime.run(filePath);
}
