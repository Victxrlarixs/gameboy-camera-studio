import { PALETTES } from '../lib/dither';
import { soundEngine } from '../lib/sound-engine';
import type { SoundType } from '../lib/sound-engine';
import { Stamps } from '../features/stamps/stamp-registry';

export type GBMode = 'SHOOT' | 'VIEW' | 'PRINT' | 'SPLASH';



interface State {
    mode: GBMode;
    menuIndex: number;
    paletteName: string;
    brightness: number;
    contrast: number;
    stampIndex: number;
}

export const STAMPS = Stamps.getNames();

export const AppStore = {
    state: {
        mode: 'SPLASH' as GBMode,
        menuIndex: 0,
        paletteName: 'DMG',
        brightness: 0,
        contrast: 1,
        stampIndex: 0,
    } as State,

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
                if (button === 'left')   this.cycleStamp(-1);
                if (button === 'right')  this.cycleStamp(1);
                if (button === 'b') {
                    // Reset to defaults
                    this.state.brightness = 0;
                    this.state.stampIndex = 0;
                    this.playSound('click');
                }
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
        this.playSound('click');

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
    },

    playSound(type: SoundType): void {
        soundEngine.play(type);
    }
};
