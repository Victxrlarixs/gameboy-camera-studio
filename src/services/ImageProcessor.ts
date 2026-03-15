import { applyDither, PALETTES } from '../lib/dither';

export class ImageProcessor {
    static async process(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 112;
                const ctx = canvas.getContext('2d')!;

                const size = Math.min(img.width, img.height);
                ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 128, 112);

                const imageData = ctx.getImageData(0, 0, 128, 112);
                ctx.putImageData(applyDither(imageData, { palette: PALETTES.DMG, brightness: 0, contrast: 1 }), 0, 0);

                const out = document.createElement('canvas');
                out.width = 160;
                out.height = 144;
                const outCtx = out.getContext('2d')!;

                outCtx.fillStyle = '#9bbc0f';
                outCtx.fillRect(0, 0, 160, 144);
                outCtx.drawImage(canvas, 16, 16);

                outCtx.fillStyle = '#0f380f';
                for (let i = 0; i < 160; i += 8) {
                    outCtx.fillRect(i, 0,   4, 16);
                    outCtx.fillRect(i, 128, 4, 16);
                }

                resolve(out.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
}
