// Final fix: replace remaining mojibake emoji fragments
import fs from 'fs';

const file = 'src/components/CompassView.tsx';
let content = fs.readFileSync(file, 'utf8');

// The remaining mojibake are partial emoji sequences from the PowerShell fix
// which only fixed Devanagari but left emoji fragments

// Build the corrupted strings from their actual UTF-8 code points in the file
// §­ = U+00A7 U+00AD (from 🧭 emoji fragment)
// â = U+0081 U+00E2 (from box drawing fragment)
//  = U+008F U+00A0 (from 🏁 fragment)
// etc.

// Strategy: find all remaining chars in 0x80-0xFF range and replace them
// by transcoding the byte sequences back to UTF-8

function fixMojibakeInString(str) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  
  let result = '';
  let i = 0;
  
  while (i < str.length) {
    const code = str.charCodeAt(i);
    
    if (code < 0x80) {
      result += str[i];
      i++;
    } else if (code < 0x100) {
      // Collect consecutive mojibake chars
      const start = i;
      const singleBytes = [];
      
      while (i < str.length) {
        const c = str.charCodeAt(i);
        if (c >= 0x80 && c < 0x100) {
          singleBytes.push(c);
          i++;
        } else {
          break;
        }
      }
      
      // These single bytes are the original UTF-8 bytes
      // Try to decode them as UTF-8
      try {
        const decoded = decoder.decode(new Uint8Array(singleBytes));
        // Check if decoded contains any chars still in 0x80-0xFF (would mean incomplete fix)
        const hasRemainingMojibake = [...decoded].some(ch => {
          const cp = ch.codePointAt(0);
          return cp >= 0x80 && cp < 0x100;
        });
        
        if (!hasRemainingMojibake && decoded.length > 0) {
          result += decoded;
        } else {
          // Can't decode cleanly, replace with placeholder
          result += str.slice(start, i);
        }
      } catch {
        result += str.slice(start, i);
      }
    } else {
      // Multi-byte UTF-8 (Devanagari, valid emojis) - preserve
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < str.length) {
        const next = str.charCodeAt(i + 1);
        if (next >= 0xDC00 && next <= 0xDFFF) {
          result += str[i] + str[i + 1];
          i += 2;
          continue;
        }
      }
      result += str[i];
      i++;
    }
  }
  
  return result;
}

const lines = content.split('\n');
let fixed = 0;

const fixedLines = lines.map(line => {
  if (/[^\x00-\x7F]/.test(line)) {
    const f = fixMojibakeInString(line);
    if (f !== line) {
      fixed++;
    }
    return f;
  }
  return line;
});

fs.writeFileSync(file, fixedLines.join('\n'), 'utf8');
console.log(`Fixed ${fixed} lines`);
