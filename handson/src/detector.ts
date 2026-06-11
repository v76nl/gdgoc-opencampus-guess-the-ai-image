import exifr from 'exifr';
import * as tf from '@tensorflow/tfjs';

export async function parseExif(imageEl: HTMLImageElement): Promise<{ result: string, detected: boolean, debugLog: string }> {
  try {
    let exifData: any = null;
    let parseError: string = "";
    try {
      const response = await fetch(imageEl.src);
      const arrayBuffer = await response.arrayBuffer();
      exifData = await exifr.parse(arrayBuffer, { makerNote: true });
    } catch (e) {
      parseError = String(e);
    }
    
    let isAiExif = false;
    const noteRaw = exifData ? (exifData.makerNote || exifData.MakerNote) : null;
    if (noteRaw) {
      const note = String(noteRaw);
      if (note.includes('AI_GENERATED_IMAGE_DETECTED') || note.includes('65,73,95,71,69,78')) {
        isAiExif = true;
      }
    }
    
    const debugInfo = {
      hasExifData: !!exifData,
      keys: exifData ? Object.keys(exifData) : [],
      makerNoteType: noteRaw ? typeof noteRaw : 'undefined',
      makerNoteString: noteRaw ? String(noteRaw).substring(0, 100) : '',
      parseError
    };

    if (isAiExif) {
      return { result: "AIらしきメタデータを検知", detected: true, debugLog: JSON.stringify(debugInfo) };
    }
    return { result: "AIらしきメタデータは見つかりませんでした", detected: false, debugLog: JSON.stringify(debugInfo) };
  } catch (error) {
    return { result: "メタデータの解析に失敗しました", detected: false, debugLog: String(error) };
  }
}

export async function analyzePixel(imageEl: HTMLImageElement): Promise<{ score: number, detected: boolean, debugLog: string }> {
  await tf.ready();
  
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const result = tf.tidy(() => {
          // Draw image to an offscreen canvas to ensure we read intrinsic size (e.g. 800x800)
          // instead of the CSS-rendered size (e.g. 518x518)
          const canvas = document.createElement('canvas');
          canvas.width = imageEl.naturalWidth || 800;
          canvas.height = imageEl.naturalHeight || 800;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx?.drawImage(imageEl, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to tensor, shape [height, width, 3]
          const imgTensor = tf.browser.fromPixels(canvas).toFloat();
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
          // OpenCV reads in BGR, but tf.browser.fromPixels reads in RGB.
          // We need to reverse the channel dimension to match the noise generation.
          const noise = tf.tensor3d(noiseArray, [height, width, channels]).reverse(2);
          
          // Compute correlation (mean of image * noise)
          const correlation = imgTensor.mul(noise).mean();
          const score = correlation.dataSync()[0];
          
          return { score, detected: false, shape: `${height}x${width}x${channels}` };
        });
        
        // Expected score for watermarked is ~7.7. Unwatermarked is ~0.0.
        // Threshold set to 2.0 to be safe.
        const detected = result.score > 2.0;
        resolve({ score: result.score, detected, debugLog: `Raw Score: ${result.score} (Shape: ${result.shape})` });
      } catch (e) {
        console.error(e);
        resolve({ score: 0, detected: false, debugLog: String(e) });
      }
    }, 100); // UI wait
  });
}
