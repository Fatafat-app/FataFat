import cv2
import numpy as np
from PIL import Image
import os

pub_dir = 'landing_page/public'
os.makedirs(pub_dir, exist_ok=True)

# 1. Load app_icon.jpeg
app_icon_path = 'frontend/assets/images/app_icon.jpeg'
img = Image.open(app_icon_path).convert('RGBA')

# Create rounded corner mask
w, h = img.size
mask = Image.new('L', (w, h), 0)
radius = int(w * 0.22)
from PIL import ImageDraw
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([(0, 0), (w, h)], radius=radius, fill=255)
img.putalpha(mask)

# Save icons in multiple sizes
img.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(pub_dir, 'favicon-16x16.png'))
img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(pub_dir, 'favicon-32x32.png'))
img.resize((48, 48), Image.Resampling.LANCZOS).save(os.path.join(pub_dir, 'favicon.png'))
img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(pub_dir, 'apple-touch-icon.png'))
img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(pub_dir, 'android-chrome-192x192.png'))
img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(pub_dir, 'android-chrome-512x512.png'))

# Save standard .ico file with multi-resolution support
img.save(os.path.join(pub_dir, 'favicon.ico'), format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64)])
print("Favicons generated successfully!")

# 2. Copy reference banner as OpenGraph share image
ref_img = Image.open('original-05afa8150649329ff8c4a942b3fe0b6b.webp').convert('RGB')
ref_img.resize((1200, 630), Image.Resampling.LANCZOS).save(os.path.join(pub_dir, 'og-image.jpg'), quality=92)
print("OG social image generated!")
