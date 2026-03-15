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
 * Applies physically-accurate Game Boy Camera sensor simulation.
 * Emulates the Mitsubishi M64282FP CMOS sensor characteristics including noise,
 * vignetting, and Bayer ordered dithering.
 */
let cachedLookups: { width: number, height: number, fpn: Float32Array, vignette: Float32Array } | null = null;

function getLookups(width: number, height: number) {
    if (cachedLookups && cachedLookups.width === width && cachedLookups.height === height) {
        return cachedLookups;
    }
    const len = width * height;
    const fpn = new Float32Array(len);
    const vignette = new Float32Array(len);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            fpn[idx] = (Math.sin(x * 0.5) * 2) + (Math.cos(y * 0.5) * 2);
            
            const dx = (x / width) - 0.5;
            const dy = (y / height) - 0.5;
            const dist = Math.sqrt(dx * dx + dy * dy);
            vignette[idx] = Math.max(0, 1 - (dist * dist * 1.2));
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

    const lookups = getLookups(width, height);
    const fpnArray = lookups.fpn;
    const vignetteArray = lookups.vignette;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const i = idx * 4;

            // 1. Capture & Grayscale (using REC 601 weights like a real sensor)
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            let lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // 2. Simulate Sensor Noise (Fixed Pattern Noise + Random Analog Noise)
            // Real GBC sensors have slight vertical/horizontal banding (Fixed Pattern Noise)
            const fpn = fpnArray[idx];
            const grain = (Math.random() - 0.5) * 12; // Gauges the "read noise"
            lum += fpn + grain;

            // 3. Optical Vignetting (Lens falloff)
            const vignette = vignetteArray[idx];
            lum *= vignette;

            // 4. Contrast & Brightness (Sensor Curves)
            lum = (lum - 128) * contrast + 128 + brightness;
            lum = Math.max(0, Math.min(255, lum));

            // 5. Physically Accurate Bayer Ordered Dithering (4x4)
            // The Game Boy Camera uses three 4x4 matrices, but we use a unified one
            // with 4 levels (0, 1, 2, 3) mapped to the 4 palette shades.
            const bayerValue = BAYER_4x4[y % 4][x % 4]; // 0 to 15
            
            // Normalize lum to 0-3 range for 4 shades
            const normalizedLum = (lum / 255) * 3;
            const k = normalizedLum | 0;
            const fract = normalizedLum - k;
            
            // Dither threshold comparison
            let shadeIndex = k;
            if (fract > (bayerValue / 16)) {
                shadeIndex = Math.min(3, k + 1);
            }

            // 6. Map to Palette
            const p = palette[shadeIndex];
            data[i]     = p[0];
            data[i + 1] = p[1];
            data[i + 2] = p[2];
            data[i + 3] = 255;
        }
    }
    return imageData;
}
