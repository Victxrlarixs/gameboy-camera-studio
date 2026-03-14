import { PALETTES } from '../lib/dither';
import { soundEngine } from '../lib/sound-engine';
import type { SoundType } from '../lib/sound-engine';
import { Stamps } from '../features/stamps/stamp-registry';
import { Frames } from '../features/frames/frame-registry';

export type GBMode = 'SHOOT' | 'VIEW' | 'PRINT' | 'SPLASH';
export type GBSkin = 'DEFAULT' | 'TRANSPARENT';

interface State {
    mode: GBMode;
    skin: GBSkin;
    menuIndex: number;
    paletteName: string;
    brightness: number;
    contrast: number;
    stampIndex: number;
    frameIndex: number;
    facingMode: 'user' | 'environment';
    osd: { label: string, value: number, timeout: number } | null;
}

export const STAMPS = Stamps.getNames();
export const FRAMES = Frames.getNames();

export const AppStore = {
    state: {
        mode: 'SPLASH' as GBMode,
        skin: 'DEFAULT' as GBSkin,
        menuIndex: 0,
        paletteName: 'DMG',
        brightness: 0,
        contrast: 1,
        stampIndex: 0,
        frameIndex: 0,
        facingMode: 'user' as 'user' | 'environment',
        osd: null,
    } as State,

    setOSD(label: string, value: number) {
        if (this.state.osd?.timeout) clearTimeout(this.state.osd.timeout);
        const timeout = window.setTimeout(() => {
            this.state.osd = null;
            window.dispatchEvent(new CustomEvent('gb-state-change'));
        }, 2000);
        this.state.osd = { label, value, timeout };
        window.dispatchEvent(new CustomEvent('gb-state-change'));
    },
    handleInput(button: string): void {
        switch (this.state.mode) {
            case 'SPLASH':
                this.setMode('SHOOT');
                break;

            case 'SHOOT':
                if (button === 'a')      window.dispatchEvent(new CustomEvent('gb-input', { detail: { button: 'a' } }));
                if (button === 'select') this.cyclePalette();
                if (button === 'start')  this.setMode('VIEW');
                if (button === 'up')     this.adjustBrightness(0.1);
                if (button === 'down')   this.adjustBrightness(-0.1);
                if (button === 'left')   this.adjustContrast(-0.1);
                if (button === 'right')  this.adjustContrast(0.1);
                if (button === 'b')      this.cycleFrame();
                if (button === 'camera') this.toggleCamera();
                break;

            case 'VIEW':
                if (button === 'b' || button === 'start') this.setMode('SHOOT');
                if (button === 'a') {
                    // Possible future action: Print current photo in gallery
                    window.dispatchEvent(new CustomEvent('gb-input', { detail: { button: 'a' } }));
                }
                break;
        }

        window.dispatchEvent(new CustomEvent('gb-input', { detail: { button } }));
        window.dispatchEvent(new CustomEvent('gb-state-change'));
        
        // --- Specific Mechanical Sounds ---
        if (button === 'a') {
            this.playSound('button-a');
        } else if (button === 'b') {
            this.playSound('button-b');
        } else if (['up', 'down', 'left', 'right'].includes(button)) {
            this.playSound('dpad');
        } else {
            this.playSound('click');
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    },

    setMode(mode: GBMode): void {
        this.state.mode = mode;
        window.dispatchEvent(new CustomEvent('gb-mode-change', { detail: { mode } }));
        window.dispatchEvent(new CustomEvent('gb-state-change'));
    },

    cyclePalette(): void {
        const names = Object.keys(PALETTES);
        const currentIndex = names.indexOf(this.state.paletteName);
        this.state.paletteName = names[(currentIndex + 1) % names.length];
    },

    cycleStamp(dir: number): void {
        this.state.stampIndex = (this.state.stampIndex + dir + STAMPS.length) % STAMPS.length;
    },

    adjustBrightness(delta: number): void {
        this.state.brightness = Math.max(-1, Math.min(1, this.state.brightness + delta));
        this.setOSD('BRIGHT', (this.state.brightness + 1) / 2);
    },

    adjustContrast(delta: number): void {
        this.state.contrast = Math.max(0, Math.min(2, this.state.contrast + delta));
        this.setOSD('CONTRAST', this.state.contrast / 2);
    },

    cycleFrame(): void {
        this.state.frameIndex = (this.state.frameIndex + 1) % FRAMES.length;
        this.setOSD('FRAME', this.state.frameIndex / (FRAMES.length - 1));
    },

    playSound(type: SoundType): void {
        soundEngine.play(type);
    },

    toggleCamera(): void {
        this.state.facingMode = this.state.facingMode === 'user' ? 'environment' : 'user';
        window.dispatchEvent(new CustomEvent('gb-camera-toggle', { detail: { facingMode: this.state.facingMode } }));
        window.dispatchEvent(new CustomEvent('gb-state-change'));
        this.playSound('camera-swap');
    },

    toggleSkin(): void {
        this.state.skin = this.state.skin === 'DEFAULT' ? 'TRANSPARENT' : 'DEFAULT';
        window.dispatchEvent(new CustomEvent('gb-state-change'));
        this.playSound('mode');
    }
};
