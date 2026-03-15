// 4x4 Bayer matrix, values 0-15
const BAYER_4x4 = [
    [0,  8,  2, 10],
    [12, 4, 14,  6],
    [3, 11,  1,  9],
    [15, 7, 13,  5]
];

export const PALETTES: Record<string, number[][]> = {
    DMG:     [[8, 24, 32], [52, 104, 86], [136, 192, 112], [224, 248, 208]],
    POCKET:  [[0, 0, 0], [85, 85, 85], [170, 170, 170], [255, 255, 255]],
    LIGHT:   [[0, 48, 48], [0, 128, 128], [0, 192, 192], [128, 255, 255]],
    MATRIX:  [[0, 20, 0], [0, 100, 0], [0, 180, 0], [0, 255, 0]],
    THERMAL: [[20, 20, 20], [80, 80, 80], [160, 160, 160], [240, 240, 230]],
    CRT:     [[32, 0, 0], [0, 32, 0], [0, 0, 32], [255, 255, 255]]
};

export interface DitherOptions {
    palette?: number[][];
    brightness?: number;
    contrast?: number;
}

// Cache FPN and vignette lookup arrays per canvas size
let cachedLookups: { width: number, height: number, fpn: Float32Array, vignette: Float32Array } | null = null;

function getLookups(width: number, height: number) {
    if (cachedLookups?.width === width && cachedLookups?.height === height) return cachedLookups;
    const len = width * height;
    const fpn = new Float32Array(len);
    const vignette = new Float32Array(len);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            fpn[idx] = (Math.sin(x * 0.5) * 2) + (Math.cos(y * 0.5) * 2);
            const dx = (x / width) - 0.5;
            const dy = (y / height) - 0.5;
            vignette[idx] = Math.max(0, 1 - ((dx * dx + dy * dy) * 1.2));
        }
    }
    cachedLookups = { width, height, fpn, vignette };
    return cachedLookups;
}

export function applyDither(imageData: ImageData, options: DitherOptions = {}): ImageData {
    const { data, width, height } = imageData;
    const palette = options.palette ?? PALETTES.DMG;
    const brightness = (options.brightness ?? 0) * 255;
    const contrast = options.contrast ?? 1;

    const { fpn: fpnArray, vignette: vignetteArray } = getLookups(width, height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const i = idx * 4;

            // REC 601 luma
            let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            // FPN + analog noise (simulates M64282FP read noise)
            lum += fpnArray[idx] + (Math.random() - 0.5) * 12;

            // Lens vignetting
            lum *= vignetteArray[idx];

            // Contrast / brightness curves
            lum = Math.max(0, Math.min(255, (lum - 128) * contrast + 128 + brightness));

            // Bayer ordered dither to 4 levels
            const norm = (lum / 255) * 3;
            const k = norm | 0;
            const shadeIndex = (norm - k) > (BAYER_4x4[y % 4][x % 4] / 16) ? Math.min(3, k + 1) : k;

            const p = palette[shadeIndex];
            data[i]     = p[0];
            data[i + 1] = p[1];
            data[i + 2] = p[2];
            data[i + 3] = 255;
        }
    }
    return imageData;
}
