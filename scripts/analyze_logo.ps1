$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class LogoAnalyzer
{
    public static void Sample(string path)
    {
        using (var bmp = new Bitmap(path))
        {
            Point[] pts = new Point[] {
                new Point(100, 100), // top-left corner
                new Point(200, 200), // red bg above letters
                new Point(500, 950), // bottom red bg
                new Point(250, 600), // F white body
                new Point(420, 600), // t white body
                new Point(100, 560), // yellow speed line
                new Point(550, 250), // cloche white dome
                new Point(780, 200), // yellow steam
                new Point(420, 650), // bottom edge/shadow of t
                new Point(280, 720)  // F lower stem shadow
            };

            foreach (var p in pts)
            {
                Color c = bmp.GetPixel(p.X, p.Y);
                Console.WriteLine(string.Format("({0,3},{1,3}): R={2,3} G={3,3} B={4,3}", p.X, p.Y, c.R, c.G, c.B));
            }
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[LogoAnalyzer]::Sample("d:\Work\ftafat\frontend\assets\logo\full Name Ftafat.jpeg")
