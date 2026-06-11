import os

def generate_answers():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    raw_dir = os.path.join(base_dir, "raw_images")
    out_dir = os.path.join(base_dir, "output_images")
    answers_file = os.path.join(out_dir, "answers.txt")

    import math
    images = sorted([f for f in os.listdir(raw_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
    N = len(images)
    watermark_count = math.ceil(N / 4)
    exif_count = math.ceil(N / 4)

    with open(answers_file, "w", encoding="utf-8") as f:
        for i, img_name in enumerate(images):
            name_without_ext = os.path.splitext(img_name)[0]
            if i < watermark_count:
                f.write(f"{name_without_ext}: ai (watermark)\n")
            elif i < watermark_count + exif_count:
                f.write(f"{name_without_ext}: ai (exif)\n")
            else:
                f.write(f"{name_without_ext}: real\n")

if __name__ == "__main__":
    generate_answers()
