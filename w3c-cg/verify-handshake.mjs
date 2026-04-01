#!/usr/bin/env node
/**
 * verify-handshake.mjs — SHA-256 handshake verifier for Context Graph Protocol
 *
 * Usage:  node verify-handshake.mjs log.csv
 *
 * Reads a canonical log.csv produced by the demo, locates the SYN / SYN-ACK / ACK
 * rows by their `key` column, and cryptographically verifies the nonce-hash chain.
 *
 * Verification logic (Section 4.1):
 *   SYN       value = <nonce>
 *   SYN-ACK   value = <new_nonce>:sha256(<SYN nonce>)
 *   ACK       value = sha256(<SYN-ACK nonce>)
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(current); current = ''; continue; }
      current += ch;
    }
    values.push(current);
    const obj = {};
    header.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    return obj;
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const file = process.argv[2];
if (!file) {
  console.error('Usage: node verify-handshake.mjs <log.csv>');
  process.exit(1);
}

const rows = parseCSV(readFileSync(file, 'utf-8'));

const synRow    = rows.find(r => r.key && r.key.endsWith('protocol/syn'));
const synAckRow = rows.find(r => r.key && r.key.endsWith('protocol/syn-ack'));
const ackRow    = rows.find(r => r.key && r.key.endsWith('protocol/ack'));

if (!synRow || !synAckRow || !ackRow) {
  console.error('ERROR: Could not find SYN, SYN-ACK, and ACK rows in log.');
  console.error('  SYN:     ' + (synRow ? 'found' : 'MISSING'));
  console.error('  SYN-ACK: ' + (synAckRow ? 'found' : 'MISSING'));
  console.error('  ACK:     ' + (ackRow ? 'found' : 'MISSING'));
  process.exit(1);
}

const synNonce = synRow.value;
const synAckParts = synAckRow.value.split(':');
const synAckNonce = synAckParts[0];
const synAckHash  = synAckParts.slice(1).join(':'); // rejoin in case hash contains ':'
const ackHash = ackRow.value;

console.log('Context Graph Protocol — SHA-256 Handshake Verification');
console.log('========================================================\n');

console.log('Step 1 — SYN');
console.log('  nonce:  ' + synNonce);

console.log('\nStep 2 — SYN-ACK');
console.log('  nonce:  ' + synAckNonce);
console.log('  hash:   ' + synAckHash);
const expectedHash1 = sha256(synNonce);
console.log('  expect: ' + expectedHash1);
const check1 = expectedHash1 === synAckHash;
console.log('  result: ' + (check1 ? 'PASS' : 'FAIL') + ' — sha256(SYN nonce) ' + (check1 ? '==' : '!=') + ' SYN-ACK hash');

console.log('\nStep 3 — ACK');
console.log('  hash:   ' + ackHash);
const expectedHash2 = sha256(synAckNonce);
console.log('  expect: ' + expectedHash2);
const check2 = expectedHash2 === ackHash;
console.log('  result: ' + (check2 ? 'PASS' : 'FAIL') + ' — sha256(SYN-ACK nonce) ' + (check2 ? '==' : '!=') + ' ACK hash');

console.log('\n========================================================');
const overall = check1 && check2;
console.log('OVERALL: ' + (overall ? 'PASS' : 'FAIL'));
console.log('The SHA-256 handshake chain is ' + (overall ? 'cryptographically valid.' : 'BROKEN.'));
process.exit(overall ? 0 : 1);
