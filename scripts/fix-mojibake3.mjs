// Fix remaining mojibake: transcode CP1252 byte sequences back to UTF-8
// This handles mixed lines (English + corrupted emojis/symbols)

import fs from 'fs';

const file = 'src/components/CompassView.tsx';
const rawBytes = fs.readFileSync(file);
let content = new TextDecoder('utf-8').decode(rawBytes);

function fixLine(line) {
  // Find all mojibake sequences (runs of bytes 0x80-0xFF interpreted as single chars)
  // and transcode them back to UTF-8. Multi-byte UTF-8 chars (Devanagari, valid emojis)
  // are preserved as-is.
  
  let result = '';
  let i = 0;
  
  while (i < line.length) {
    const code = line.charCodeAt(i);
    
    if (code < 0x80) {
      // ASCII - keep as is
      result += line[i];
      i++;
    } else if (code < 0x100) {
      // This is a mojibake char (single code point in 0x80-0xFF range)
      // Collect the run of such chars
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
      
      // Try to decode these bytes as UTF-8
      try {
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
        // Verify: decoded should NOT contain chars in 0x80-0xFF range (that would mean it's still mojibake)
        const stillMojibake = /[^\x00-\x7F]/.test(decoded) && decoded.split('').every(ch => ch.charCodeAt(0) < 0x100);
        if (!stillMojibake) {
          result += decoded;
        } else {
          // Keep original
          result += line.slice(start, i);
        }
      } catch {
        // Invalid UTF-8 sequence - keep original
        result += line.slice(start, i);
      }
    } else {
      // Multi-byte UTF-8 char (Devanagari, valid emojis, etc.) - keep as is
      // Handle surrogate pairs for emojis
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < line.length && line.charCodeAt(i + 1) >= 0xDC00 && line.charCodeAt(i + 1) <= 0xDFFF) {
        result += line[i] + line[i + 1];
        i += 2;
      } else {
        result += line[i];
        i++;
      }
    }
  }
  
  return result;
}

const lines = content.split('\n');
let fixedCount = 0;

const fixedLines = lines.map(line => {
  // Fix any line that has single-byte chars in 0x80-0xFF range (mojibake indicators)
  if (/[^\x00-\x7F]/.test(line)) {
    const fixed = fixLine(line);
    if (fixed !== line) {
      fixedCount++;
    }
    return fixed;
  }
  return line;
});

const fixedContent = fixedLines.join('\n');
fs.writeFileSync(file, fixedContent, 'utf8');
console.log(`Fixed ${fixedCount} lines with mojibake in ${file}`);
