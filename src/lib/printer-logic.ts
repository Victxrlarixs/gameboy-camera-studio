import { soundEngine } from "./sound-engine";

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
        const shareBtn = document.getElementById("share-photo-btn");

        if (!printer || !paper || !img || !led) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const dateLabel = document.getElementById("printer-date");
        const previewDateLabel = document.getElementById("preview-date");
        if (dateLabel) dateLabel.innerText = dateStr;
        if (previewDateLabel) previewDateLabel.innerText = dateStr;

        let motorInterval: any = null;
        const startMotor = () => { motorInterval = setInterval(() => soundEngine.play('motor-loop'), 200); };
        const stopMotor = () => { if (motorInterval) clearInterval(motorInterval); };

        let filename: string | null = null;
        const getFilename = () => {
            if (!filename) {
                const count = parseInt(localStorage.getItem('gb_camera_counter') || '1', 10);
                localStorage.setItem('gb_camera_counter', (count + 1).toString());
                filename = `gb_camera_${count.toString().padStart(3, '0')}.png`;
            }
            return filename;
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

        let isDragging = false;
        let startX = 0;
        const TEAR_THRESHOLD = 80;

        const executeTear = () => {
            if (paper.classList.contains("animate-tear")) return;
            isDragging = false;

            soundEngine.play('tear');
            soundEngine.play('tick');

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

        paper.addEventListener('pointerdown', (e: PointerEvent) => {
            if (paper.classList.contains("animate-tear")) return;
            isDragging = true;
            startX = e.clientX;
            paper.setPointerCapture(e.pointerId);
            paper.style.transition = "none";
        });

        paper.addEventListener('pointermove', (e: PointerEvent) => {
            if (!isDragging) return;
            const delta = e.clientX - startX;
            paper.style.transform = `translateX(${delta * 0.2}px) rotate(${(delta / TEAR_THRESHOLD) * 15}deg)`;
            if (Math.abs(delta) > TEAR_THRESHOLD) executeTear();
        });

        paper.addEventListener('pointerup', (e: PointerEvent) => {
            if (!isDragging) return;
            isDragging = false;
            paper.releasePointerCapture(e.pointerId);
            paper.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            paper.style.transform = "";
        });

        paper.addEventListener('pointercancel', (e: PointerEvent) => {
            if (!isDragging) return;
            isDragging = false;
            paper.releasePointerCapture(e.pointerId);
            paper.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            paper.style.transform = "";
        });

        if (btnCut) btnCut.onclick = () => executeTear();
        paper.style.cursor = "grab";

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

        const buildShareCanvas = (): Promise<HTMLCanvasElement> => new Promise(resolve => {
            const scale = 6, pad = 120, bottomPad = 300;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
            const source = new Image();
            source.onload = () => {
                const imgW = source.width * scale;
                const imgH = source.height * scale;
                canvas.width = imgW + pad * 2;
                canvas.height = imgH + pad + bottomPad;

                ctx.fillStyle = "#f4f4ec";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.shadowColor = "rgba(0,0,0,0.15)";
                ctx.shadowBlur = 20;
                ctx.shadowOffsetY = 10;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(pad, pad, imgW, imgH);
                ctx.shadowColor = "transparent";

                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(source, pad, pad, imgW, imgH);

                ctx.fillStyle = "#a8a8a0";
                ctx.font = "bold 24px monospace";
                ctx.textAlign = "center";
                ctx.letterSpacing = "4px";
                ctx.fillText("GAME BOY CAMERA STUDIO", canvas.width / 2, canvas.height - 120);

                ctx.fillStyle = "#b8b8b0";
                ctx.font = "18px monospace";
                ctx.fillText(new Date().toLocaleDateString().replace(/\//g, '.'), canvas.width / 2, canvas.height - 80);

                resolve(canvas);
            };
            source.src = dataUrl;
        });

        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                const canvas = await buildShareCanvas();
                const link = document.createElement("a");
                link.download = getFilename();
                link.href = canvas.toDataURL("image/png");
                link.click();
                hideOverlay();
                setTimeout(() => window.dispatchEvent(new CustomEvent("gb-print-end")), 300);
            };
        }

        if (shareBtn) {
            if (!navigator.share) shareBtn.style.opacity = "0.5";

            shareBtn.onclick = async () => {
                try {
                    soundEngine.play('click');
                    const canvas = await buildShareCanvas();
                    canvas.toBlob(async blob => {
                        if (!blob) return;
                        const file = new File([blob], getFilename(), { type: "image/png" });
                        if (navigator.share && navigator.canShare?.({ files: [file] })) {
                            await navigator.share({ title: "Game Boy Camera Photo", text: "Captured with Game Boy Camera Studio 📷", files: [file] });
                        } else {
                            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                            alert("Photo copied to clipboard!");
                        }
                    }, "image/png");
                } catch {
                    // share cancelled or failed
                }
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                soundEngine.play('click');
                hideOverlay();
                window.dispatchEvent(new CustomEvent("gb-print-end"));
            };
        }

        if (returnBtn) returnBtn.onclick = () => window.dispatchEvent(new CustomEvent("gb-print-end"));

        led.style.backgroundColor = "#ff0000";
        led.style.boxShadow = "0 0 12px #ff0000, inset 0 0 4px rgba(255,255,255,0.5)";

        setTimeout(() => {
            startMotor();
            paper.style.height = "210px";
            paper.classList.add("printing-vibration");
            img.classList.add("active");

            if (burnLine) {
                void burnLine.offsetHeight;
                burnLine.style.transition = "top 5000ms linear, opacity 0.3s";
                burnLine.classList.add("active");
                burnLine.style.top = "100%";
            }

            setTimeout(() => {
                stopMotor();
                paper.classList.remove("printing-vibration");
                if (burnLine) burnLine.classList.remove("active");
                paper.style.cursor = "grab";
                led.style.backgroundColor = "#00ff00";
                led.style.boxShadow = "0 0 12px #00ff00, inset 0 0 4px rgba(255,255,255,0.5)";
            }, 5000);
        }, 600);

        setTimeout(() => {
            led.style.backgroundColor = "";
            led.style.boxShadow = "";
        }, 8000);
    });
}
