// Fix remaining mojibake in CompassView.tsx
// Read as UTF-8, find corrupted sequences, transcode CP1252 -> UTF-8

import fs from 'fs';

const file = 'src/components/CompassView.tsx';
let content = fs.readFileSync(file, 'utf8');

// The corrupted chars are UTF-8 code points that represent CP1252 bytes
// which are actually the original UTF-8 bytes of Hindi/emoji text
// Strategy: for each line, if it contains chars in the Latin-1 supplement range,
// try to transcode the whole line from CP1252 to UTF-8

function fixMojibake(str) {
  // Check if this string contains mojibake indicators
  // Common mojibake chars from double-encoded UTF-8:
  // à¤ (U+00E4) = 0xE4 in CP1252 = first byte of Devanagari in UTF-8
  // â (U+00E2) = 0xE2 in CP1252 = first byte of emoji in UTF-8
  // ð (U+00F0) = 0xF0 in CP1252 = first byte of 4-byte emoji
  
  const hasMojibake = /[\u0080-\u00FF]/.test(str);
  if (!hasMojibake) return str;
  
  try {
    // Encode as CP1252 (single byte per char in this range)
    const cp1252Bytes = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        cp1252Bytes.push(code);
      } else if (code < 0x100) {
        cp1252Bytes.push(code);
      } else {
        // Multi-byte UTF-8 char that's not mojibake - keep as UTF-8
        // We need a different approach for mixed content
        throw new Error('Mixed content');
      }
    }
    
    // Decode CP1252 bytes as UTF-8
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const fixed = decoder.decode(new Uint8Array(cp1252Bytes));
    return fixed;
  } catch {
    // Mixed content: only fix the mojibake portions
    // Replace known mojibake patterns
    let result = str;
    
    // Common patterns:
    // â€" = em dash — (U+2014) encoded as UTF-8 E2 80 9C, read as CP1252
    result = result.replace(/â€"/g, '—');
    // Â° = degree sign ° (U+00B0) encoded as UTF-8 C2 B0, read as CP1252  
    result = result.replace(/Â°/g, '°');
    // ðŸ§­ = 🧭 emoji (U+1F9ED) encoded as UTF-8 F0 9F A7 AD, read as CP1252
    result = result.replace(/ðŸ§­/g, '🧭');
    // ðŸ" = 📍 emoji (U+1F4CD)
    result = result.replace(/ðŸ"/g, '📍');
    // ðŸ›ï¸ = 🏻 emoji with modifier
    result = result.replace(/ðŸ›ï¸/g, '🏻');
    // ðŸŒŠ = 🌊
    result = result.replace(/ðŸŒŠ/g, '🌊');
    // ðŸ"œ = 📜
    result = result.replace(/ðŸ"œ/g, '📜');
    // ðŸ = 🏁 (partial emoji)
    result = result.replace(/ðŸ/g, '🏁');
    // ðŸŒ = 🌐 (partial)
    result = result.replace(/ðŸŒ/g, '🌐');
    // â"" = box drawing box
    result = result.replace(/â""/g, '─');
    // â" = box drawing
    result = result.replace(/â"/g, '─');
    
    return result;
  }
}

// Process line by line
const lines = content.split('\n');
let fixedCount = 0;

const fixedLines = lines.map(line => {
  if (/[\u0080-\u00FF]/.test(line)) {
    const fixed = fixMojibake(line);
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
