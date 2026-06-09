import exifr from 'exifr';
import * as tf from '@tensorflow/tfjs';

export async function parseExif(imageEl: HTMLImageElement): Promise<string | null> {
  try {
    const exifData = await exifr.parse(imageEl, { makerNote: true });
    if (exifData && exifData.MakerNote) {
      // MakerNote might be an array or string. Convert to string for checking.
      const note = String(exifData.MakerNote);
      if (note.includes('AI_GENERATED_IMAGE_DETECTED') || note.includes('65,73,95,71,69,78')) {
        return "MakerNote: AI_GENERATED_IMAGE_DETECTED";
      }
      return "MakerNote: Other (" + note.substring(0, 20) + "...)";
    }
    return "No AI specific Exif tag found.";
  } catch (error) {
    return "Error parsing Exif.";
  }
}

export async function analyzePixel(imageEl: HTMLImageElement): Promise<{ score: number, detected: boolean }> {
  // Dummy logic for tensorflow JS correlation check
  await tf.ready();
  
  // Pretend we load the image and calculate a spectral noise correlation
  // Because it's a dummy for now, we'll just return a random high score if it has a specific source or random.
  // Actually, we can use a dummy promise with timeout
  return new Promise((resolve) => {
    setTimeout(() => {
      // In reality, we would extract tf.browser.fromPixels(imageEl) and calculate
      // For this hands-on, since it's a dummy calculation logic:
      const randomScore = Math.random();
      const detected = randomScore > 0.8; 
      resolve({ score: randomScore, detected });
    }, 500);
  });
}
