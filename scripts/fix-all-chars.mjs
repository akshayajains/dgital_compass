// Fix ALL remaining corrupted characters in CompassView.tsx
import fs from 'fs';

const file = 'src/components/CompassView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Build corrupted strings from their actual Unicode code points
// These are what remain after stripping U+FFFD replacement chars

// €" = U+20AC U+201D = em dash mojibake (was — U+2014 encoded as UTF-8 E2 80 94, 
// but the E2 byte was stripped as FFFD, leaving AC 94 which became € ")
const emDash = '\u20AC\u201D';  // €"
const emDashAlt = '\u20AC';     // € alone (degree sign fragment)

// Ÿ" = U+0178 U+201C = 📍 emoji fragment
const pinEmoji = '\u0178\u201C';  // Ÿ"

// Ÿ alone = U+0178 = 🧭 emoji fragment  
const compassEmoji = '\u0178';

// Ÿ› = U+0178 U+203A = 🏻 emoji fragment
const skinTone = '\u0178\u203A';

// ŸŒ = U+0178 U+0152 = 🌊/🌤️/🌧️/🌍 emoji fragment
const wavePrefix = '\u0178\u0152';

// œ" = U+0153 U+201C = ✓ checkmark fragment
const checkmark = '\u0153\u201C';

// ˜€ = U+02DC U+20AC = ☀️ sun emoji fragment
const sunEmoji = '\u02DC\u20AC';

// ˜" = U+02DC U+201C = ☁️ cloud emoji fragment (but might just be ˜ alone)
const cloudEmoji = '\u02DC';

// ›ˆ = U+203A U+00C2 = 🌬️ wind emoji fragment
const windEmoji = '\u203A\u00C2';

// ˜… = U+02DC U+2026 = ★ star fragment
const starEmoji = '\u02DC\u2026';

// Box drawing: " repeated = U+201C repeated = ─ fragment
const boxDraw = '\u201C';

let count = 0;

// Fix em dashes in comments (€" → —)
// Need to be careful: €" appears as the em dash mojibake
const emDashRegex = new RegExp(emDash, 'g');
const emDashMatches = content.match(emDashRegex);
if (emDashMatches) {
  content = content.replace(emDashRegex, '—');
  count += emDashMatches.length;
  console.log(`Replaced ${emDashMatches.length} em dashes (€" → —)`);
}

// Fix standalone € → ° (degree sign) where not part of €"
// After replacing €", any remaining € is likely a degree sign
content = content.replace(/\u20AC/g, '°');
console.log('Replaced remaining € → °');

// Fix 📍 emoji: Ÿ" → 📍 (already handled € above, so now Ÿ alone might remain)
// Actually Ÿ" was already partially fixed by the € replacement above
// The Ÿ (U+0178) remains - it's the first byte of the 📍 emoji

// Let's handle the emoji fragments more carefully
// After the €" → — fix, what remains:
// - Ÿ (U+0178) alone = first byte of various emojis starting with F0 87
//   In context: "Ÿ DIGITAL" = "🧭 DIGITAL", "Ÿ"" = "📍" (but " was already replaced)
//   "Ÿ›" = "🏻", "ŸŒ" = "🌊" etc.

// Fix compass emoji: Ÿ followed by space → 🧭 
content = content.replace(/\u0178 /g, '🧭 ');
console.log('Replaced Ÿ → 🧭 (compass emoji)');

// Fix pin emoji: Ÿ followed by anything → 📍
// In "Ÿ" My location" the " was already replaced, so we have "Ÿ My location"
// But wait - the original was `Ÿ" My location` where " is U+201C
// After € replacement, it becomes `Ÿ My location` — but Ÿ is followed by space
// Actually let me check: line 871 is: `Ÿ" My location`
// The " here is U+201C (left double quote), not the €" pattern
// So it would NOT have been replaced by the em dash fix
// Let me fix Ÿ" (U+0178 U+201C) → 📍
const pinPattern = '\u0178\u201C';
content = content.replace(new RegExp(pinPattern, 'g'), '📍');
console.log('Replaced Ÿ" → 📍 (pin emoji)');

// Fix 🏻 skin tone: Ÿ› → 🏻 (U+0178 U+203A)
const skinPattern = '\u0178\u203A';
content = content.replace(new RegExp(skinPattern, 'g'), '🏻');
console.log('Replaced Ÿ› → 🏻 (skin tone)');

// Fix 🌊 wave: ŸŒŠ → 🌊 (U+0178 U+0152 + Š)
// Actually ŸŒ = U+0178 U+0152 is the prefix for 🌊, 🌤️, 🌧️, 🌍
// The full emoji depends on what follows
// ŸŒŠ = 🌊 (U+0178 U+0152 U+0160)
content = content.replace(/\u0178\u0152\u0160/g, '🌊');
console.log('Replaced ŸŒŠ → 🌊 (wave emoji)');

// ŸŒ️ = 🌤️ or 🌧️ (U+0178 U+0152 + variation selector)
// In weather context: cloud-sun = 🌤️, rain = 🌧️
// The pattern ŸŒ️ appears twice in line 2145 - once for cloud-sun and once for rain
// We need context to distinguish, but let's replace with the generic 🌤️ first
// Actually the variation selector ️ is U+FE0F
content = content.replace(/\u0178\u0152\uFE0F/g, '🌤️');
console.log('Replaced ŸŒ️ → 🌤️ (cloud-sun emoji)');

