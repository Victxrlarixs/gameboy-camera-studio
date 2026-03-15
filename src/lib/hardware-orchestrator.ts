export class HardwareOrchestrator {
    private cameraUnit: HTMLElement | null;
    private printerUnit: HTMLElement | null;
    private powerLed: HTMLElement | null;

    constructor() {
        this.cameraUnit = document.getElementById("camera-unit");
        this.printerUnit = document.getElementById("printer-unit");
        this.powerLed = document.getElementById("power-led");

        window.addEventListener("gb-mode-change", (e: any) => this.handleModeChange(e.detail.mode));
        window.addEventListener("gb-print-start", () => this.handlePrintStart());
        window.addEventListener("gb-print-end", () => this.handlePrintEnd());
    }

    private handleModeChange(mode: string) {
        if (mode === "SHOOT" && this.powerLed) {
            this.powerLed.classList.remove("bg-red-950");
            this.powerLed.classList.add("bg-red-600", "shadow-[0_0_12px_red]");
        }
    }

    private handlePrintStart() {
        if (!this.cameraUnit || !this.printerUnit) return;

        document.body.style.transition = "background-color 0.8s ease-in-out";
        document.body.style.backgroundColor = "#050505";
        document.querySelectorAll('.studio-panel, .manual-panel').forEach(p => (p as HTMLElement).style.opacity = "0.3");

        this.cameraUnit.style.transition = "transform 0.5s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.4s ease-out";
        this.cameraUnit.style.opacity = "0";
        this.cameraUnit.style.transform = "scale(0.92) translateX(-50px)";
        this.cameraUnit.style.pointerEvents = "none";

        setTimeout(() => {
            if (!this.printerUnit) return;
            this.printerUnit.style.transition = "transform 0.6s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.5s ease-out";
            this.printerUnit.classList.remove("opacity-0", "pointer-events-none");
            this.printerUnit.classList.add("opacity-100");
            this.printerUnit.style.transform = "scale(1)";
        }, 100);
    }

    private handlePrintEnd() {
        setTimeout(() => {
            if (!this.cameraUnit || !this.printerUnit) return;

            document.body.style.backgroundColor = "";
            document.querySelectorAll('.studio-panel, .manual-panel').forEach(p => (p as HTMLElement).style.opacity = "1");

            this.printerUnit.style.transform = "scale(0.92) translateX(50px)";
            this.printerUnit.classList.add("opacity-0", "pointer-events-none");
            this.printerUnit.classList.remove("opacity-100");

            setTimeout(() => {
                if (!this.cameraUnit) return;
                this.cameraUnit.style.opacity = "1";
                this.cameraUnit.style.transform = "scale(1) translateX(0)";
                this.cameraUnit.style.pointerEvents = "auto";
            }, 300);
        }, 600);
    }
}
