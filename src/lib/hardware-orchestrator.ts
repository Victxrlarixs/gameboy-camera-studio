// Hardware Orchestrator

/**
 * Handles physical animations and state transitions between hardware units.
 */
export class HardwareOrchestrator {
    private cameraUnit: HTMLElement | null = null;
    private printerUnit: HTMLElement | null = null;
    private powerLed: HTMLElement | null = null;

    constructor() {
        this.initElements();
        this.registerEvents();
    }

    private initElements(): void {
        this.cameraUnit = document.getElementById("camera-unit");
        this.printerUnit = document.getElementById("printer-unit");
        this.powerLed = document.getElementById("power-led");
    }

    private registerEvents(): void {
        window.addEventListener("gb-mode-change", (e: any) => this.handleModeChange(e.detail.mode));
        window.addEventListener("gb-print-start", () => this.handlePrintStart());
        window.addEventListener("gb-print-end", () => this.handlePrintEnd());
    }

    private handleModeChange(mode: string): void {
        if (mode === "SHOOT" && this.powerLed) {
            this.powerLed.classList.remove("bg-red-950");
            this.powerLed.classList.add("bg-red-600", "shadow-[0_0_12px_red]");
        }
    }

    private handlePrintStart(): void {
        if (!this.cameraUnit || !this.printerUnit) return;

        // Animate Camera out (Clean fade and scale)
        this.cameraUnit.style.transition = "transform 0.4s ease-in-out, opacity 0.3s ease-out";
        this.cameraUnit.style.opacity = "0";
        this.cameraUnit.style.transform = "scale(0.95)";
        this.cameraUnit.style.pointerEvents = "none";

        // Animate Printer in (Perfectly Centered)
        setTimeout(() => {
            if (this.printerUnit) {
                this.printerUnit.style.transition = "transform 0.5s ease-out, opacity 0.4s ease-out";
                this.printerUnit.classList.remove("opacity-0", "pointer-events-none");
                this.printerUnit.classList.add("opacity-100");
                this.printerUnit.style.transform = "translateX(0) scale(1)";
            }
        }, 150);
    }

    private handlePrintEnd(): void {
        setTimeout(() => {
            if (!this.cameraUnit || !this.printerUnit) return;

            // Animate Printer out
            this.printerUnit.style.transform = "scale(0.95)";
            this.printerUnit.classList.add("opacity-0", "pointer-events-none");
            this.printerUnit.classList.remove("opacity-100");

            // Animate Camera back
            setTimeout(() => {
                if (this.cameraUnit) {
                    this.cameraUnit.style.opacity = "1";
                    this.cameraUnit.style.transform = "scale(1)";
                    this.cameraUnit.style.pointerEvents = "auto";
                }
            }, 300);
        }, 600);
    }
}
