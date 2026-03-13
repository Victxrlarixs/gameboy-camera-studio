import { AppStore } from "../store/app";
import { CameraEngine } from "../features/camera/CameraEngine";

/**
 * DisplaySystem
 * Manages the LCD screen lifecycle, including rendering loops, camera integration, 
 * and operational UI overlays. Acts as a bridge between the raw canvas and the system state.
 */
export class DisplaySystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private uiOverlay: HTMLElement | null;
    private camera: CameraEngine | null = null;
    private lastSavedPhoto: any = null;
    private splashStep = 0;

    /**
     * @param canvasId The ID of the HTML canvas element for LCD rendering
     * @param uiOverlayId The ID of the HTML element containing UI labels
     */
    constructor(canvasId: string, uiOverlayId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d", { alpha: false })!;
        this.uiOverlay = document.getElementById(uiOverlayId);
        
        this.init();
    }

    /**
     * Initializes the rendering context and starts core system processes.
     */
    private init(): void {
        if (!this.ctx) return;
        this.ctx.imageSmoothingEnabled = false;
        
        this.registerEvents();
        this.startMainLoop();
        
        setTimeout(() => this.checkCameraPermission(), 4000);
    }

    /**
     * Subscribes to global system events.
     */
    private registerEvents(): void {
        window.addEventListener("gb-state-change", () => this.handleStateChange());
        window.addEventListener("gb-mode-change", (e: any) => this.handleModeChange(e.detail.mode));
        window.addEventListener("gb-input", (e: any) => this.handleInput(e.detail.button));
    }

    /**
     * Responds to generic state changes.
     */
    private handleStateChange(): void {
        if (AppStore.state.mode === "SHOOT") {
            this.updateShootUI();
        }
    }

    /**
     * Switches between active modes (e.g., Splash to Camera).
     * @param mode The new operational mode
     */
    private handleModeChange(mode: string): void {
        if (mode === "SHOOT") {
            this.startCamera();
        } else {
            this.stopCamera();
        }
    }

    /**
     * Internal input handler for screen-specific actions.
     * @param button The identifier of the action button
     */
    private handleInput(button: string): void {
        if (AppStore.state.mode === "SHOOT" && this.camera) {
            if (button === "a") {
                this.takePhoto();
            }
            if (button === "start" && this.lastSavedPhoto) {
                this.savePhoto();
            }
        }
    }

    /**
     * Initiates the high-frequency rendering loop for the LCD.
     */
    private startMainLoop(): void {
        const loop = () => {
            switch (AppStore.state.mode) {
                case "SPLASH":
                    this.renderSplash();
                    break;
                case "VIEW":
                    // Gallery rendering implementation pending
                    break;
            }
            if (AppStore.state.mode !== "SHOOT") {
                requestAnimationFrame(loop);
            }
        };
        requestAnimationFrame(loop);
    }

    /**
     * Renders the authentic boot sequence.
     */
    private renderSplash(): void {
        const { ctx } = this;
        ctx.fillStyle = "#9bbc0f";
        ctx.fillRect(0, 0, 160, 144);

        ctx.font = '12px "Press Start 2P"';
        ctx.fillStyle = "#0f380f";
        ctx.textAlign = "center";

        const y = Math.min(64, this.splashStep * 2.5);
        ctx.fillText("CAMERA", 80, y);

        if (this.splashStep > 35) {
            ctx.font = '8px "Press Start 2P"';
            ctx.fillText("STUDIO", 80, 85);
        }

        if (this.splashStep > 60) {
            ctx.font = '6px "Press Start 2P"';
            ctx.fillText("CAMERA STUDIO", 80, 100);
        }

        this.splashStep++;
        if (this.splashStep > 150 && AppStore.state.mode === "SPLASH") {
            AppStore.setMode("SHOOT");
        }
        this.uiOverlay?.classList.add("hidden");
    }

    /**
     * Synchronizes the LCD overlay labels with the current AppStore state.
     */
    private updateShootUI(): void {
        const elements = {
            tl: document.getElementById("ui-top-left"),
            tr: document.getElementById("ui-top-right"),
            bl: document.getElementById("ui-bottom-left"),
            br: document.getElementById("ui-bottom-right")
        };

        if (elements.tl) elements.tl.innerText = `BRIGHT:${(AppStore.state.brightness * 10).toFixed(0)}`;
        if (elements.tr) elements.tr.innerText = `${AppStore.state.paletteName} (SEL)`;
        if (elements.bl) elements.bl.innerText = "SEL: PALETTE";
        if (elements.br) elements.br.innerText = this.lastSavedPhoto ? "START: SAVE" : "A: SHOOT";

        this.uiOverlay?.classList.remove("hidden");
    }

    /**
     * Requests media stream access from the user.
     */
    private async checkCameraPermission(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((t) => t.stop());
            AppStore.setMode("SHOOT");
        } catch (e) {
            console.warn("Waiting for camera permission...");
        }
    }

    /**
     * Activates the camera engine.
     */
    private startCamera(): void {
        if (!this.camera) this.camera = new CameraEngine(this.canvas);
        this.camera.start();
    }

    /**
     * Deactivates the camera engine and returns control to the loop.
     */
    private stopCamera(): void {
        this.camera?.stop();
        this.camera = null;
        this.startMainLoop();
    }

    /**
     * Captures a frame from the camera and triggers the development sequence.
     */
    private takePhoto(): void {
        if (!this.camera) return;
        this.lastSavedPhoto = this.camera.takePhoto();
        AppStore.playSound("shutter");
        this.flashEffect();
        
        window.dispatchEvent(new CustomEvent("gb-print-start", {
            detail: { dataUrl: this.lastSavedPhoto.dataUrl },
        }));
        
        this.updateShootUI();
    }

    /**
     * Downloads the last captured frame to the user's device.
     */
    private savePhoto(): void {
        const link = document.createElement("a");
        link.download = `gb-cam-${Date.now()}.png`;
        link.href = this.lastSavedPhoto.dataUrl;
        link.click();
        this.lastSavedPhoto = null;
        this.updateShootUI();
    }

    /**
     * Simulates a hardware flash effect using an overlay.
     */
    private flashEffect(): void {
        const overlay = document.createElement("div");
        overlay.className = "absolute inset-0 bg-white z-[100] transition-opacity duration-200";
        this.canvas.parentElement?.appendChild(overlay);
        setTimeout(() => {
            overlay.style.opacity = "0";
            setTimeout(() => overlay.remove(), 200);
        }, 50);
    }
}
