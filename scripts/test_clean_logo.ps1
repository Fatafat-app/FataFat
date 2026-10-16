$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class CleanLogo
{
    public static void Generate(string inputPath, string outputPath)
    {
        using (var src = new Bitmap(inputPath))
        {
            int w = src.Width;
            int h = src.Height;

            var rect = new Rectangle(0, 0, w, h);
            var srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppRgb);
            int stride = srcData.Stride;
            byte[] srcBytes = new byte[stride * h];
            Marshal.Copy(srcData.Scan0, srcBytes, 0, srcBytes.Length);
            src.UnlockBits(srcData);

            byte[] outBytes = new byte[stride * h];

            // Strict logo bounding zone in 1254x1254 canvas
            int zoneMinX = 40;
            int zoneMaxX = 1205;
            int zoneMinY = 145;
            int zoneMaxY = 1055;

            int minX = w, maxX = 0, minY = h, maxY = 0;

            for (int y = 0; y < h; y++)
            {
                int row = y * stride;
                for (int x = 0; x < w; x++)
                {
                    int i = row + (x * 4);

                    // Outside logo zone: 100% transparent
                    if (x < zoneMinX || x > zoneMaxX || y < zoneMinY || y > zoneMaxY)
                    {
                        continue;
                    }

                    byte b = srcBytes[i];
                    byte g = srcBytes[i + 1];
                    byte r = srcBytes[i + 2];

                    // 1. White / Cream elements (Cloche dome, Letters body):
                    // In white/cream, Blue is high (b >= 70) and Green is high (g >= 100) and Red is high (r >= 140)
                    bool isWhiteCore = (b >= 90 && g >= 115 && r >= 140);
                    bool isWhiteSoft = (b >= 70 && g >= 95 && r >= 135);

                    // 2. Yellow elements (Steam, Speed lines, Rim, Swoosh):
                    // Yellow is Red + Green (r >= 180, g >= 135, b <= 95)
                    bool isYellowCore = (r >= 180 && g >= 135 && b <= 90);
                    bool isYellowSoft = (r >= 170 && g >= 115 && (g - b >= 45));

                    // 3. Warm orange-yellow bevel highlights on letters/cloche:
                    // Only within inner logo area, where g is significant and b is moderate
                    bool isBevel = (r >= 190 && g >= 95 && b >= 35 && b <= 80 && (g - b >= 40));

                    if (isWhiteCore || isYellowCore)
                    {
                        outBytes[i] = b;
                        outBytes[i + 1] = g;
                        outBytes[i + 2] = r;
                        outBytes[i + 3] = 255;

                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                    else if (isWhiteSoft || isYellowSoft || isBevel)
                    {
                        // Anti-aliased transition edge
                        byte alpha = 210;
                        if (isWhiteSoft && !isWhiteCore)
                        {
                            int val = (b - 65) * 8;
                            if (val < 80) val = 80;
                            if (val > 240) val = 240;
                            alpha = (byte)val;
                        }
                        else if (isYellowSoft && !isYellowCore)
                        {
                            int val = (g - 110) * 8;
                            if (val < 80) val = 80;
                            if (val > 240) val = 240;
                            alpha = (byte)val;
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
                }
            }

            Console.WriteLine(string.Format("Filtered logo bounds: X=[{0}, {1}], Y=[{2}, {3}]", minX, maxX, minY, maxY));

            // Crop tightly to logo content with 20px breathing room
            int pad = 20;
            int cropX = Math.Max(0, minX - pad);
            int cropY = Math.Max(0, minY - pad);
            int cropW = Math.Min(w - cropX, (maxX - minX) + (pad * 2));
            int cropH = Math.Min(h - cropY, (maxY - minY) + (pad * 2));

            Console.WriteLine(string.Format("Crop: {0}x{1} at ({2},{3})", cropW, cropH, cropX, cropY));

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
                Console.WriteLine("Successfully created: " + outputPath);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[CleanLogo]::Generate("d:\Work\ftafat\frontend\assets\logo\full Name Ftafat.jpeg", "d:\Work\ftafat\frontend\assets\logo\ftafat_full_name_transparent.png")
