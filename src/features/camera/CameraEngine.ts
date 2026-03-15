import { applyDither, PALETTES } from '../../lib/dither';
import { PhotoStore } from '../../store/photos';
import { AppStore, STAMPS, FRAMES } from '../../store/app';
import { Stamps } from '../stamps/stamp-registry';
import { Frames } from '../frames/frame-registry';

export class CameraEngine {
    private video: HTMLVideoElement | null = null;
    private stream: MediaStream | null = null;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private processingCanvas: HTMLCanvasElement;
    private processingCtx: CanvasRenderingContext2D;
    private compositionCanvas: HTMLCanvasElement;
    private compositionCtx: CanvasRenderingContext2D;
    private isFrozen = false;
    private animFrame: number | null = null;
    private boundToggleListener: ((e: any) => void) | null = null;
    private lastRawData: Uint8Array | null = null;

    constructor(targetCanvas: HTMLCanvasElement) {
        this.canvas = targetCanvas;
        this.ctx = targetCanvas.getContext('2d')!;

        this.processingCanvas = document.createElement('canvas');
        this.processingCanvas.width = 128;
        this.processingCanvas.height = 112;
        this.processingCtx = this.processingCanvas.getContext('2d', { willReadFrequently: true })!;

        this.compositionCanvas = document.createElement('canvas');
        this.compositionCanvas.width = 160;
        this.compositionCanvas.height = 144;
        this.compositionCtx = this.compositionCanvas.getContext('2d')!;
    }

    async start(forceFacingMode?: 'user' | 'environment') {
        try {
            const facingMode = forceFacingMode || AppStore.state.facingMode;
            this.stop();

            const constraints: MediaTrackConstraints = { width: { ideal: 640 }, height: { ideal: 480 } };
            if (facingMode) constraints.facingMode = { ideal: facingMode };

            this.stream = await navigator.mediaDevices.getUserMedia({ video: constraints, audio: false });
            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.play();
            this.isFrozen = false;
            this.loop();

            if (this.boundToggleListener) window.removeEventListener('gb-camera-toggle', this.boundToggleListener);
            this.boundToggleListener = (e: any) => this.start(e.detail.facingMode);
            window.addEventListener('gb-camera-toggle', this.boundToggleListener, { once: true });
        } catch {
            // camera access denied
        }
    }

    stop() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.stream?.getTracks().forEach(t => t.stop());
        if (this.boundToggleListener) {
            window.removeEventListener('gb-camera-toggle', this.boundToggleListener);
            this.boundToggleListener = null;
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

        const { videoWidth: vW, videoHeight: vH } = this.video;
        const size = Math.min(vW, vH);
        const sx = (vW - size) / 2;
        const sy = (vH - size) / 2;

        this.processingCtx.imageSmoothingEnabled = false;
        this.processingCtx.drawImage(this.video, sx, sy, size, size, 0, 0, 128, 112);

        // M64282FP-style edge enhancement via overlay composite
        this.processingCtx.globalCompositeOperation = 'overlay';
        this.processingCtx.globalAlpha = 0.2;
        this.processingCtx.drawImage(this.processingCanvas, -1, -1, 128, 112);
        this.processingCtx.globalCompositeOperation = 'source-over';
        this.processingCtx.globalAlpha = 1.0;

        const imageData = this.processingCtx.getImageData(0, 0, 128, 112);

        // Capture red channel as luminance proxy before dithering
        if (!this.lastRawData || this.lastRawData.length !== 128 * 112) {
            this.lastRawData = new Uint8Array(128 * 112);
        }
        const raw = imageData.data;
        for (let i = 0, j = 0; i < raw.length; i += 4, j++) this.lastRawData[j] = raw[i];

        const palette = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        applyDither(imageData, { palette, brightness: AppStore.state.brightness, contrast: AppStore.state.contrast });
        this.processingCtx.putImageData(imageData, 0, 0);

        const cCtx = this.compositionCtx;
        cCtx.imageSmoothingEnabled = false;
        cCtx.fillStyle = `rgb(${palette[3][0]},${palette[3][1]},${palette[3][2]})`;
        cCtx.fillRect(0, 0, 160, 144);
        cCtx.drawImage(this.processingCanvas, 0, 0, 160, 144);

        Frames.render(FRAMES[AppStore.state.frameIndex], cCtx, palette);
        Stamps.render(STAMPS[AppStore.state.stampIndex], cCtx, palette);

        // Ghost trail effect
        this.ctx.globalAlpha = 0.65;
        this.ctx.drawImage(this.compositionCanvas, 0, 0);
        this.ctx.globalAlpha = 1.0;

        this.drawOSD(this.ctx);
    }

    private drawOSD(ctx: CanvasRenderingContext2D) {
        const osd = AppStore.state.osd;
        if (!osd) return;

        const palette = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        const x = 20, y = 60, w = 120, h = 24;

        ctx.fillStyle = `rgb(${palette[0].join(',')})`;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = `rgb(${palette[2].join(',')})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

        ctx.fillStyle = `rgb(${palette[3].join(',')})`;
        ctx.font = '6px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(osd.label, 80, y + 8);

        const barX = x + 10, barW = w - 20, dots = 10;
        const active = Math.round(osd.value * dots);
        for (let i = 0; i < dots; i++) {
            ctx.fillStyle = i < active ? `rgb(${palette[3].join(',')})` : `rgb(${palette[1].join(',')})`;
            ctx.fillRect(barX + i * (barW / dots), y + 14, barW / dots - 2, 4);
        }
    }

    takePhoto() {
        this.isFrozen = true;
        const dataUrl = this.canvas.toDataURL('image/png');
        const rawArray = this.lastRawData ? Array.from(this.lastRawData) : undefined;
        const photo = PhotoStore.savePhoto(dataUrl, rawArray);
        setTimeout(() => { this.isFrozen = false; }, 1000);
        return photo;
    }
}
