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
            let newVol = Math.max(0, Math.min(1, currentVolume - deltaY * 0.01));
            if (newVol === currentVolume) return;

            currentVolume = newVol;
            soundEngine.setVolume(currentVolume);

            // tick every ~8px of wheel travel
            if (Math.abs(wheelRotation % 8) < Math.abs((wheelRotation + deltaY) % 8)) {
                soundEngine.play('tick');
            }

            wheelRotation += deltaY;
            grooves.style.transform = `translateY(${wheelRotation % 12}px)`;
            AppStore.setOSD('VOLUME', currentVolume);
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
        volumeWheel.addEventListener("wheel", (e) => { e.preventDefault(); updateVolume(e.deltaY * 0.1); });
    }

    const contrastWheel = document.getElementById("contrast-wheel");
    const contrastGrooves = document.getElementById("contrast-grooves");
    const lcdContainer = document.getElementById("lcd-container");

    if (contrastWheel && contrastGrooves && lcdContainer) {
        let isDragging = false;
        let startY = 0;
        let contrastState = 0.5;
        let wheelRotation = 0;

        const updateContrast = (deltaY: number) => {
            let newC = Math.max(0, Math.min(1, contrastState - deltaY * 0.01));
            if (newC === contrastState) return;

            contrastState = newC;
            AppStore.state.contrast = 0.5 + 1.5 * contrastState;
            window.dispatchEvent(new CustomEvent('gb-state-change'));

            if (Math.abs(wheelRotation % 8) < Math.abs((wheelRotation + deltaY) % 8)) {
                soundEngine.play('tick');
            }

            const brightness = 0.6 + 0.8 * (1 - contrastState);
            const contrast = 0.5 + 1.5 * contrastState;
            lcdContainer.style.filter = `brightness(${brightness}) contrast(${contrast})`;

            wheelRotation += deltaY;
            contrastGrooves.style.transform = `translateY(${wheelRotation % 12}px)`;
            AppStore.setOSD('CONTRAST', contrastState);
        };

        contrastWheel.addEventListener("pointerdown", (e) => {
            isDragging = true;
            startY = e.clientY;
            contrastWheel.setPointerCapture(e.pointerId);
        });

        contrastWheel.addEventListener("pointermove", (e) => {
            if (!isDragging) return;
            const deltaY = e.clientY - startY;
            startY = e.clientY;
            updateContrast(deltaY);
        });

        const stopDrag = (e: PointerEvent) => {
            isDragging = false;
            contrastWheel.releasePointerCapture(e.pointerId);
        };

        contrastWheel.addEventListener("pointerup", stopDrag);
        contrastWheel.addEventListener("pointercancel", stopDrag);
        contrastWheel.addEventListener("wheel", (e) => { e.preventDefault(); updateContrast(e.deltaY * 0.1); });
    }

    const hub = document.getElementById('hardware-hub');
    const glare = document.getElementById('lcd-glare');

    document.addEventListener('mousemove', (e) => {
        if (!hub || !glare) return;
        const mouseX = (e.clientX / window.innerWidth) - 0.5;
        const mouseY = (e.clientY / window.innerHeight) - 0.5;

        hub.style.transform = `rotateX(${mouseY * 15}deg) rotateY(${mouseX * -15}deg)`;
        glare.style.transform = `translate(${mouseX * 60}%, ${mouseY * 60}%) scale(1.8)`;
        glare.style.opacity = (0.1 + Math.abs(mouseX) * 0.2 + Math.abs(mouseY) * 0.2).toString();

        document.documentElement.style.setProperty('--light-x', `${mouseX * 100}%`);
        document.documentElement.style.setProperty('--light-y', `${mouseY * 100}%`);
        document.documentElement.style.setProperty('--shadow-x', `${-mouseX * 15}px`);
        document.documentElement.style.setProperty('--shadow-y', `${-mouseY * 15}px`);
    });

    window.addEventListener('load', () => {
        setTimeout(() => soundEngine.play('cartridge-in'), 1100); // synced with landAnim CSS
        setTimeout(() => soundEngine.play('boot'), 2200);
    });

    function autoScale() {
        const scalerEl = document.getElementById('hardware-scaler');
        const container = document.getElementById('perspective-container');
        if (!scalerEl || !container) return;

        const { width: availW, height: availH } = container.getBoundingClientRect();
        const isMobile = window.innerWidth < 1024;
        const vPadding = isMobile ? 120 : 200;

        let scale = Math.min((availW - 40) / 600, (availH - vPadding) / 1800);
        scale = Math.max(0.2, Math.min(1.0, scale));

        scalerEl.style.transition = 'none';
        scalerEl.style.transform = `scale(${scale})`;
        scalerEl.style.transformOrigin = 'center center';
        scalerEl.classList.remove('opacity-0');

        void scalerEl.offsetWidth;
        scalerEl.style.transition = 'transform 0.5s ease-out, opacity 0.3s ease-in-out';
    }

    window.addEventListener('resize', autoScale);
    window.addEventListener('load', autoScale);
    window.addEventListener('DOMContentLoaded', autoScale);
    autoScale();

    const chassis = document.getElementById('gb-chassis');
    const skinToggle = document.getElementById('hardware-skin-toggle');
    const sliderKnob = document.getElementById('skin-slider-knob');

    const syncSkin = () => {
        if (!chassis || !sliderKnob) return;
        const skin = AppStore.state.skin;
        chassis.setAttribute('data-skin', skin);
        sliderKnob.style.transform = skin === 'TRANSPARENT' ? 'translateX(-66px)' : 'translateX(0)';
    };

    skinToggle?.addEventListener('click', () => {
        AppStore.toggleSkin();
        syncSkin();
    });

    window.addEventListener('gb-state-change', syncSkin);
    syncSkin();
}
