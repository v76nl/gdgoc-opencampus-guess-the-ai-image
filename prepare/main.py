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
    
    # 0. Check and download raw images if missing
    if not os.path.exists(raw_dir) or len(os.listdir(raw_dir)) == 0:
        print("Raw images directory is empty or missing. Fetching sample images...")
        from scripts.download import download_images
        download_images()
    
    print("1/3 Applying watermarks to images 1-3...")
    apply_watermark()
    
    print("2/3 Applying Exif metadata to images 4-6...")
    apply_exif()
    
    print("3/3 Generating answers.txt...")
    generate_answers()
    
    # Automatically copy output files to frontend public/images directory
    if os.path.exists(handson_images_dir):
        print(f"Automatically copying prepared images to frontend: {handson_images_dir}")
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
