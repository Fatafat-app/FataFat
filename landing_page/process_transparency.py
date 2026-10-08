import os
import numpy as np
from PIL import Image, ImageFilter

def process_basil():
    img = Image.open('landing_page/public/assets/basil_raw.png').convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    # Basil is green (high G relative to R, or darker), background is light off-white (R>200, G>200, B>200)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    # distance from white (245, 245, 245)
    dist = np.sqrt((r-245)**2 + (g-245)**2 + (b-245)**2)
    # Green leaf has lower dist to green or low R
    alpha = np.clip((240 - r) * 3.5, 0, 255)
    # For shadow area, we want soft alpha
    alpha[dist < 20] = 0
    
    # refine alpha mask
    mask = Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    img.putalpha(mask)
    img.save('landing_page/public/assets/basil.png')
    print('Processed basil.png')

def process_chili():
    img = Image.open('landing_page/public/assets/chili_raw.png').convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    # Background is solid red ~ (200, 25, 35). Chili has bright highlights or deep red/green stems
    # Let's inspect background color in top-left of chili_raw
    bg_r, bg_g, bg_b = 205, 27, 36
    diff = np.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
    alpha = np.clip((diff - 12) * 5.0, 0, 255).astype(np.uint8)
    mask = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
    img.putalpha(mask)
    img.save('landing_page/public/assets/chili.png')
    print('Processed chili.png')

def process_tomato():
    img = Image.open('landing_page/public/assets/tomato_raw.png').convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    bg_r, bg_g, bg_b = 205, 27, 36
    diff = np.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
    alpha = np.clip((diff - 8) * 4.0, 0, 255).astype(np.uint8)
    mask = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.0))
    img.putalpha(mask)
    img.save('landing_page/public/assets/tomato.png')
    print('Processed tomato.png')

def process_burger():
    img = Image.open('landing_page/public/assets/burger_raw.png').convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    # Outside background is red on left/top/bottom-left, and white inside card
    # Let's compute difference from both background types
    # Red BG: (205, 27, 36)
    # White BG: (245, 245, 245)
    diff_red = np.sqrt((r - 205)**2 + (g - 27)**2 + (b - 36)**2)
    diff_white = np.sqrt((r - 245)**2 + (g - 245)**2 + (b - 245)**2)
    
    # If it's close to red OR close to white and not part of burger (let's use floodfill / threshold)
    # Burger colors: buns (brown/yellow R>180, G>130, B<80), patties (dark brown), lettuce (green), cheese (yellow/orange), tomatoes (red/seeds)
    # Let's check diff
    alpha = np.ones_like(r) * 255
    alpha[diff_red < 20] = 0
    alpha[diff_white < 22] = 0
    
    mask = Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    img.putalpha(mask)
    img.save('landing_page/public/assets/burger.png')
    print('Processed burger.png')

def process_pizza():
    img = Image.open('landing_page/public/assets/pizza_raw.png').convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    diff_red = np.sqrt((r - 205)**2 + (g - 27)**2 + (b - 36)**2)
    diff_white = np.sqrt((r - 245)**2 + (g - 245)**2 + (b - 245)**2)
    
    # Pizza is a circle shape!
    h, w = r.shape
    # Center of pizza circle in the original image coordinate frame
    # In pizza_raw (1080 to 1504, 670 to 1128)
    alpha = np.ones_like(r) * 255
    alpha[diff_red < 20] = 0
    alpha[diff_white < 25] = 0
    
    mask = Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    img.putalpha(mask)
    img.save('landing_page/public/assets/pizza.png')
    print('Processed pizza.png')

process_basil()
process_chili()
process_tomato()
process_burger()
process_pizza()
