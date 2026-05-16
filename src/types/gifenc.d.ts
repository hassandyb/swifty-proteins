declare module 'gifenc' {
  interface GIFEncoderInstance {
    writeFrame(
      data: Uint8Array,
      width: number,
      height: number,
      opts?: { delay?: number; palette?: number[][]; repeat?: number }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
  }
  export function GIFEncoder(): GIFEncoderInstance;
  export function quantize(pixels: Uint8Array, maxColors: number, opts?: Record<string, unknown>): number[][];
  export function applyPalette(pixels: Uint8Array, palette: number[][]): Uint8Array;
}
