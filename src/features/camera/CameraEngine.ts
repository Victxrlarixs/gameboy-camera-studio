import { applyDither, PALETTES } from '../../lib/dither';
import { PhotoStore } from '../../store/photos';
import { AppStore, STAMPS } from '../../store/app';
import { Stamps } from '../stamps/stamp-registry';

/**
 * Drives the live camera feed, applying Bayer dithering and palette mapping
 * to produce a 160×144 Game Boy Camera-style display on an HTML canvas.
 * Manages the `getUserMedia` stream lifecycle and delegates stamp rendering
 * to the {@link Stamps} registry.
 */
export class CameraEngine {
    private video: HTMLVideoElement | null = null;
    private stream: MediaStream | null = null;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private processingCanvas: HTMLCanvasElement;
    private processingCtx: CanvasRenderingContext2D;
    private isFrozen = false;
    private animFrame: number | null = null;

    /**
     * @param targetCanvas - The visible LCD canvas element to render into.
     */
    constructor(targetCanvas: HTMLCanvasElement) {
        this.canvas = targetCanvas;
        this.ctx    = targetCanvas.getContext('2d')!;

        this.processingCanvas = document.createElement('canvas');
        this.processingCanvas.width  = 128;
        this.processingCanvas.height = 112;
        this.processingCtx = this.processingCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    /**
     * Requests camera access and starts the render loop.
     * Uses the front-facing camera (`facingMode: 'user'`).
     */
    async start(forceFacingMode?: 'user' | 'environment'): Promise<void> {
        try {
            const facingMode = forceFacingMode || AppStore.state.facingMode;
            this.stop(); // Stop existing stream if any
            
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode },
                audio: false
            });
            this.video           = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.play();
            this.isFrozen = false;
            this.loop();

            // Listen for camera toggle
            window.addEventListener('gb-camera-toggle', (e: any) => {
                this.start(e.detail.facingMode);
            }, { once: true }); // Re-bind on each start
        } catch (err) {
            console.error('Camera access denied:', err);
        }
    }

    /**
     * Stops the render loop and releases all `MediaStreamTrack` resources.
     */
    stop(): void {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        if (this.stream)    this.stream.getTracks().forEach(track => track.stop());
        this.video = null;
    }

    /**
     * Schedules the next render frame while in `SHOOT` mode.
     */
    private loop(): void {
        if (AppStore.state.mode !== 'SHOOT') return;
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    }

    /**
     * Captures a single video frame, applies dithering, draws it to the
     * display canvas, then overlays the decorative border and active stamp.
     */
    private render(): void {
        if (this.isFrozen || !this.video || this.video.videoWidth === 0) return;

        const vWidth  = this.video.videoWidth;
        const vHeight = this.video.videoHeight;
        const size    = Math.min(vWidth, vHeight);
        const sx      = (vWidth  - size) / 2;
        const sy      = (vHeight - size) / 2;

        this.processingCtx.drawImage(this.video, sx, sy, size, size, 0, 0, 128, 112);

        const imageData = this.processingCtx.getImageData(0, 0, 128, 112);
        const palette   = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;

        applyDither(imageData, {
            palette,
            brightness: AppStore.state.brightness,
            contrast:   AppStore.state.contrast
        });

        this.processingCtx.putImageData(imageData, 0, 0);

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.fillStyle = `rgb(${palette[3].join(',')})`;
        this.ctx.fillRect(0, 0, 160, 144);
        this.ctx.drawImage(this.processingCanvas, 0, 0, 160, 144);

        this.drawFrame();
        this.drawStamps();
    }

    /**
     * Freezes the display, persists the current frame to {@link PhotoStore},
     * and returns the saved {@link Photo} object.
     *
     * @returns The newly saved photo.
     */
    takePhoto() {
        this.isFrozen = true;
        const dataUrl = this.canvas.toDataURL('image/png');
        const photo   = PhotoStore.savePhoto(dataUrl);
        setTimeout(() => { this.isFrozen = false; }, 1000);
        return photo;
    }

    /**
     * Draws the palette-tinted border frame with decorative vent-style tick marks.
     */
    private drawFrame(): void {
        const palette    = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        const thickness  = 12;

        this.ctx.fillStyle = `rgb(${palette[0].join(',')})`;
        this.ctx.fillRect(0, 0,               160, thickness);
        this.ctx.fillRect(0, 144 - thickness, 160, thickness);
        this.ctx.fillRect(0, 0,               thickness, 144);
        this.ctx.fillRect(160 - thickness, 0, thickness, 144);

        this.ctx.fillStyle = `rgb(${palette[1].join(',')})`;
        for (let i = 20; i < 140; i += 10) {
            this.ctx.fillRect(i, 2,   2, 8);
            this.ctx.fillRect(i, 134, 2, 8);
        }
    }

    /**
     * Delegates rendering of the active overlay stamp to the {@link Stamps} registry.
     */
    private drawStamps(): void {
        const stampName = STAMPS[AppStore.state.stampIndex];
        const palette   = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        Stamps.render(stampName, this.ctx, palette);
    }
}
