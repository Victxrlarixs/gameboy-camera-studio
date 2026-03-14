export function setupPrinterLogic() {
    window.addEventListener("gb-print-start", (e: any) => {
        const { dataUrl } = e.detail;
        const printer = document.getElementById("gb-printer");
        const paper = document.getElementById("printer-paper-roll");
        const img = document.getElementById("printer-photo") as HTMLImageElement;
        const burnLine = document.getElementById("printer-burn-line");
        const led = document.getElementById("printer-led");
        const btnCut = document.getElementById("btn-cut");
        const returnBtn = document.getElementById("btn-feed");
        const overlay = document.getElementById("thermal-preview-overlay");
        const previewImg = document.getElementById("preview-image") as HTMLImageElement;
        const confirmBtn = document.getElementById("confirm-download-btn");
        const cancelBtn = document.getElementById("cancel-preview-btn");

        if (printer && paper && img && led) {
            const now = new Date();
            const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const dateLabel = document.getElementById("printer-date");
            const previewDateLabel = document.getElementById("preview-date");
            if (dateLabel) dateLabel.innerText = dateStr;
            if (previewDateLabel) previewDateLabel.innerText = dateStr;

            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            if (!AudioContextClass) return;
            const audioCtx = new AudioContextClass();

            const playSound = (freq: number, type: OscillatorType, duration: number, volume: number) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gain.gain.setValueAtTime(volume, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            };

            const playMotor = () => {
                const noise = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                noise.type = "sawtooth";
                noise.frequency.setValueAtTime(40, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                noise.connect(gain);
                gain.connect(audioCtx.destination);
                noise.start();
                return { noise, gain };
            };

            paper.style.transition = "none";
            paper.style.height = "0px";
            paper.classList.remove("animate-tear", "printing-vibration");
            img.src = dataUrl;
            img.classList.remove("active");
            if (burnLine) {
                burnLine.classList.remove("active");
                burnLine.style.transition = "none";
                burnLine.style.top = "0%";
            }

            if (overlay) {
                overlay.classList.add("opacity-0", "pointer-events-none", "scale-95");
                overlay.classList.remove("opacity-100", "scale-100");
            }

            void paper.offsetHeight;
            paper.style.transition = "height 5000ms cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s ease-out";

            const handleCut = (e: MouseEvent) => {
                e.stopPropagation();
                if (paper.classList.contains("animate-tear")) return; // Prevent double cut

                playSound(800, "square", 0.1, 0.1);
                playSound(400, "sawtooth", 0.15, 0.05);
                paper.classList.add("animate-tear");
                paper.classList.remove("printing-vibration");
                paper.style.cursor = "default";

                const ticketDrop = document.getElementById("ticket-drop");
                setTimeout(() => {
                    if (previewImg) previewImg.src = dataUrl;
                    if (overlay) {
                        overlay.classList.remove("opacity-0", "pointer-events-none");
                        overlay.classList.add("opacity-100");
                    }
                    if (ticketDrop) {
                        ticketDrop.classList.remove("translate-y-[-20px]", "opacity-0");
                        ticketDrop.classList.add("translate-y-0", "opacity-100");
                    }
                }, 400);
            };

            if (btnCut) btnCut.onclick = handleCut;
            paper.onclick = handleCut;
            paper.style.cursor = "pointer";

            const hideOverlay = () => {
                const ticketDrop = document.getElementById("ticket-drop");
                if (ticketDrop) {
                    ticketDrop.classList.add("translate-y-[-20px]", "opacity-0");
                    ticketDrop.classList.remove("translate-y-0", "opacity-100");
                }
                if (overlay) {
                    overlay.classList.add("opacity-0", "pointer-events-none");
                    overlay.classList.remove("opacity-100");
                }
            };

            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    const upscaleFactor = 8;
                    const tempCanvas = document.createElement("canvas");
                    const tempCtx = tempCanvas.getContext("2d")!;
                    const sourceImg = new Image();
                    sourceImg.onload = () => {
                        tempCanvas.width = sourceImg.width * upscaleFactor;
                        tempCanvas.height = sourceImg.height * upscaleFactor;
                        tempCtx.imageSmoothingEnabled = false;
                        tempCtx.drawImage(sourceImg, 0, 0, tempCanvas.width, tempCanvas.height);
                        const link = document.createElement("a");
                        link.download = `gb-cam-studio-${Date.now()}.png`;
                        link.href = tempCanvas.toDataURL("image/png");
                        link.click();
                        hideOverlay();
                        setTimeout(() => window.dispatchEvent(new CustomEvent("gb-print-end")), 300);
                    };
                    sourceImg.src = dataUrl;
                };
            }

            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    playSound(600, "square", 0.1, 0.05);
                    hideOverlay();
                    window.dispatchEvent(new CustomEvent("gb-print-end"));
                };
            }

            if (returnBtn) {
                returnBtn.onclick = () => window.dispatchEvent(new CustomEvent("gb-print-end"));
            }

            led.style.backgroundColor = "#ff0000";
            led.style.boxShadow = "0 0 12px #ff0000, inset 0 0 4px rgba(255,255,255,0.5)";
            
            setTimeout(() => {
                const motor = playMotor();
                paper.style.height = "210px";
                paper.classList.add("printing-vibration");
                
                // Start thermal reveal
                img.classList.add("active");
                if (burnLine) {
                    void burnLine.offsetHeight;
                    burnLine.style.transition = "top 5000ms linear, opacity 0.3s";
                    burnLine.classList.add("active");
                    burnLine.style.top = "100%";
                }

                setTimeout(() => {
                    motor.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                    setTimeout(() => motor.noise.stop(), 100);
                    paper.classList.remove("printing-vibration");
                    if (burnLine) burnLine.classList.remove("active");
                    
                    // Change to Green when done printing
                    led.style.backgroundColor = "#00ff00";
                    led.style.boxShadow = "0 0 12px #00ff00, inset 0 0 4px rgba(255,255,255,0.5)";
                }, 5000);
            }, 600);

            setTimeout(() => {
                led.style.backgroundColor = "";
                led.style.boxShadow = "";
            }, 8000);
        }
    });
}
