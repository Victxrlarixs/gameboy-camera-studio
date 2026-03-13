import { applyDither, PALETTES } from '../lib/dither';

export class ImageProcessor {
    /**
     * Processes an image to Game Boy Camera format (128x112, 4-level dithered)
     */
    static async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 112;
                const ctx = canvas.getContext('2d')!;

                // Center Crop and Resize
                const size = Math.min(img.width, img.height);
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 112);

                const imageData = ctx.getImageData(0, 0, 128, 112);

                // This could be moved to a worker if we wanted, but for single images it's fast
                const dithered = applyDither(imageData, {
                    palette: PALETTES.DMG,
                    brightness: 0,
                    contrast: 1
                });

                ctx.putImageData(dithered, 0, 0);

                // Return full-sized GBCam styled result (including a dummy UI frame or just the raw photo)
                // For the gallery, we store the full screen 160x144 look
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = 160;
                finalCanvas.height = 144;
                const finalCtx = finalCanvas.getContext('2d')!;

                finalCtx.fillStyle = '#9bbc0f';
                finalCtx.fillRect(0, 0, 160, 144);
                finalCtx.drawImage(canvas, 16, 16);

                // Add decorative border to uploaded photo
                finalCtx.fillStyle = '#0f380f';
                for (let i = 0; i < 160; i += 8) {
                    finalCtx.fillRect(i, 0, 4, 16);
                    finalCtx.fillRect(i, 128, 4, 16);
                }

                resolve(finalCanvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
}
