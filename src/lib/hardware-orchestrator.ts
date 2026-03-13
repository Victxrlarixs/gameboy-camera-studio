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

        // Animate Camera out
        this.cameraUnit.style.opacity = "0";
        this.cameraUnit.style.transform = "translateY(-600px) rotate(-20deg) scale(0.5)";
        this.cameraUnit.style.pointerEvents = "none";

        // Animate Printer in
        setTimeout(() => {
            if (this.printerUnit) {
                this.printerUnit.classList.remove("opacity-0", "translate-y-[300px]", "pointer-events-none");
                this.printerUnit.classList.add("opacity-100", "translate-y-0");
            }
        }, 400);
    }

    private handlePrintEnd(): void {
        setTimeout(() => {
            if (!this.cameraUnit || !this.printerUnit) return;

            // Animate Printer out
            this.printerUnit.classList.add("opacity-0", "translate-y-[300px]", "pointer-events-none");
            this.printerUnit.classList.remove("opacity-100", "translate-y-0");

            // Animate Camera back
            setTimeout(() => {
                if (this.cameraUnit) {
                    this.cameraUnit.style.opacity = "1";
                    this.cameraUnit.style.transform = "translateY(0) rotate(0) scale(1)";
                    this.cameraUnit.style.pointerEvents = "auto";
                }
            }, 500);
        }, 1000);
    }
}
