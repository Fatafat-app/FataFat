$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class LogoProcessor
{
    public static void Process(string inputPath, string outputPath)
    {
        using (var src = new Bitmap(inputPath))
        {
            int w = src.Width;
            int h = src.Height;

            // Lock bits for fast read
            var rect = new Rectangle(0, 0, w, h);
            var srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppRgb);
            int stride = srcData.Stride;
            byte[] srcBytes = new byte[stride * h];
            Marshal.Copy(srcData.Scan0, srcBytes, 0, srcBytes.Length);
            src.UnlockBits(srcData);

            byte[] outBytes = new byte[stride * h];

            int minX = w, maxX = 0, minY = h, maxY = 0;

            for (int y = 0; y < h; y++)
            {
                int row = y * stride;
                for (int x = 0; x < w; x++)
                {
                    int i = row + (x * 4);
                    byte b = srcBytes[i];
                    byte g = srcBytes[i + 1];
                    byte r = srcBytes[i + 2];

                    // 1. Outside squircle check (the white corners)
                    // Squircle radius is roughly 250px from corners
                    bool isCorner = (x < 240 || x > w - 240) && (y < 240 || y > h - 240);
                    if (isCorner && r > 210 && g > 210 && b > 210)
                    {
                        // Pure transparent
                        continue;
                    }

                    // Also any border within 25px of the edge of the 1254x1254 canvas
                    if (x < 25 || x > w - 25 || y < 25 || y > h - 25)
                    {
                        continue;
                    }

                    // 2. Identify Logo Elements:
                    // A) White / Cream 3D Letters & Cloche Dome:
                    // Characterized by balanced high B, G, R (neutral/cream white)
                    // Blue is high: b >= 80, and g >= 100, and r >= 130
                    bool isWhiteBody = (b >= 90 && g >= 115 && r >= 135);
                    // Also soft white anti-aliased edge:
                    bool isWhiteEdge = (b >= 45 && g >= 60 && (b + g) > 130 && r > 150);

                    // B) Yellow Elements (Steam, Speed lines, Cloche rim, Swoosh underline):
                    // Yellow has high Red (>= 180), high Green (>= 120), and low-to-medium Blue (<= 90)
                    // Key discriminator: Green is significantly higher than Blue (g - b >= 45)
                    bool isYellowBody = (r >= 170 && g >= 115 && (g - b >= 40));

                    // C) 3D Bevel / Warm Shading on Logo:
                    // There are bevels on the letters where r is high, g is 85-120, b is 35-80
                    // But only in the logo area (y between 120 and 860, x between 50 and 1200)
                    bool inLogoZone = (x >= 40 && x <= 1210 && y >= 110 && y <= 860);
                    bool isBevel = inLogoZone && (r >= 180 && g >= 85 && g <= 140 && b >= 30 && b <= 85 && (g - b >= 30));

                    if (isWhiteBody || isWhiteEdge || isYellowBody || isBevel)
                    {
                        // Calculate smooth alpha for anti-aliasing:
                        byte alpha = 255;
                        if (isWhiteEdge && !isWhiteBody)
                        {
                            // Smooth fade for edge pixels
                            int edgeVal = (b * 2) + g; // 150 to 300+
                            int a = (edgeVal - 130) * 2;
                            if (a < 50) a = 50;
                            if (a > 255) a = 255;
                            alpha = (byte)a;
                        }

                        outBytes[i] = b;
                        outBytes[i + 1] = g;
                        outBytes[i + 2] = r;
                        outBytes[i + 3] = alpha;

                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                    else
                    {
                        // Transparent (red/orange background)
                        outBytes[i] = 0;
                        outBytes[i + 1] = 0;
                        outBytes[i + 2] = 0;
                        outBytes[i + 3] = 0;
                    }
                }
            }

            Console.WriteLine(string.Format("Logo bounds: X=[{0}, {1}], Y=[{2}, {3}]", minX, maxX, minY, maxY));

            // Create cropped image with nice 30px padding
            int pad = 30;
            int cropX = Math.Max(0, minX - pad);
            int cropY = Math.Max(0, minY - pad);
            int cropW = Math.Min(w - cropX, (maxX - minX) + (pad * 2));
            int cropH = Math.Min(h - cropY, (maxY - minY) + (pad * 2));

            using (var cropped = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb))
            {
                var cropRect = new Rectangle(0, 0, cropW, cropH);
                var cropData = cropped.LockBits(cropRect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                int cropStride = cropData.Stride;
                byte[] cropBytes = new byte[cropStride * cropH];

                for (int cy = 0; cy < cropH; cy++)
                {
                    int sy = cropY + cy;
                    if (sy >= h) break;
                    int srcRow = sy * stride;
                    int dstRow = cy * cropStride;

                    for (int cx = 0; cx < cropW; cx++)
                    {
                        int sx = cropX + cx;
                        if (sx >= w) break;

                        int si = srcRow + (sx * 4);
                        int di = dstRow + (cx * 4);

                        cropBytes[di] = outBytes[si];
                        cropBytes[di + 1] = outBytes[si + 1];
                        cropBytes[di + 2] = outBytes[si + 2];
                        cropBytes[di + 3] = outBytes[si + 3];
                    }
                }

                Marshal.Copy(cropBytes, 0, cropData.Scan0, cropBytes.Length);
                cropped.UnlockBits(cropData);

                cropped.Save(outputPath, ImageFormat.Png);
                Console.WriteLine("Saved cropped transparent logo to: " + outputPath);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[LogoProcessor]::Process("d:\Work\ftafat\frontend\assets\logo\full Name Ftafat.jpeg", "d:\Work\ftafat\frontend\assets\logo\ftafat_full_name_transparent.png")
