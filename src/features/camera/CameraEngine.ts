import { applyDither, PALETTES } from '../../lib/dither';
import { PhotoStore } from '../../store/photos';
import { AppStore, STAMPS } from '../../store/app';

export class CameraEngine {
    private video: HTMLVideoElement | null = null;
    private stream: MediaStream | null = null;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private processingCanvas: HTMLCanvasElement;
    private processingCtx: CanvasRenderingContext2D;
    private isFrozen = false;
    private animFrame: number | null = null;

    constructor(targetCanvas: HTMLCanvasElement) {
        this.canvas = targetCanvas;
        this.ctx = targetCanvas.getContext('2d')!;

        this.processingCanvas = document.createElement('canvas');
        this.processingCanvas.width = 128;
        this.processingCanvas.height = 112;
        this.processingCtx = this.processingCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false
            });

            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.play();

            this.isFrozen = false;
            this.loop();
        } catch (err) {
            console.error('Camera access denied:', err);
        }
    }

    stop() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.video = null;
    }

    private loop() {
        if (AppStore.state.mode !== 'SHOOT') return;

        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    }

    private render() {
        if (this.isFrozen || !this.video || this.video.videoWidth === 0) return;

        const vWidth = this.video.videoWidth;
        const vHeight = this.video.videoHeight;
        const size = Math.min(vWidth, vHeight);
        const sx = (vWidth - size) / 2;
        const sy = (vHeight - size) / 2;

        this.processingCtx.drawImage(this.video, sx, sy, size, size, 0, 0, 128, 112);

        const imageData = this.processingCtx.getImageData(0, 0, 128, 112);
        const palette = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;

        applyDither(imageData, {
            palette: palette,
            brightness: AppStore.state.brightness,
            contrast: AppStore.state.contrast
        });

        this.processingCtx.putImageData(imageData, 0, 0);

        // Draw to main screen
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.fillStyle = `rgb(${palette[3].join(',')})`;
        this.ctx.fillRect(0, 0, 160, 144);
        this.ctx.drawImage(this.processingCanvas, 0, 0, 160, 144);

        // Overlays
        this.drawFrame();
        this.drawStamps();
    }

    takePhoto() {
        this.isFrozen = true;
        const dataUrl = this.canvas.toDataURL('image/png');
        const photo = PhotoStore.savePhoto(dataUrl);
        setTimeout(() => { this.isFrozen = false; }, 1000);
        return photo;
    }

    private drawFrame() {
        const palette = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        this.ctx.fillStyle = `rgb(${palette[0].join(',')})`;

        // Scale borders to the 160x144 internal coordinate system
        const thickness = 12;
        // Top
        this.ctx.fillRect(0, 0, 160, thickness);
        // Bottom
        this.ctx.fillRect(0, 144 - thickness, 160, thickness);
        // Left
        this.ctx.fillRect(0, 0, thickness, 144);
        // Right
        this.ctx.fillRect(160 - thickness, 0, thickness, 144);

        // Decorative "vents" or patterns in the border
        this.ctx.fillStyle = `rgb(${palette[1].join(',')})`;
        for (let i = 20; i < 140; i += 10) {
            this.ctx.fillRect(i, 2, 2, 8);
            this.ctx.fillRect(i, 134, 2, 8);
        }
    }

    private drawStamps() {
        const stamp = STAMPS[AppStore.state.stampIndex];
        if (stamp === 'NONE') return;
        const palette = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        this.ctx.fillStyle = `rgb(${palette[0].join(',')})`;
        if (stamp === 'HEART') {
            const x = 20, y = 20;
            this.ctx.fillRect(x + 2, y, 2, 2); this.ctx.fillRect(x + 6, y, 2, 2);
            this.ctx.fillRect(x, y + 2, 10, 4);
            this.ctx.fillRect(x + 2, y + 6, 6, 2);
            this.ctx.fillRect(x + 4, y + 8, 2, 2);
        } else if (stamp === 'SMILE') {
            const x = 130, y = 20;
            this.ctx.fillRect(x + 2, y + 2, 2, 2); this.ctx.fillRect(x + 6, y + 2, 2, 2);
            this.ctx.fillRect(x + 2, y + 6, 6, 2);
            this.ctx.fillRect(x, y + 6, 2, 2); this.ctx.fillRect(x + 8, y + 6, 2, 2);
        }
    }
}
