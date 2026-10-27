# Fix mojibake in CompassView.tsx
# The file has UTF-8 Hindi text that was double-encoded (UTF-8 -> Latin-1 -> UTF-8)
# This script decodes it back to proper UTF-8

$file = "src\components\CompassView.tsx"
$content = Get-Content $file -Raw -Encoding UTF8

# The mojibake pattern: UTF-8 bytes interpreted as Windows-1252, then re-encoded as UTF-8
# To fix: encode the string as UTF-8, then decode those bytes as Windows-1252 to get the original bytes, then decode as UTF-8

# However, PowerShell doesn't handle this well directly.
# Instead, we use a different approach: read the file as raw bytes, and fix the double-encoded sequences.

$bytes = [System.IO.File]::ReadAllBytes($file)
$utf8Content = [System.Text.Encoding]::UTF8.GetString($bytes)

# The mojibake is: original UTF-8 bytes -> interpreted as Windows-1252 chars -> stored as UTF-8
# To reverse: take the UTF-8 string, encode as Windows-1252, then decode those bytes as UTF-8
# But we can't do this on the whole file because it has valid UTF-8 English text too.

# Strategy: only fix the Hindi portions inside language === 'hi' ? '...' strings
# The corrupted chars are in the range à, â, ã, ä, å, æ, ç, è, é, ê, ë, ì, í, î, ï, ð, ñ, ò, ó, ô, õ, ö, ÷, ø, ù, ú, û, ü, ù, ú, û, ü, ý, þ, ÿ
# These are Windows-1252 chars 0x80-0xFF that represent the original UTF-8 bytes

# Actually, the simplest approach: the entire file was saved with wrong encoding.
# Let's try: read as UTF-8, encode as Windows-1252 (lossy), decode those bytes as UTF-8
# This will corrupt English text too, so we need a targeted approach.

# Best approach: use regex to find the corrupted Hindi strings and fix them
# The pattern is: sequences of chars in the range \x80-\xFF (when viewed as UTF-8 code points U+0080-U+00FF, U+00C0-U+00FF, U+0100-U+017F)

# Let's use a simpler approach: detect mojibake sequences and transcode them
function Fix-MojibakeString {
    param([string]$text)
    
    # Check if this looks like mojibake (contains chars in the Latin-1 supplement range that are typical of double-encoded UTF-8)
    $hasMojibake = $text -match '[àâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]'
    
    if (-not $hasMojibake) {
        return $text
    }
    
    try {
        # Encode the string as Windows-1252 to get the original bytes
        $ansiEncoding = [System.Text.Encoding]::GetEncoding(1252)
        $bytes = $ansiEncoding.GetBytes($text)
        
        # Decode those bytes as UTF-8 to get the original text
        $fixed = [System.Text.Encoding]::UTF8.GetString($bytes)
        
        # Verify the fix worked (should contain Devanagari characters)
        if ($fixed -match '[\u0900-\u097F]') {
            return $fixed
        }
    }
    catch {
        # If transcoding fails, return original
    }
    
    return $text
}

# Process the file line by line, fixing only lines that contain mojibake
$lines = $content -split "`n"
$fixedLines = @()

foreach ($line in $lines) {
    # Check if line contains potential mojibake
    if ($line -match '[àâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]') {
        # Try to fix the entire line
        $fixedLine = Fix-MojibakeString $line
        $fixedLines += $fixedLine
    }
    else {
        $fixedLines += $line
    }
}

# Write the fixed content back
$fixedContent = $fixedLines -join "`n"
[System.IO.File]::WriteAllText($file, $fixedContent, [System.Text.Encoding]::UTF8)

Write-Host "Fixed mojibake in $file"
