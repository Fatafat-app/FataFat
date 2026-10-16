$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public class BgMapper
{
    public static void Run(string path)
    {
        using (var bmp = new Bitmap(path))
        {
            // Sample corners and borders
            Console.WriteLine("--- Edge Samples ---");
            Console.WriteLine("Top Left (50,50): " + bmp.GetPixel(50,50));
            Console.WriteLine("Top Center (512,30): " + bmp.GetPixel(512,30));
            Console.WriteLine("Top Right (950,50): " + bmp.GetPixel(950,50));
            Console.WriteLine("Bottom Left (50,950): " + bmp.GetPixel(50,950));
            Console.WriteLine("Bottom Center (512,980): " + bmp.GetPixel(512,980));
            Console.WriteLine("Bottom Right (950,950): " + bmp.GetPixel(950,950));
            Console.WriteLine("Mid Left (30,500): " + bmp.GetPixel(30,500));
            Console.WriteLine("Mid Right (980,500): " + bmp.GetPixel(980,500));

            Console.WriteLine("--- Logo Region Samples ---");
            Console.WriteLine("Cloche Center (550, 300): " + bmp.GetPixel(550, 300));
            Console.WriteLine("Steam (800, 220): " + bmp.GetPixel(800, 220));
            Console.WriteLine("Speed bar 1 (140, 560): " + bmp.GetPixel(140, 560));
            Console.WriteLine("Speed bar 2 (110, 615): " + bmp.GetPixel(110, 615));
            Console.WriteLine("Speed bar 3 (120, 665): " + bmp.GetPixel(120, 665));
            Console.WriteLine("F top (350, 490): " + bmp.GetPixel(350, 490));
            Console.WriteLine("F stem (240, 630): " + bmp.GetPixel(240, 630));
            Console.WriteLine("t1 (420, 590): " + bmp.GetPixel(420, 590));
            Console.WriteLine("a1 (540, 610): " + bmp.GetPixel(540, 610));
            Console.WriteLine("f (660, 590): " + bmp.GetPixel(660, 590));
            Console.WriteLine("a2 (760, 600): " + bmp.GetPixel(760, 600));
            Console.WriteLine("t2 (880, 560): " + bmp.GetPixel(880, 560));
            Console.WriteLine("Swoosh (500, 725): " + bmp.GetPixel(500, 725));
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[BgMapper]::Run("d:\Work\ftafat\frontend\assets\logo\full Name Ftafat.jpeg")
