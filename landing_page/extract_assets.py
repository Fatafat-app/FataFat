import os
import numpy as np
from PIL import Image, ImageFilter

os.makedirs('landing_page/public/assets', exist_ok=True)
img = Image.open('original-05afa8150649329ff8c4a942b3fe0b6b.webp').convert('RGBA')
arr = np.array(img)

# 1. Burger: x [0:460], y [480:900]
# 2. Pizza: x [1050:1504], y [660:1128]
# 3. Basil: x [280:460], y [210:340]
# 4. Chili peppers: x [1160:1504], y [0:290]
# 5. Flying tomato: x [440:700], y [870:1128]

def extract_element(crop_box, out_name, bg_type='white'):
    cropped = img.crop(crop_box)
    cropped.save(f'landing_page/public/assets/{out_name}')
    print(f'Saved {out_name}')

extract_element((0, 480, 460, 900), 'burger_raw.png')
extract_element((1080, 670, 1504, 1128), 'pizza_raw.png')
extract_element((290, 215, 450, 335), 'basil_raw.png')
extract_element((1180, 0, 1504, 280), 'chili_raw.png')
extract_element((450, 870, 690, 1128), 'tomato_raw.png')
