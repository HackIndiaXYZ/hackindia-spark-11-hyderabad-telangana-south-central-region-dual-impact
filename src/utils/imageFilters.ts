/**
 * Applies a 3x3 sharpening convolution kernel to a canvas context's image data
 */
export function sharpenImageData(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);
  
  // Sharpen kernel:
  //  0  -1   0
  // -1   5  -1
  //  0  -1   0
  const weights = [
     0, -1,  0,
    -1,  5, -1,
     0, -1,  0
  ];
  const side = 3;
  const halfSide = 1;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * width + x) * 4;
      
      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = Math.min(height - 1, Math.max(0, sy + cy - halfSide));
          const scx = Math.min(width - 1, Math.max(0, sx + cx - halfSide));
          const srcOff = (scy * width + scx) * 4;
          const wt = weights[cy * side + cx];
          
          r += copy[srcOff] * wt;
          g += copy[srcOff + 1] * wt;
          b += copy[srcOff + 2] * wt;
        }
      }
      
      data[dstOff] = Math.min(255, Math.max(0, r));
      data[dstOff + 1] = Math.min(255, Math.max(0, g));
      data[dstOff + 2] = Math.min(255, Math.max(0, b));
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Performs adaptive binarization thresholding on canvas image data
 */
export function thresholdImageData(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    total += v;
  }
  const threshold = (total / (data.length / 4)) * 0.85; // Adaptive threshold parameter

  for (let i = 0; i < data.length; i += 4) {
    const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = v >= threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);
}
