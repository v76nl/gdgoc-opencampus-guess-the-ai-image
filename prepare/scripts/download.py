import os
import requests

def download_images():
    raw_dir = os.path.join(os.path.dirname(__file__), "..", "raw_images")
    os.makedirs(raw_dir, exist_ok=True)

    # Clean existing raw images to ensure exact count of 6
    for file_name in os.listdir(raw_dir):
        file_path = os.path.join(raw_dir, file_name)
        if os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

    for i in range(6):
        url = f"https://picsum.photos/seed/unique_seed_{i+50}/800/800"
        print(f"Downloading {url} ...")
        response = requests.get(url)
        if response.status_code == 200:
            with open(os.path.join(raw_dir, f"image_{i+1:02d}.jpg"), "wb") as f:
                f.write(response.content)
        else:
            print(f"Failed to download image {i+1}")

if __name__ == "__main__":
    download_images()
