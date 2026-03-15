import { AppStore } from '../store/app';

export function setupCartridgeLogic() {
    const eyeToggle = document.getElementById('camera-eye-toggle');
    const sphere = document.getElementById('camera-sphere');
    const cartridge = document.getElementById('gb-cartridge');

    if (!eyeToggle || !sphere || !cartridge) return;

    let isFlipping = false;
    let rotation = 0;

    eyeToggle.addEventListener('click', () => {
        if (isFlipping) return;
        isFlipping = true;

        AppStore.playSound('click');

        cartridge.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        cartridge.style.transform = 'translateY(-80px) rotateX(5deg) scale(1.02)';

        setTimeout(() => {
            rotation += 180;
            sphere.style.transform = `rotateY(${rotation}deg)`;
            AppStore.handleInput('camera');
        }, 250);

        setTimeout(() => {
            cartridge.style.transition = 'transform 0.3s cubic-bezier(0.32, 0, 0.67, 0)';
            cartridge.style.transform = 'translateY(0) rotateX(0deg) scale(1)';
        }, 750);

        setTimeout(() => {
            const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
            if (AudioCtx) {
                const audioCtx = new AudioCtx();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.1);
            }

            cartridge.classList.add('animate-impact');
            setTimeout(() => cartridge.classList.remove('animate-impact'), 400);
        }, 1050);

        setTimeout(() => { isFlipping = false; }, 1400);
    });
}
