// Fix remaining mojibake by reading raw bytes and doing targeted replacements
import fs from 'fs';

const file = 'src/components/CompassView.tsx';
const rawBytes = fs.readFileSync(file);
let content = new TextDecoder('utf-8').decode(rawBytes);

// These are the mojibake sequences found in the file (as UTF-8 code points)
// and their correct replacements
const replacements = [
  // Em dash: UTF-8 E2 80 9C read as CP1252 â€"
  ['â€"', '—'],
  // Degree sign: UTF-8 C2 B0 read as CP1252 Â°
  ['Â°', '°'],
  // 🧭 compass: UTF-8 F0 9F A7 AD read as CP1252 ðŸ§­
  ['ðŸ§­', '🧭'],
  // 📍 pin: UTF-8 F0 9F 93 8D read as CP1252 ðŸ"
  ['ðŸ"', '📍'],
  // 🏻 skin tone: UTF-8 F0 9F 8F BB read as CP1252 ðŸ›
  ['ðŸ›', '🏻'],
  // 🌊 wave: UTF-8 F0 9F 8C A9 read as CP1252 ðŸŒŠ
  ['ðŸŒŠ', '🌊'],
  // 📜 scroll: UTF-8 F0 9F 93 9C read as CP1252 ðŸ"œ
  ['ðŸ"œ', '📜'],
  // 🏁 checkered flag (partial): ðŸ
  ['ðŸ ', '🏁'],
  // 🌍 globe: UTF-8 F0 9F 8C 8D read as CP1252 ðŸŒ
  ['ðŸŒ', '🌍'],
  // 🌐 globe with meridians: ðŸŒ
  ['ðŸŒ', '🌐'],
  // Box drawing horizontal: UTF-8 E2 94 81 read as CP1252 â"
  ['â"', '─'],
  // 🔥 fire: ðŸ"¥
  ['ðŸ"¥', '🔥'],
  // 💧 droplet: ðŸ'§
  ['ðŸ'§', '💧'],
  // 💨 dashing: ðŸ'¨
  ['ðŸ'¨', '💨'],
  // ✨ sparkles (already valid, skip)
];

// Also fix the variant with variation selector
content = content.replace(/ðŸ›\uFE0F/g, '🏻');

for (const [from, to] of replacements) {
  const count = (content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (count > 0) {
    content = content.split(from).join(to);
    console.log(`Replaced ${count} occurrences of mojibake -> ${to}`);
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done fixing remaining mojibake');
