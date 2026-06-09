import os
import cv2
import numpy as np
import shutil

def apply_watermark():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    raw_dir = os.path.join(base_dir, "raw_images")
    out_dir = os.path.join(base_dir, "output_images")
    os.makedirs(out_dir, exist_ok=True)

    # Use first 3 images for watermark
    images = sorted(os.listdir(raw_dir))
    
    np.random.seed(42)
    # create a fixed noise pattern for 800x800
    noise = np.random.randn(800, 800, 3) * 5
    
    for i, img_name in enumerate(images):
        src_path = os.path.join(raw_dir, img_name)
        out_path = os.path.join(out_dir, img_name)
        
        if i < 3:
            # Apply watermark
            img = cv2.imread(src_path)
            if img is not None:
                img_resized = cv2.resize(img, (800, 800))
                watermarked = np.clip(img_resized + noise, 0, 255).astype(np.uint8)
                out_path_png = os.path.splitext(out_path)[0] + ".png"
                cv2.imwrite(out_path_png, watermarked)
        elif i >= 6:
            # Copy unmodified (images 6 to 11)
            img = cv2.imread(src_path)
            if img is not None:
                cv2.imwrite(out_path, img)

if __name__ == "__main__":
    apply_watermark()
