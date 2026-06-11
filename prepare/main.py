import os
import shutil
from scripts.watermark import apply_watermark
from scripts.exif import apply_exif
from scripts.generate_answers import generate_answers

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    raw_dir = os.path.join(base_dir, "raw_images")
    out_dir = os.path.join(base_dir, "output_images")
    handson_images_dir = os.path.abspath(os.path.join(base_dir, "..", "handson", "public", "images"))

    print("Starting data preparation pipeline...")
    
    # Clean up output_images directory to prevent leftover files
    if os.path.exists(out_dir):
        for file_name in os.listdir(out_dir):
            file_path = os.path.join(out_dir, file_name)
            if os.path.isfile(file_path):
                os.remove(file_path)
    else:
        os.makedirs(out_dir, exist_ok=True)
    
    # 0. Check and download raw images if missing or count is not 6
    if not os.path.exists(raw_dir) or len(os.listdir(raw_dir)) != 6:
        print("Raw images directory is empty or count is not 6. Fetching 6 sample images...")
        from scripts.download import download_images
        download_images()
    
    print("1/3 Applying watermarks...")
    # Calculate counts and create shuffled assignments
    import math
    import random
    images = sorted([f for f in os.listdir(raw_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
    N = len(images)
    watermark_count = math.ceil(N / 4)
    exif_count = math.ceil(N / 4)
    real_count = N - watermark_count - exif_count
    
    assignments = ['watermark'] * watermark_count + ['exif'] * exif_count + ['real'] * real_count
    random.shuffle(assignments)
    print(f"Shuffled Assignments for {N} images: {assignments}")
    
    apply_watermark(assignments)
    
    print("2/3 Applying Exif metadata...")
    apply_exif(assignments)
    
    print("3/3 Generating answers.txt...")
    generate_answers(assignments)
    
    # Automatically copy output files to frontend public/images directory
    if os.path.exists(handson_images_dir):
        print(f"Automatically copying prepared images to frontend: {handson_images_dir}")
        # Clean up existing images/answers.txt in frontend to avoid leftovers
        for file_name in os.listdir(handson_images_dir):
            if file_name.startswith("image_") or file_name == "answers.txt":
                try:
                    os.remove(os.path.join(handson_images_dir, file_name))
                except Exception:
                    pass
        for file_name in os.listdir(out_dir):
            src_file = os.path.join(out_dir, file_name)
            dst_file = os.path.join(handson_images_dir, file_name)
            if os.path.isfile(src_file):
                shutil.copy2(src_file, dst_file)
    else:
        print("Warning: frontend images directory not found. Skipping auto-copy.")

    print("Pipeline completed successfully!")

if __name__ == "__main__":
    main()
