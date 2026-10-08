import cv2
import numpy as np

def generate_brush_stroke():
    w, h = 900, 220
    # Create canvas
    canvas = np.zeros((h, w, 4), dtype=np.uint8)
    
    # Red paint color
    r_val, g_val, b_val = 225, 25, 35
    
    # Base rectangle
    margin_x = 70
    margin_y = 25
    
    # Draw bristles with randomized thickness and lengths
    np.random.seed(42)
    for y in range(margin_y, h - margin_y):
        # determine start and end x with noise
        jitter_left = int(np.random.normal(margin_x, 14))
        jitter_right = int(np.random.normal(w - margin_x, 14))
        
        # Center thickness
        dist_from_center_y = abs(y - h/2) / (h/2)
        if dist_from_center_y > 0.85:
            # edge breakup
            if np.random.rand() > 0.7:
                continue
                
        thickness = np.random.randint(2, 5)
        color = (b_val + np.random.randint(-15, 10), 
                 g_val + np.random.randint(-8, 8), 
                 r_val + np.random.randint(-10, 15), 
                 np.random.randint(235, 255))
        
        cv2.line(canvas, (max(10, jitter_left), y), (min(w - 10, jitter_right), y), color, thickness)
        
    # Add dry brush streaks on ends
    for _ in range(300):
        # Left streaks
        y = np.random.randint(margin_y - 10, h - margin_y + 10)
        x_start = np.random.randint(15, margin_x + 30)
        length = np.random.randint(20, 120)
        alpha = np.random.randint(180, 255)
        color = (b_val, g_val, r_val, alpha)
        cv2.line(canvas, (x_start, y), (x_start + length, y), color, np.random.randint(1, 4))
        
        # Right streaks
        y = np.random.randint(margin_y - 10, h - margin_y + 10)
        x_end = np.random.randint(w - margin_x - 30, w - 15)
        length = np.random.randint(20, 120)
        color = (b_val, g_val, r_val, alpha)
        cv2.line(canvas, (x_end - length, y), (x_end, y), color, np.random.randint(1, 4))

    # Add paint splatter specks
    for _ in range(60):
        x = np.random.choice([np.random.randint(5, margin_x + 10), np.random.randint(w - margin_x - 10, w - 5)])
        y = np.random.randint(10, h - 10)
        radius = np.random.randint(1, 4)
        cv2.circle(canvas, (x, y), radius, (b_val, g_val, r_val, np.random.randint(180, 255)), -1)
        
    cv2.imwrite('landing_page/public/assets/brush_stroke.png', canvas)
    print("Brush stroke generated")

generate_brush_stroke()
