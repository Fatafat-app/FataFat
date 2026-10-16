$code = @"
using System;
using System.Drawing;

public class LogoFinder
{
    public static void Find(string path)
    {
        using (var bmp = new Bitmap(path))
        {
            int minX = bmp.Width, maxX = 0, minY = bmp.Height, maxY = 0;
            int count = 0;

            for (int y = 0; y < bmp.Height; y++)
            {
                for (int x = 0; x < bmp.Width; x++)
                {
                    Color c = bmp.GetPixel(x, y);
                    
                    // Exclude outer white corners:
                    bool isCorner = (x < 150 || x > bmp.Width - 150) && (y < 150 || y > bmp.Height - 150);
                    if (isCorner && c.R > 240 && c.G > 240 && c.B > 240) continue;

                    // A pixel is NOT the red/orange background if:
                    // 1. Blue is significant (white/cream elements): B > 40
                    // 2. Green is distinctly yellow/steam/speed lines: G > 110 and G > B + 30
                    bool isLogo = (c.B > 40) || (c.G > 110 && c.G > c.B + 30);

                    if (isLogo)
                    {
                        count++;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            Console.WriteLine(string.Format("Logo pixels found: {0}, Bounding Box: X=[{1}, {2}], Y=[{3}, {4}]", count, minX, maxX, minY, maxY));
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[LogoFinder]::Find("d:\Work\ftafat\frontend\assets\logo\full Name Ftafat.jpeg")
