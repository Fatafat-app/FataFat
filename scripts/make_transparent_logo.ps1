Add-Type -AssemblyName System.Drawing

$inputPath = "d:\Work\ftafat\frontend\assets\logo\full Name Ftafat.jpeg"
$outputPath = "d:\Work\ftafat\frontend\assets\logo\ftafat_name_transparent.png"

$src = [System.Drawing.Bitmap]::FromFile($inputPath)
$width = $src.Width
$height = $src.Height

# Create 32-bit ARGB bitmap for transparency
$dest = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Lock bits for high-speed processing
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$srcData = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppRgb)
$destData = $dest.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$bytesPerPixel = 4
$totalBytes = $srcData.Stride * $height
$srcBuffer = New-Object byte[] $totalBytes
$destBuffer = New-Object byte[] $totalBytes

[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBuffer, 0, $totalBytes)

# Process pixels: Format32bppArgb is stored in BGRA order (byte 0 = Blue, 1 = Green, 2 = Red, 3 = Alpha)
for ($y = 0; $y -lt $height; $y++) {
    $rowOffset = $y * $srcData.Stride
    for ($x = 0; $x -lt $width; $x++) {
        $idx = $rowOffset + ($x * $bytesPerPixel)
        $b = $srcBuffer[$idx]
        $g = $srcBuffer[$idx + 1]
        $r = $srcBuffer[$idx + 2]

        # 1. Outer white corners outside squircle:
        # If near the 4 corners and R,G,B are high white
        $isCorner = ($x -lt 180 -or $x -gt ($width - 180)) -and ($y -lt 180 -or $y -gt ($height - 180))
        if ($isCorner -and $r -gt 230 -and $g -gt 230 -and $b -gt 230) {
            # Outer white corner -> Transparent
            $destBuffer[$idx] = 0
            $destBuffer[$idx + 1] = 0
            $destBuffer[$idx + 2] = 0
            $destBuffer[$idx + 3] = 0
            continue
        }

        # 2. Check if pixel belongs to logo:
        # A) White/cream logo text & cloche dome:
        # White has high B component (e.g. b > 90) and high G, R
        $isWhiteLogo = ($b -ge 95 -and $g -ge 120 -and $r -ge 140)

        # B) Yellow steam, yellow speed lines, yellow swoosh:
        # Yellow has high R and high G, but low B
        $isYellowLogo = ($r -ge 180 -and $g -ge 120 -and $b -le 90 -and ($g -gt ($b + 40)))

        # C) Subtle warm edge transitions:
        # Where r is high, g is moderate (80-130), b is low (30-80), but it's part of the yellow/orange rim or 3D letter shading
        $isLogoShading = ($r -ge 180 -and $g -ge 120 -and $b -gt 70 -and $b -lt 120)

        if ($isWhiteLogo -or $isYellowLogo -or $isLogoShading) {
            # Keep original pixel, fully opaque
            $destBuffer[$idx] = $b
            $destBuffer[$idx + 1] = $g
            $destBuffer[$idx + 2] = $r
            $destBuffer[$idx + 3] = 255
        } else {
            # Red/orange background or dark shadow -> Transparent
            $destBuffer[$idx] = 0
            $destBuffer[$idx + 1] = 0
            $destBuffer[$idx + 2] = 0
            $destBuffer[$idx + 3] = 0
        }
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($destBuffer, 0, $destData.Scan0, $totalBytes)
$src.UnlockBits($srcData)
$dest.UnlockBits($destData)

$src.Dispose()
$dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Dispose()

Write-Host "SUCCESS: Saved to $outputPath"
