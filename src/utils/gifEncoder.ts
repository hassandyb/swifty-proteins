import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export async function encodeGifFromFrames(
  frames: Uint8Array[],
  width: number,
  height: number,
  fps: number = 10,
  onProgress?: (encoded: number, total: number) => void
): Promise<Uint8Array> {
  const encoder = GIFEncoder();
  const delay = Math.round(1000 / fps);

  // Compute palette once from the first frame — molecule uses a consistent color set
  const palette = quantize(frames[0], 256);

  for (let i = 0; i < frames.length; i++) {
    const index = applyPalette(frames[i], palette);
    encoder.writeFrame(index, width, height, { palette, delay });
    onProgress?.(i + 1, frames.length);
    if (i % 5 === 4) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
  }

  encoder.finish();
  return encoder.bytes();
}
