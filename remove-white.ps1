Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile('D:\ftafat\FataFat\frontend\assets\images\logo.jpg')
$img.MakeTransparent([System.Drawing.Color]::White)
$img.Save('D:\ftafat\FataFat\frontend\assets\images\logo_transparent.png', [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
