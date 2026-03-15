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

        if (printer && paper && img && led) {
            const now = new Date();
            const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const dateLabel = document.getElementById("printer-date");
            const previewDateLabel = document.getElementById("preview-date");
            if (dateLabel) dateLabel.innerText = dateStr;
            if (previewDateLabel) previewDateLabel.innerText = dateStr;

            let motorInterval: any = null;
            const startMotor = () => {
                motorInterval = setInterval(() => {
                    soundEngine.play('motor-loop');
                }, 200);
            };
            const stopMotor = () => {
                if (motorInterval) clearInterval(motorInterval);
            };

            let currentFileName: string | null = null;
            const getFilename = () => {
                if (!currentFileName) {
                    let count = parseInt(localStorage.getItem('gb_camera_counter') || '1', 10);
                    localStorage.setItem('gb_camera_counter', (count + 1).toString());
                    currentFileName = `gb_camera_${count.toString().padStart(3, '0')}.png`;
                }
                return currentFileName;
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
            let currentDeltaX = 0;
            const TEAR_THRESHOLD = 80;

            const handlePointerDown = (e: PointerEvent) => {
                if (paper.classList.contains("animate-tear")) return;
                isDragging = true;
                startX = e.clientX;
                paper.setPointerCapture(e.pointerId);
                paper.style.transition = "none";
            };

            const handlePointerMove = (e: PointerEvent) => {
                if (!isDragging) return;
                currentDeltaX = e.clientX - startX;
                
                // Visual feedback: tilt and shift paper
                const rotation = (currentDeltaX / TEAR_THRESHOLD) * 15;
                paper.style.transform = `translateX(${currentDeltaX * 0.2}px) rotate(${rotation}deg)`;
                
                if (Math.abs(currentDeltaX) > TEAR_THRESHOLD) {
                    executeTear();
                }
            };

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

            const handlePointerUp = (e: PointerEvent) => {
                if (!isDragging) return;
                isDragging = false;
                paper.releasePointerCapture(e.pointerId);
                
                // Spring back if not torn
                paper.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                paper.style.transform = "";
            };

            if (btnCut) btnCut.onclick = () => executeTear();
            
            paper.addEventListener('pointerdown', handlePointerDown);
            paper.addEventListener('pointermove', handlePointerMove);
            paper.addEventListener('pointerup', handlePointerUp);
            paper.addEventListener('pointercancel', handlePointerUp);
            
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

            const generateShareableImage = (): Promise<HTMLCanvasElement> => {
                return new Promise((resolve) => {
                    const upscaleFactor = 6;
                    const padding = 120;
                    const bottomPadding = 300;
                    
                    const tempCanvas = document.createElement("canvas");
                    const tempCtx = tempCanvas.getContext("2d")!;
                    const sourceImg = new Image();
                    sourceImg.onload = () => {
                        const imgW = sourceImg.width * upscaleFactor;
                        const imgH = sourceImg.height * upscaleFactor;
                        
                        // Frame dimensions
                        tempCanvas.width = imgW + (padding * 2);
                        tempCanvas.height = imgH + padding + bottomPadding;
                        
                        // Draw Thermal Paper Background
                        tempCtx.fillStyle = "#f4f4ec";
                        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                        
                        // Inner Drop Shadow / Bevel
                        tempCtx.shadowColor = "rgba(0,0,0,0.15)";
                        tempCtx.shadowBlur = 20;
                        tempCtx.shadowOffsetY = 10;
                        
                        // Draw Image Base (White/Black)
                        tempCtx.fillStyle = "#ffffff";
                        tempCtx.fillRect(padding, padding, imgW, imgH);
                        
                        // Draw the Game Boy Camera Pixel Art
                        tempCtx.imageSmoothingEnabled = false;
                        tempCtx.drawImage(sourceImg, padding, padding, imgW, imgH);
                        
                        // Reset shadow
                        tempCtx.shadowColor = "transparent";
                        
                        // Add Branding Text
                        tempCtx.fillStyle = "#a8a8a0";
                        tempCtx.font = "bold 24px monospace";
                        tempCtx.textAlign = "center";
                        tempCtx.letterSpacing = "4px";
                        tempCtx.fillText("GAME BOY CAMERA STUDIO", tempCanvas.width / 2, tempCanvas.height - 120);
                        
                        // Simulated Date format
                        const dateText = new Date().toLocaleDateString().replace(/\//g, '.');
                        tempCtx.fillStyle = "#b8b8b0";
                        tempCtx.font = "18px monospace";
                        tempCtx.fillText(dateText, tempCanvas.width / 2, tempCanvas.height - 80);

                        resolve(tempCanvas);
                    };
                    sourceImg.src = dataUrl;
                });
            };

            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    const canvas = await generateShareableImage();
                    const link = document.createElement("a");
                    link.download = getFilename();
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                    hideOverlay();
                    setTimeout(() => window.dispatchEvent(new CustomEvent("gb-print-end")), 300);
                };
            }

            if (shareBtn) {
                // If Web Share API is not available, maybe fallback to copy, but for now just hide/disable or trust the device
                if (!navigator.share) {
                    shareBtn.style.opacity = "0.5";
                }
                
                shareBtn.onclick = async () => {
                    try {
                        soundEngine.play('click');
                        const canvas = await generateShareableImage();
                        canvas.toBlob(async (blob) => {
                            if (!blob) return;
                            const file = new File([blob], getFilename(), { type: "image/png" });
                            
                            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                    title: "Game Boy Camera Photo",
                                    text: "Captured with Game Boy Camera Studio \ud83d\udcf7",
                                    files: [file]
                                });
                            } else {
                                // Fallback: Copy to clipboard if Share API not fully supported
                                await navigator.clipboard.write([
                                    new ClipboardItem({ "image/png": blob })
                                ]);
                                alert("Photo copied to clipboard!");
                            }
                        }, "image/png");
                    } catch (err) {
                        console.error("Error sharing sequence:", err);
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

            if (returnBtn) {
                returnBtn.onclick = () => window.dispatchEvent(new CustomEvent("gb-print-end"));
            }

            led.style.backgroundColor = "#ff0000";
            led.style.boxShadow = "0 0 12px #ff0000, inset 0 0 4px rgba(255,255,255,0.5)";
            
            setTimeout(() => {
                startMotor();
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
                    stopMotor();
                    paper.classList.remove("printing-vibration");
                    if (burnLine) burnLine.classList.remove("active");
                    paper.style.cursor = "grab";
                    
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
