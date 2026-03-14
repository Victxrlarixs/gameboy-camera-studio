import { applyDither, PALETTES } from '../../lib/dither';
import { PhotoStore } from '../../store/photos';
import { AppStore, STAMPS, FRAMES } from '../../store/app';
import { Stamps } from '../stamps/stamp-registry';
import { Frames } from '../frames/frame-registry';

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
    private compositionCanvas: HTMLCanvasElement | null = null;
    private compositionCtx: CanvasRenderingContext2D | null = null;

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
            
            const videoConstraints: MediaTrackConstraints = {
                width: { ideal: 640 },
                height: { ideal: 480 }
            };
            
            if (facingMode) {
                videoConstraints.facingMode = { ideal: facingMode };
            }

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
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

    private lastRawData: number[] | null = null;

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

        this.processingCtx.imageSmoothingEnabled = false;
        this.processingCtx.drawImage(this.video, sx, sy, size, size, 0, 0, 128, 112);

        // Simulate the M64282FP's edge enhancement (Sharpening) efficiently
        this.processingCtx.globalCompositeOperation = 'overlay';
        this.processingCtx.globalAlpha = 0.2; 
        this.processingCtx.drawImage(this.processingCanvas, -1, -1, 128, 112);
        this.processingCtx.globalCompositeOperation = 'source-over';
        this.processingCtx.globalAlpha = 1.0;

        const imageData = this.processingCtx.getImageData(0, 0, 128, 112);
        
        // Optimize: Pre-allocate or extract raw data efficiently without frequent array allocations
        if (!this.lastRawData || this.lastRawData.length !== (128 * 112)) {
            this.lastRawData = new Array(128 * 112);
        }
        
        // Fast path for raw data capture (extract red channel as proxy for luminance before dithering)
        const rawPixels = imageData.data;
        for (let i = 0, j = 0; i < rawPixels.length; i += 4, j++) {
            this.lastRawData[j] = rawPixels[i];
        }

        const palette   = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;

        applyDither(imageData, {
            palette,
            brightness: AppStore.state.brightness,
            contrast:   AppStore.state.contrast
        });

        this.processingCtx.putImageData(imageData, 0, 0);

        if (!this.compositionCanvas) {
            this.compositionCanvas = document.createElement('canvas');
            this.compositionCanvas.width = 160;
            this.compositionCanvas.height = 144;
            this.compositionCtx = this.compositionCanvas.getContext('2d')!;
        }

        const compCtx = this.compositionCtx!;
        compCtx.imageSmoothingEnabled = false;

        // 1. Draw Background
        compCtx.fillStyle = `rgb(${palette[3].join(',')})`;
        compCtx.fillRect(0, 0, 160, 144);

        // 2. Draw Camera Feed (No smoothing, pure pixel)
        compCtx.drawImage(this.processingCanvas, 0, 0, 160, 144);

        // 3. Draw Frame Decorations
        this.drawFrameTo(compCtx);

        // 4. Draw Stamps
        this.drawStampsTo(compCtx);

        // 5. Final Composition to Main Canvas with GHOSTING
        this.ctx.globalAlpha = 0.65;
        this.ctx.drawImage(this.compositionCanvas, 0, 0);
        this.ctx.globalAlpha = 1.0;

        // 6. Draw OSD Overlays (Native to LCD)
        this.drawOSD(this.ctx);
    }

    private drawOSD(ctx: CanvasRenderingContext2D): void {
        const osd = AppStore.state.osd;
        if (!osd) return;

        const palette = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        const x = 20;
        const y = 60;
        const w = 120;
        const h = 24;

        // OSD Box
        ctx.fillStyle = `rgb(${palette[0].join(',')})`;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = `rgb(${palette[2].join(',')})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

        // Label
        ctx.fillStyle = `rgb(${palette[3].join(',')})`;
        ctx.font = '6px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(osd.label, 80, y + 8);

        // Bar (using dots)
        const barX = x + 10;
        const barY = y + 14;
        const barW = w - 20;
        const dots = 10;
        const activeDots = Math.round(osd.value * dots);

        for (let i = 0; i < dots; i++) {
            ctx.fillStyle = i < activeDots ? `rgb(${palette[3].join(',')})` : `rgb(${palette[1].join(',')})`;
            ctx.fillRect(barX + (i * (barW/dots)), barY, (barW/dots) - 2, 4);
        }
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
        const photo   = PhotoStore.savePhoto(dataUrl, this.lastRawData || undefined);
        setTimeout(() => { this.isFrozen = false; }, 1000);
        return photo;
    }

    private drawFrameTo(targetCtx: CanvasRenderingContext2D): void {
        const frameName = FRAMES[AppStore.state.frameIndex];
        const palette   = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        Frames.render(frameName, targetCtx, palette);
    }

    private drawStampsTo(targetCtx: CanvasRenderingContext2D): void {
        const stampName = STAMPS[AppStore.state.stampIndex];
        const palette   = PALETTES[AppStore.state.paletteName] || PALETTES.DMG;
        Stamps.render(stampName, targetCtx, palette);
    }
}
