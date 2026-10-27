// Fix remaining mojibake using byte-level replacement
import fs from 'fs';

const file = 'src/components/CompassView.tsx';
let bytes = fs.readFileSync(file);
let content = new TextDecoder('utf-8').decode(bytes);

// Build the mojibake strings from their UTF-8 code points
// These are what the corrupted bytes look like when read as UTF-8
function mojibake(...codePoints) {
  return String.fromCharCode(...codePoints);
}

// â€" = em dash mojibake (E2 80 9C as CP1252)
const emDashMoj = mojibake(0xE2, 0x80, 0x9C); // â€"
// But in the file these are stored as individual UTF-8 chars:
// â = U+00E2, € = U+20AC, " = U+0022 (wait, that's not right)

// Let me just read the actual bytes from the file and find the patterns
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

// Find all unique sequences of chars in 0x80-0xFF range
const lines = content.split('\n');
const mojibakeSequences = new Set();

for (const line of lines) {
  let seq = '';
  for (let i = 0; i < line.length; i++) {
    const code = line.charCodeAt(i);
    if (code >= 0x80 && code < 0x100) {
      seq += line[i];
    } else {
      if (seq.length >= 2) {
        mojibakeSequences.add(seq);
      }
      seq = '';
    }
  }
  if (seq.length >= 2) {
    mojibakeSequences.add(seq);
  }
}

console.log('Found mojibake sequences:');
for (const seq of mojibakeSequences) {
  // Get the bytes
  const encoded = encoder.encode(seq);
  const byteStr = Array.from(encoded).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ');
  
  // Try to decode as UTF-8
  try {
    const decoded = decoder.decode(encoded);
    console.log(`  ${byteStr} -> "${seq}" -> "${decoded}"`);
  } catch {
    console.log(`  ${byteStr} -> "${seq}" -> (invalid UTF-8)`);
  }
}
