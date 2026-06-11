import exifr from 'exifr';
import * as tf from '@tensorflow/tfjs';

export async function parseExif(imageEl: HTMLImageElement): Promise<{ result: string, detected: boolean }> {
  try {
    let exifData: any = null;
    try {
      exifData = await exifr.parse(imageEl, { makerNote: true });
    } catch (e) {
      // Ignore parse error
    }
    
    let isAiExif = false;
    if (exifData && exifData.MakerNote) {
      const note = String(exifData.MakerNote);
      if (note.includes('AI_GENERATED_IMAGE_DETECTED') || note.includes('65,73,95,71,69,78')) {
        isAiExif = true;
      }
    }

    if (isAiExif) {
      return { result: "AIらしきメタデータを検知", detected: true };
    }
    return { result: "AIらしきメタデータは見つかりませんでした", detected: false };
  } catch (error) {
    return { result: "メタデータの解析に失敗しました", detected: false };
  }
}

export async function analyzePixel(imageEl: HTMLImageElement): Promise<{ score: number, detected: boolean }> {
  await tf.ready();
  
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const result = tf.tidy(() => {
          // Convert image to tensor, shape [height, width, 3]
          const imgTensor = tf.browser.fromPixels(imageEl).toFloat();
          const [height, width, channels] = imgTensor.shape;
          
          if (channels !== 3 || height === 0 || width === 0) {
            return { score: 0, detected: false };
          }
          
          // Generate the same deterministic noise pattern used in Python
          // y_coords: [height, 1, 1]
          const y = tf.range(0, height).reshape([height, 1, 1]);
          // x_coords: [1, width, 1]
          const x = tf.range(0, width).reshape([1, width, 1]);
          // c_coords: [1, 1, 3]
          const c = tf.range(0, 3).reshape([1, 1, 3]);
          
          // val = sin(x * 12.9898 + y * 78.233 + c * 37.719) * 43758.5453
          const xTerm = x.mul(12.9898);
          const yTerm = y.mul(78.233);
          const cTerm = c.mul(37.719);
          
          const sum = xTerm.add(yTerm).add(cTerm);
          const val = sum.sin().mul(43758.5453);
          
          // frac = val - floor(val)
          const frac = val.sub(val.floor());
          
          // noise = (frac * 10.0) - 5.0
          const noise = frac.mul(10.0).sub(5.0);
          
          // Compute correlation (mean of image * noise)
          const correlation = imgTensor.mul(noise).mean();
          const score = correlation.dataSync()[0];
          
          return { score, detected: false };
        });
        
        // Expected score for watermarked is ~8.3. Unwatermarked is ~0.0.
        // Threshold set to 2.0 to be safe.
        const detected = result.score > 2.0;
        resolve({ score: result.score, detected });
      } catch (e) {
        console.error(e);
        resolve({ score: 0, detected: false });
      }
    }, 100); // UI wait
  });
}
