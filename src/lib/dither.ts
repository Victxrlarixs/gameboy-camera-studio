/**
 * Bayer Matrix for ordered dithering
 */
const BAYER_4x4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
];

export const PALETTES: Record<string, number[][]> = {
    DMG: [
        [8, 24, 32],    // #081820
        [52, 104, 86],  // #346856
        [136, 192, 112], // #88c070
        [224, 248, 208] // #e0f8d0
    ],
    POCKET: [
        [0, 0, 0],
        [85, 85, 85],
        [170, 170, 170],
        [255, 255, 255]
    ],
    LIGHT: [
        [0, 48, 48],
        [0, 128, 128],
        [0, 192, 192],
        [128, 255, 255]
    ],
    MATRIX: [
        [0, 20, 0],
        [0, 100, 0],
        [0, 180, 0],
        [0, 255, 0]
    ],
    THERMAL: [
        [20, 20, 20],
        [80, 80, 80],
        [160, 160, 160],
        [240, 240, 230]
    ],
    CRT: [
        [32, 0, 0],
        [0, 32, 0],
        [0, 0, 32],
        [255, 255, 255]
    ]
};

export interface DitherOptions {
    palette?: number[][];
    brightness?: number; // -1 to 1
    contrast?: number;   // 0 to 2
    pixelSize?: number;  // For "Pixel density control"
}

export function applyDither(imageData: ImageData, options: DitherOptions = {}) {
    const { data, width, height } = imageData;
    const palette = options.palette || PALETTES.DMG;
    const brightness = options.brightness || 0;
    const contrast = options.contrast !== undefined ? options.contrast : 1;

    // We can simulate pixel size by reducing resolution internally
    // but for simplicity here we just do standard dithering

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Grayscale conversion (Luminance)
            let avg = 0.299 * r + 0.587 * g + 0.114 * b;

            // Apply Brightness & Contrast
            avg = (avg - 128) * contrast + 128 + (brightness * 255);
            avg = Math.max(0, Math.min(255, avg));

            // Ordered Dithering with Bayer Matrix
            const matrixX = x % 4;
            const matrixY = y % 4;
            const threshold = (BAYER_4x4[matrixY][matrixX] / 16.0) * 255;

            const value = avg + (threshold - 128) * 0.5;

            let colorIndex = 0;
            if (value < 64) colorIndex = 0;
            else if (value < 128) colorIndex = 1;
            else if (value < 192) colorIndex = 2;
            else colorIndex = 3;

            const [pr, pg, pb] = palette[colorIndex];
            data[i] = pr;
            data[i + 1] = pg;
            data[i + 2] = pb;
            data[i + 3] = 255;
        }
    }
    return imageData;
}
