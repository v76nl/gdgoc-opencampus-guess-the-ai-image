import os

def generate_answers():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    out_dir = os.path.join(base_dir, "output_images")
    answers_file = os.path.join(out_dir, "answers.txt")

    with open(answers_file, "w", encoding="utf-8") as f:
        for i in range(1, 13):
            if i <= 3:
                f.write(f"image_{i:02d}: ai (watermark)\n")
            elif i <= 6:
                f.write(f"image_{i:02d}: ai (exif)\n")
            else:
                f.write(f"image_{i:02d}: real\n")

if __name__ == "__main__":
    generate_answers()
