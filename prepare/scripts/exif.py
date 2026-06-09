import os
import piexif
import cv2

def apply_exif():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    raw_dir = os.path.join(base_dir, "raw_images")
    out_dir = os.path.join(base_dir, "output_images")
    os.makedirs(out_dir, exist_ok=True)

    images = sorted(os.listdir(raw_dir))
    
    for i, img_name in enumerate(images):
        if 3 <= i < 6:
            src_path = os.path.join(raw_dir, img_name)
            out_path = os.path.join(out_dir, img_name)
            
            # Read and resize to ensure consistency
            img = cv2.imread(src_path)
            if img is not None:
                img_resized = cv2.resize(img, (800, 800))
                # Write to out_path first
                cv2.imwrite(out_path, img_resized)
                
                # Now add EXIF
                try:
                    exif_dict = piexif.load(out_path)
                except Exception:
                    exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": None}
                
                # Add MakerNote
                exif_dict["Exif"][piexif.ExifIFD.MakerNote] = b"AI_GENERATED_IMAGE_DETECTED"
                
                exif_bytes = piexif.dump(exif_dict)
                piexif.insert(exif_bytes, out_path)

if __name__ == "__main__":
    apply_exif()
