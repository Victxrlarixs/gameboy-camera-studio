import { AppStore } from "../store/app";
import { CameraEngine } from "../features/camera/CameraEngine";

export class DisplaySystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private uiOverlay: HTMLElement | null;
    private camera: CameraEngine | null = null;
    private lastSavedPhoto: any = null;
    private splashStep = 0;
    private hasPlayedBootSound = false;
    private splashCanvas: HTMLCanvasElement | null = null;
    private mainLoopId: number | null = null;
    private lastOSD: { label: string, value: number } | null = null;
    private osdTimeout: number | null = null;

    constructor(canvasId: string, uiOverlayId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d", { alpha: false })!;
        this.uiOverlay = document.getElementById(uiOverlayId);
        this.init();
    }

    private init() {
        if (!this.ctx) return;
        this.ctx.imageSmoothingEnabled = false;

        window.addEventListener("gb-state-change", () => this.handleStateChange());
        window.addEventListener("gb-mode-change", (e: any) => this.handleModeChange(e.detail.mode));
        window.addEventListener("gb-input", (e: any) => this.handleInput(e.detail.button));
        window.addEventListener("gb-osd", (e: any) => {
            this.lastOSD = e.detail;
            if (this.osdTimeout) clearTimeout(this.osdTimeout);
            this.osdTimeout = window.setTimeout(() => { this.lastOSD = null; }, 2000);
        });

        this.startMainLoop();
        setTimeout(() => this.checkCameraPermission(), 4000);
    }

    private handleStateChange() {
        if (AppStore.state.mode === "SHOOT") this.updateShootUI();
    }

    private handleModeChange(mode: string) {
        mode === "SHOOT" ? this.startCamera() : this.stopCamera();
    }

    private handleInput(button: string) {
        if (AppStore.state.mode === "SHOOT" && this.camera && button === "a") {
            this.takePhoto();
        }
    }

    private startMainLoop() {
        if (this.mainLoopId) cancelAnimationFrame(this.mainLoopId);
        const loop = () => {
            if (AppStore.state.mode === "SPLASH") this.renderSplash();
            if (AppStore.state.mode !== "SHOOT") {
                this.mainLoopId = requestAnimationFrame(loop);
            } else {
                this.mainLoopId = null;
            }
        };
        this.mainLoopId = requestAnimationFrame(loop);
    }

    private renderSplash() {
        if (!this.splashCanvas) {
            this.splashCanvas = document.createElement('canvas');
            this.splashCanvas.width = 160;
            this.splashCanvas.height = 144;
            const sCtx = this.splashCanvas.getContext("2d", { alpha: false })!;

            sCtx.fillStyle = "#9bbc0f";
            sCtx.fillRect(0, 0, 160, 144);

            sCtx.fillStyle = "#0f380f";
            sCtx.textAlign = "center";
            sCtx.font = 'bold 16px "Press Start 2P"';
            sCtx.fillText("GAME BOY", 80, 70);

            sCtx.font = '7px "Press Start 2P"';
            const text = "Nintendo®";
            const boxW = sCtx.measureText(text).width + 10;
            sCtx.strokeStyle = "#0f380f";
            sCtx.lineWidth = 1;
            this.roundRect(sCtx, 80 - boxW / 2, 100, boxW, 14, 4);
            sCtx.stroke();
            sCtx.fillText(text, 80, 110);
        }

        this.ctx.drawImage(this.splashCanvas, 0, 0);

        if (this.splashStep === 60 && !this.hasPlayedBootSound) {
            AppStore.playSound('boot');
            this.hasPlayedBootSound = true;
        }

        this.splashStep++;
        if (this.splashStep > 180 && AppStore.state.mode === "SPLASH") {
            AppStore.setMode("SHOOT");
        }

        this.uiOverlay?.classList.add("hidden");
    }

    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    private updateShootUI() {
        const tl = document.getElementById("ui-top-left");
        const tr = document.getElementById("ui-top-right");
        const bl = document.getElementById("ui-bottom-left");
        const br = document.getElementById("ui-bottom-right");

        if (tl) tl.innerText = `BRIGHT:${(AppStore.state.brightness * 10).toFixed(0)}`;
        if (tr) tr.innerText = `CONTRAST:${(AppStore.state.contrast * 5).toFixed(0)}`;
        if (bl) bl.innerText = "SELECT: PALETTE";
        if (br) br.innerText = "B: FRAME | START: LAB";

        this.uiOverlay?.classList.remove("hidden");
    }

    private async checkCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(t => t.stop());
            if (AppStore.state.mode !== "SPLASH") AppStore.setMode("SHOOT");
        } catch {
            // user hasn't granted permission yet
        }
    }

    private startCamera() {
        if (!this.camera) this.camera = new CameraEngine(this.canvas);
        this.camera.start();
    }

    private stopCamera() {
        this.camera?.stop();
        this.camera = null;
        this.startMainLoop();
    }

    private takePhoto() {
        if (!this.camera) return;
        this.lastSavedPhoto = this.camera.takePhoto();
        AppStore.playSound("shutter");
        this.flashEffect();
        window.dispatchEvent(new CustomEvent("gb-print-start", { detail: { dataUrl: this.lastSavedPhoto.dataUrl } }));
        this.updateShootUI();
    }

    private flashEffect() {
        const overlay = document.createElement("div");
        overlay.className = "absolute inset-0 bg-white z-[100] transition-opacity duration-200";
        this.canvas.parentElement?.appendChild(overlay);
        setTimeout(() => {
            overlay.style.opacity = "0";
            setTimeout(() => overlay.remove(), 200);
        }, 50);
    }
}
