/**
 * 4×4 Bayer ordered-dithering threshold matrix.
 * Values are normalized by dividing by 16 during processing.
 */
const BAYER_4x4 = [
    [0,  8,  2, 10],
    [12, 4, 14,  6],
    [3, 11,  1,  9],
    [15, 7, 13,  5]
];

/**
 * Predefined 4-shade RGB palettes emulating historical Game Boy screen variants.
 * Each palette is an ordered array of four `[R, G, B]` values from darkest to lightest.
 */
export const PALETTES: Record<string, number[][]> = {
    DMG:     [[8, 24, 32], [52, 104, 86], [136, 192, 112], [224, 248, 208]],
    POCKET:  [[0, 0, 0], [85, 85, 85], [170, 170, 170], [255, 255, 255]],
    LIGHT:   [[0, 48, 48], [0, 128, 128], [0, 192, 192], [128, 255, 255]],
    MATRIX:  [[0, 20, 0], [0, 100, 0], [0, 180, 0], [0, 255, 0]],
    THERMAL: [[20, 20, 20], [80, 80, 80], [160, 160, 160], [240, 240, 230]],
    CRT:     [[32, 0, 0], [0, 32, 0], [0, 0, 32], [255, 255, 255]]
};

/**
 * Configuration options for the dithering pass.
 */
export interface DitherOptions {
    /** Target 4-shade palette. Defaults to {@link PALETTES.DMG}. */
    palette?: number[][];
    /** Brightness offset in the range `[-1, 1]`. Defaults to `0`. */
    brightness?: number;
    /** Contrast multiplier in the range `[0, 2]`. Defaults to `1`. */
    contrast?: number;
    /** Reserved for future pixel-density scaling. */
    pixelSize?: number;
}

/**
 * Applies Bayer ordered dithering to raw `ImageData` in-place.
 * Converts the image to grayscale, applies brightness/contrast, then
 * quantizes each pixel to the nearest of the four palette entries.
 *
 * @param imageData - The raw `ImageData` buffer to process (mutated in-place).
 * @param options   - Optional dithering configuration.
 * @returns The mutated `imageData` for convenient chaining.
 */
export function applyDither(imageData: ImageData, options: DitherOptions = {}): ImageData {
    const { data, width, height } = imageData;
    const palette    = options.palette    ?? PALETTES.DMG;
    const brightness = options.brightness ?? 0;
    const contrast   = options.contrast   ?? 1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            let lum = 0.299 * r + 0.587 * g + 0.114 * b;
            lum = (lum - 128) * contrast + 128 + brightness * 255;
            lum = Math.max(0, Math.min(255, lum));

            const threshold = (BAYER_4x4[y % 4][x % 4] / 16.0) * 255;
            const value     = lum + (threshold - 128) * 0.5;

            let colorIndex = 0;
            if      (value < 64)  colorIndex = 0;
            else if (value < 128) colorIndex = 1;
            else if (value < 192) colorIndex = 2;
            else                   colorIndex = 3;

            const [pr, pg, pb] = palette[colorIndex];
            data[i]     = pr;
            data[i + 1] = pg;
            data[i + 2] = pb;
            data[i + 3] = 255;
        }
    }
    return imageData;
}
