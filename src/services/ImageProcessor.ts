import { applyDither, PALETTES } from '../lib/dither';

/**
 * Converts an arbitrary image file into the Game Boy Camera output format:
 * a 160×144 canvas with a 128×112 center-cropped, 4-level dithered image
 * surrounded by a DMG-palette decorative border.
 */
export class ImageProcessor {

    /**
     * Processes an image {@link File} to Game Boy Camera format.
     * The source image is center-cropped, scaled to 128×112, dithered using
     * the DMG palette, then composited onto a 160×144 frame.
     *
     * @param file - The image file to process (any browser-supported format).
     * @returns A Promise resolving to a PNG data URL of the processed image.
     * @throws Rejects if the image fails to load.
     */
    static async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width  = 128;
                canvas.height = 112;
                const ctx = canvas.getContext('2d')!;

                const size = Math.min(img.width, img.height);
                const sx   = (img.width  - size) / 2;
                const sy   = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 112);

                const imageData = ctx.getImageData(0, 0, 128, 112);
                const dithered  = applyDither(imageData, {
                    palette:    PALETTES.DMG,
                    brightness: 0,
                    contrast:   1
                });
                ctx.putImageData(dithered, 0, 0);

                const finalCanvas = document.createElement('canvas');
                finalCanvas.width  = 160;
                finalCanvas.height = 144;
                const finalCtx = finalCanvas.getContext('2d')!;

                finalCtx.fillStyle = '#9bbc0f';
                finalCtx.fillRect(0, 0, 160, 144);
                finalCtx.drawImage(canvas, 16, 16);

                finalCtx.fillStyle = '#0f380f';
                for (let i = 0; i < 160; i += 8) {
                    finalCtx.fillRect(i, 0,   4, 16);
                    finalCtx.fillRect(i, 128, 4, 16);
                }

                resolve(finalCanvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
}
