import cv2
import numpy as np
import os

brain_dir = r"C:\Users\Rahul Sharma\.gemini\antigravity-ide\brain\5743a5f1-474b-42cf-9ef5-a52de820df5f"
out_dir = "landing_page/public/assets"
os.makedirs(out_dir, exist_ok=True)

def cutout_from_white_clean(img_path, out_name, diff_thresh=18, feather=1.0):
    img = cv2.imread(img_path)
    if img is None:
        print(f"Error loading {img_path}")
        return
    
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)
    
    # Distance from white (255, 255, 255)
    # Using Euclidean distance in RGB or max difference
    diff = np.sqrt(np.sum((255.0 - rgb)**2, axis=2))
    
    # Mask: 0 if diff < diff_thresh, 255 if diff > diff_thresh + 15
    alpha = np.clip((diff - diff_thresh) / 12.0 * 255.0, 0, 255).astype(np.uint8)
    
    # Floodfill background starting from all 4 corners and borders
    h, w = alpha.shape
    bg_connected = np.zeros((h+2, w+2), np.uint8)
    
    # Binary mask of sure background (low diff)
    sure_bg = (diff < diff_thresh + 4).astype(np.uint8) * 255
    cv2.floodFill(sure_bg, bg_connected, (0, 0), 128)
    cv2.floodFill(sure_bg, bg_connected, (w-1, 0), 128)
    cv2.floodFill(sure_bg, bg_connected, (0, h-1), 128)
    cv2.floodFill(sure_bg, bg_connected, (w-1, h-1), 128)
    
    is_outer_bg = (sure_bg == 128)
    alpha[is_outer_bg] = 0
    
    if feather > 0:
        ksize = int(feather * 2) * 2 + 1
        alpha = cv2.GaussianBlur(alpha, (ksize, ksize), feather)
        
    b, g, r = cv2.split(img)
    rgba = cv2.merge([b, g, r, alpha])
    
    out_path = os.path.join(out_dir, out_name)
    cv2.imwrite(out_path, rgba)
    print(f"Saved clean cutout {out_path} ({w}x{h})")

cutout_from_white_clean(os.path.join(brain_dir, "burger_floating_1791442425319.jpg"), "burger.png", diff_thresh=22, feather=1.0)
cutout_from_white_clean(os.path.join(brain_dir, "pizza_hero_1791442127788.jpg"), "pizza.png", diff_thresh=20, feather=1.0)
cutout_from_white_clean(os.path.join(brain_dir, "chili_hero_1791442314107.jpg"), "chili.png", diff_thresh=18, feather=0.8)
cutout_from_white_clean(os.path.join(brain_dir, "basil_hero_1791442330946.jpg"), "basil.png", diff_thresh=18, feather=0.8)
cutout_from_white_clean(os.path.join(brain_dir, "tomato_hero_1791442350032.jpg"), "tomato.png", diff_thresh=18, feather=1.0)
