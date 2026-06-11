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
          
          // Generate the exact same deterministic noise pattern used in Python
          const length = height * width * channels;
          const noiseArray = new Float32Array(length);
          let state = 42;
          for (let i = 0; i < length; i++) {
            // LCG matching Python: (state * 1664525 + 1013904223) & 0xFFFFFFFF
            // Math.imul safely does 32-bit integer multiplication
            state = (Math.imul(state, 1664525) + 1013904223) | 0;
            // state is signed 32-bit. Convert to unsigned by >>> 0
            const ustate = state >>> 0;
            noiseArray[i] = (ustate / 4294967296.0) * 10.0 - 5.0;
          }
          const noise = tf.tensor3d(noiseArray, [height, width, channels]);
          
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