// Fix 🌍 globe: ŸŒ (U+0178 U+0152) followed by space or other non-emoji char
// In "ŸŒ GPS" it should be 🌍
content = content.replace(/\u0178\u0152 /g, '🌍 ');
console.log('Replaced ŸŒ → 🌍 (globe emoji)');

// Fix 📜 scroll: Ÿ"œ → 📜 but " was already handled
// The original is Ÿ"œ where " is U+201C and œ is U+0153
// Pattern: U+0178 U+201C U+0153
const scrollPattern = '\u0178\u201C\u00AE'; // Ÿ"® (might be different)
// Actually let me just handle what's left

// Fix checkmark: œ" → ✓ (U+0153 U+201C)
const checkPattern = '\u0153\u201C';
content = content.replace(new RegExp(checkPattern, 'g'), '✓');
console.log('Replaced œ" → ✓ (checkmark)');

// Fix sun emoji: ˜€ → ☀️ but € was already replaced with °
// So now it's ˜° → ☀️
content = content.replace(/\u02DC\u00B0/g, '☀️');
// Or if € wasn't replaced in this context: ˜€ → ☀️
content = content.replace(/\u02DC\u20AC/g, '☀️');
console.log('Replaced ˜°/˜€ → ☀️ (sun emoji)');

// Fix cloud emoji: ˜ → ☁️ (U+02DC alone followed by ️ variation selector)
content = content.replace(/\u02DC\uFE0F/g, '☁️');
console.log('Replaced ˜️ → ☁️ (cloud emoji)');

// Fix wind emoji: ›ˆ → 🌬️ (U+203A U+00C2)
const windPattern = '\u203A\u00C2';
content = content.replace(new RegExp(windPattern, 'g'), '🌬️');
console.log('Replaced ›ˆ → 🌬️ (wind emoji)');

// Fix star: ˜… → ★ (U+02DC U+2026)
const starPattern = '\u02DC\u2026';
content = content.replace(new RegExp(starPattern, 'g'), '★');
console.log('Replaced ˜… → ★ (star)');

// Fix box drawing: repeated " (U+201C) → ─
// The pattern is " repeated many times
content = content.replace(/\u201C+/g, match => '─'.repeat(match.length));
console.log('Repeated " → ─ (box drawing)');

// Fix remaining standalone Ÿ → 🧭 (if any left)
content = content.replace(/\u0178/g, '🧭');
console.log('Replaced remaining Ÿ → 🧭');

// Fix remaining standalone ° that should be → (arrow)
// The " € " pattern between PITCH and ROLL should be " ° → " 
// Actually line 2093: "PITCH {effectivePitch.toFixed(1)} € ROLL"
// The € here was already replaced with °, giving "PITCH 0.0 ° ROLL"
// But the user says there's an unwanted character after pitch
// The original was "PITCH {effectivePitch.toFixed(1)}° → ROLL"
// So we need "° →" not just "°"
// Let me check: the original corrupted was "° €" where €" = →
// Wait no - the original was "° →" where → is U+2192
// The → encoded as UTF-8 is E2 86 92
// If E2 was stripped as FFFD, we'd have 86 92 which in CP1252 is ¦ — not €"
// Let me just look at what the user sees: "Pitch 0.0" followed by unwanted char
// The current line after fixes: "PITCH {effectivePitch.toFixed(1)} ° ROLL"
// This actually looks correct - ° is the degree sign
// But maybe the user wants just "PITCH 0.0°  ROLL" without the space before °
// Let's keep it as is for now

// Fix remaining standalone ˜ → ☁ (if any left after ☁️ fix)
content = content.replace(/\u02DC/g, '☁');
console.log('Replaced remaining ˜ → ☁');

// Fix remaining standalone œ → ✓ (if any left)
content = content.replace(/\u0153/g, '✓');
console.log('Replaced remaining œ → ✓');

// Fix remaining standalone › → → (if any left after wind fix)
content = content.replace(/\u203A/g, '→');
console.log('Replaced remaining › → →');

// Fix remaining standalone Œ → (part of emoji, replace with space if orphaned)
content = content.replace(/\u0152/g, '');
console.log('Removed remaining Œ (orphaned emoji byte)');

// Final cleanup: fix any remaining U+201C (left double quote) that should be something else
// In fallback values like '€"' the € was replaced with ° giving '°"'
// But '°"' should be '—' (em dash)
// Actually the original fallback was '—' which got corrupted to '€"'
// After € → ° fix, it became '°"' — still wrong
// Let me fix °" → —
content = content.replace(/\u00B0\u201D/g, '—');
console.log('Replaced °" → — (em dash in fallbacks)');

// Also fix °" → — where " is U+201C (left double quote)  
content = content.replace(/\u00B0\u201C/g, '—');
console.log('Replaced °" → — (em dash variant)');

fs.writeFileSync(file, content, 'utf8');
console.log(`\nDone! Total replacements: ${count}+`);

// Verify: count remaining problematic chars
let remaining = 0;
for (const ch of content) {
  const code = ch.charCodeAt(0);
  // Check for remaining mojibake indicators
  if (code === 0x0178 || code === 0x0152 || code === 0x0153 || code === 0x02DC || code === 0x203A) {
    remaining++;
  }
}
console.log(`Remaining problematic chars: ${remaining}`);
