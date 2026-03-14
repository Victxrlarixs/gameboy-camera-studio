import { soundEngine } from "./sound-engine";
import { HardwareOrchestrator } from "./hardware-orchestrator";
import { AppStore } from "../store/app";
export function setupGameBoyLogic() {
    new HardwareOrchestrator();

    const volumeWheel = document.getElementById("volume-wheel");
    const grooves = document.getElementById("volume-grooves");
    
    if (volumeWheel && grooves) {
        let isDragging = false;
        let startY = 0;
        let currentVolume = 0.5;
        let wheelRotation = 0;

        const updateVolume = (deltaY: number) => {
            let newVol = currentVolume - (deltaY * 0.01);
            newVol = Math.max(0, Math.min(1, newVol));
            
            if (newVol !== currentVolume) {
                currentVolume = newVol;
                soundEngine.setVolume(currentVolume);
                
                // Play tick every 8px of rotation
                if (Math.abs(wheelRotation % 8) < Math.abs((wheelRotation + deltaY) % 8)) {
                    soundEngine.play('tick');
                }

                wheelRotation += deltaY;
                grooves.style.transform = `translateY(${wheelRotation % 12}px)`;

                // Update OSD
                AppStore.setOSD('VOLUME', currentVolume);
            }
        };

        volumeWheel.addEventListener("pointerdown", (e) => {
            isDragging = true;
            startY = e.clientY;
            volumeWheel.setPointerCapture(e.pointerId);
        });

        volumeWheel.addEventListener("pointermove", (e) => {
            if (!isDragging) return;
            const deltaY = e.clientY - startY;
            startY = e.clientY;
            updateVolume(deltaY);
        });

        const stopDrag = (e: PointerEvent) => {
            isDragging = false;
            volumeWheel.releasePointerCapture(e.pointerId);
        };

        volumeWheel.addEventListener("pointerup", stopDrag);
        volumeWheel.addEventListener("pointercancel", stopDrag);
        
        volumeWheel.addEventListener("wheel", (e) => {
            e.preventDefault();
            updateVolume(e.deltaY * 0.1);
        });
    }

    const contrastWheel = document.getElementById("contrast-wheel");
    const contrastGrooves = document.getElementById("contrast-grooves");
    const lcdContainer = document.getElementById("lcd-container");

    if (contrastWheel && contrastGrooves && lcdContainer) {
        let isDraggingC = false;
        let startYC = 0;
        let currentContrastState = 0.5; 
        let wheelRotationC = 0;

        const updateContrast = (deltaY: number) => {
            let newC = currentContrastState - (deltaY * 0.01);
            newC = Math.max(0, Math.min(1, newC));
            
            if (newC !== currentContrastState) {
                currentContrastState = newC;
                
                // Sync internal system contrast
                AppStore.state.contrast = 0.5 + (1.5 * currentContrastState); 
                window.dispatchEvent(new CustomEvent('gb-state-change'));

                // Play tick
                if (Math.abs(wheelRotationC % 8) < Math.abs((wheelRotationC + deltaY) % 8)) {
                    soundEngine.play('tick');
                }

                // Adjust LCD physical appearance
                const brightnessAdjustment = 0.6 + (0.8 * (1 - currentContrastState)); 
                const filterContrast = 0.5 + (1.5 * currentContrastState); 
                lcdContainer.style.filter = `brightness(${brightnessAdjustment}) contrast(${filterContrast})`;
                
                wheelRotationC += deltaY;
                contrastGrooves.style.transform = `translateY(${wheelRotationC % 12}px)`;

                // Update OSD
                AppStore.setOSD('CONTRAST', currentContrastState);
            }
        };

        contrastWheel.addEventListener("pointerdown", (e) => {
            isDraggingC = true;
            startYC = e.clientY;
            contrastWheel.setPointerCapture(e.pointerId);
        });

        contrastWheel.addEventListener("pointermove", (e) => {
            if (!isDraggingC) return;
            const deltaY = e.clientY - startYC;
            startYC = e.clientY;
            updateContrast(deltaY);
        });

        const stopDragC = (e: PointerEvent) => {
            isDraggingC = false;
            contrastWheel.releasePointerCapture(e.pointerId);
        };

        contrastWheel.addEventListener("pointerup", stopDragC);
        contrastWheel.addEventListener("pointercancel", stopDragC);
        
        contrastWheel.addEventListener("wheel", (e) => {
            e.preventDefault();
            updateContrast(e.deltaY * 0.1);
        });
    }

    const hub = document.getElementById('hardware-hub');
    const glare = document.getElementById('lcd-glare');
    
    document.addEventListener('mousemove', (e) => {
        if (!hub || !glare) return;
        
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        
        // Percentages (-0.5 to 0.5)
        const mouseX = (e.clientX / winW) - 0.5;
        const mouseY = (e.clientY / winH) - 0.5;
        
        // Tilt depth
        const tiltX = mouseY * 15; 
        const tiltY = mouseX * -15;
        hub.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

        // Specular Glare (Moving reflecting light on screen)
        const glareX = mouseX * 60;
        const glareY = mouseY * 60;
        glare.style.transform = `translate(${glareX}%, ${glareY}%) scale(1.8)`;
        glare.style.opacity = (0.1 + Math.abs(mouseX) * 0.2 + Math.abs(mouseY) * 0.2).toString();

        // Dynamic Lighting Variables for CSS
        document.documentElement.style.setProperty('--light-x', `${mouseX * 100}%`);
        document.documentElement.style.setProperty('--light-y', `${mouseY * 100}%`);
        document.documentElement.style.setProperty('--shadow-x', `${-mouseX * 15}px`);
        document.documentElement.style.setProperty('--shadow-y', `${-mouseY * 15}px`);
    });

    window.addEventListener('load', () => {
        // High-fidelity entry: Cartridge landing impact + Boot sound
        setTimeout(() => {
            soundEngine.play('cartridge-in');
        }, 1100); // Sync with CSS landAnim (delay 0.4s + duration 0.7s)

        setTimeout(() => {
            soundEngine.play('boot');
        }, 2200); 
    });

    function autoScale() {
        const scalerEl = document.getElementById('hardware-scaler');
        if (!scalerEl) return;
        const container = document.getElementById('perspective-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const availableW = rect.width;
        const availableH = rect.height;
        
        const isMobile = window.innerWidth < 1024;
        const targetW = 600; 
        const targetH = 1800; 
        const vPadding = isMobile ? 120 : 200;
        const hPadding = 40;

        const scaleW = (availableW - hPadding) / targetW;
        const scaleH = (availableH - vPadding) / targetH;

        let finalScale = Math.min(scaleW, scaleH);
        if (finalScale > 1.0) finalScale = 1.0;
        if (finalScale < 0.2) finalScale = 0.2;

        scalerEl.style.transition = 'none';
        scalerEl.style.transform = `scale(${finalScale})`;
        scalerEl.style.transformOrigin = 'center center';
        scalerEl.classList.remove('opacity-0');
        
        void scalerEl.offsetWidth;
        scalerEl.style.transition = 'transform 0.5s ease-out, opacity 0.3s ease-in-out';
    }

    window.addEventListener('resize', autoScale);
    window.addEventListener('load', autoScale);
    window.addEventListener('DOMContentLoaded', autoScale);
    autoScale();
}
