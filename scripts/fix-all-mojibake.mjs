// Fix ALL remaining mojibake in CompassView.tsx
// Reads raw bytes, finds all corrupted sequences, and replaces them

import fs from 'fs';

const file = 'src/components/CompassView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Count current replacement characters
const replacementCharCount = (content.match(/�/g) || []).length;
console.log(`Found ${replacementCharCount} replacement characters (�)`);

// Count chars in 0x80-0xFF range (mojibake indicators)
let mojibakeCount = 0;
for (const ch of content) {
  const code = ch.charCodeAt(0);
  if (code >= 0x80 && code < 0x100) {
    mojibakeCount++;
  }
}
console.log(`Found ${mojibakeCount} chars in 0x80-0xFF range (mojibake)`);

// Strategy: Find all runs of bytes in 0x80-0xFF range plus replacement chars
// and try to transcode them back to proper UTF-8

function fixLine(line) {
  let result = '';
  let i = 0;
  
  while (i < line.length) {
    const code = line.charCodeAt(i);
    
    if (code === 0xFFFD) {
      // Replacement character � - this is already corrupted, try to figure out what it was
      // Look at context: if followed by more mojibake chars, collect them all
      const start = i;
      const bytes = [];
      
      // Collect replacement chars and adjacent mojibake chars
      while (i < line.length) {
        const c = line.charCodeAt(i);
        if (c === 0xFFFD || (c >= 0x80 && c < 0x100)) {
          bytes.push(c);
          i++;
        } else {
          break;
        }
      }
      
      // Try to decode the collected bytes (excluding 0xFFFD which is just a placeholder)
      // The 0xFFFD chars were originally multi-byte UTF-8 that got corrupted
      // We need to look at the CONTEXT to guess what they were
      
      // Common patterns:
      // �° = degree sign after number (lat/lng)
      // �Ÿ"� = emoji starting with U+1F
      // �€" = em dash
      
      const segment = line.slice(start, i);
      
      // If it's just a single � after a number, it's likely a degree sign
      if (segment === '�' && line[start - 1] >= '0' && line[start - 1] <= '9') {
        result += '°';
      }
      // �€" pattern = em dash —
      else if (segment.includes('�€"')) {
        result += '—';
      }
      // �Ÿ" pattern = emoji fragment
      else if (segment.includes('�Ÿ"')) {
        // Try to identify the emoji
        if (segment.includes('�Ÿ"�')) result += '📍';
        else if (segment.includes('�Ÿ§')) result += '🧭';
        else if (segment.includes('�ŸŒ')) result += '🌊';
        else if (segment.includes('�Ÿ"œ')) result += '📜';
        else if (segment.includes('�Ÿ"¥')) result += '🔥';
        else if (segment.includes('�Ÿ')) result += '✨';
        else result += segment; // keep as is if we can't identify
      }
      // �†' pattern = arrow →
      else if (segment.includes('�†\'')) {
        result += '→';
      }
      // Just replacement chars with no recognizable pattern
      else {
        // Try to transcode the non-replacement bytes
        const realBytes = bytes.filter(b => b !== 0xFFFD);
        if (realBytes.length > 0) {
          try {
            const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(realBytes));
            // Filter out any remaining control chars
            const clean = decoded.replace(/[^\x20-\x7E\u0080-\uFFFF]/g, '');
            if (clean) result += clean;
            else result += segment;
          } catch {
            result += segment;
          }
        } else {
          // All replacement chars - can't recover, keep them
          result += segment;
        }
      }
    } else if (code >= 0x80 && code < 0x100) {
      // Mojibake char - collect the run
      const start = i;
      const bytes = [];
      
      while (i < line.length) {
        const c = line.charCodeAt(i);
        if (c >= 0x80 && c < 0x100) {
          bytes.push(c);
          i++;
        } else {
          break;
        }
      }
      
      // Try to decode as UTF-8
      try {
        const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
        // Check if decoded is valid (not more mojibake)
        const isValid = ![...decoded].some(ch => {
          const cp = ch.codePointAt(0);
          return cp >= 0x80 && cp < 0x100;
        });
        if (isValid && decoded.trim()) {
          result += decoded;
        } else {
          result += line.slice(start, i);
        }
      } catch {
        result += line.slice(start, i);
      }
    } else {
      // Normal char
      result += line[i];
      i++;
    }
  }
  
  return result;
}

const lines = content.split('\n');
let fixedCount = 0;

const fixedLines = lines.map(line => {
  if (/[\uFFFD]/.test(line) || /[^\x00-\x7F]/.test(line)) {
    const fixed = fixLine(line);
    if (fixed !== line) {
      fixedCount++;
    }
    return fixed;
  }
  return line;
});

const fixedContent = fixedLines.join('\n');

// Count remaining issues
const remainingReplacement = (fixedContent.match(/�/g) || []).length;
let remainingMojibake = 0;
for (const ch of fixedContent) {
  const code = ch.charCodeAt(0);
  if (code >= 0x80 && code < 0x100) {
    remainingMojibake++;
  }
}

console.log(`Fixed ${fixedCount} lines`);
console.log(`Remaining replacement chars: ${remainingReplacement} (was ${replacementCharCount})`);
console.log(`Remaining mojibake chars: ${remainingMojibake} (was ${mojibakeCount})`);

fs.writeFileSync(file, fixedContent, 'utf8');
console.log('Done');
