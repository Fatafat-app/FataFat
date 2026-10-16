Add-Type -AssemblyName System.Drawing

$inputPath = "d:\Work\ftafat\frontend\assets\logo\full Name Ftafat.jpeg"
$outputPath = "d:\Work\ftafat\frontend\assets\logo\ftafat_full_name_transparent.png"

$bmp = [System.Drawing.Bitmap]::FromFile($inputPath)
$width = $bmp.Width
$height = $bmp.Height

Write-Host "Image dimensions: $width x $height"

# Create a 32-bit ARGB bitmap
$newBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($newBmp)
$graphics.DrawImage($bmp, 0, 0, $width, $height)
$graphics.Dispose()
$bmp.Dispose()

# Lock bits for fast pixel processing
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$bmpData = $newBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ptr = $bmpData.Scan0
$bytes = [Math]::Abs($bmpData.Stride) * $height
$rgbValues = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($ptr, $rgbValues, 0, $bytes)

# Each pixel is 4 bytes: [B, G, R, A]
for ($i = 0; $i -lt $bytes; $i += 4) {
    $b = [int]$rgbValues[$i]
    $g = [int]$rgbValues[$i + 1]
    $r = [int]$rgbValues[$i + 2]

    # Check for outer white background (corners)
    # The outer background is white: r > 240, g > 240, b > 240
    # But wait, the text inside is also white!
    # So we only want to remove pixels that are either:
    # 1. The red/orange background: high R, low G, low B
    # 2. Outer corner white (we can detect by checking if pixel is red background OR outer corners)
}

$newBmp.UnlockBits($bmpData)
