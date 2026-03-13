import { PALETTES } from '../lib/dither';

export type GBMode = 'MENU' | 'SHOOT' | 'VIEW' | 'EDIT' | 'PLAY' | 'PRINT' | 'SPLASH';

export interface MenuOption {
    label: string;
    mode: GBMode;
}

export const MAIN_MENU: MenuOption[] = [
    { label: 'SHOOT', mode: 'SHOOT' },
    { label: 'VIEW', mode: 'VIEW' },
    { label: 'PLAY', mode: 'PLAY' }
];

interface State {
    mode: GBMode;
    menuIndex: number;
    paletteName: string;
    brightness: number;
    contrast: number;
    stampIndex: number;
}

export const STAMPS = ['NONE', 'HEART', 'STAR', 'SMILE', 'SKULL', 'FLOWER', 'GHOST'];

export const AppStore = {
    state: {
        mode: 'SPLASH' as GBMode,
        menuIndex: 0,
        paletteName: 'DMG',
        brightness: 0,
        contrast: 1,
        stampIndex: 0,
    },

    handleInput(button: string) {
        switch (this.state.mode) {
            case 'SPLASH':
                // Clicking anything during splash can potentially jump to camera
                this.setMode('SHOOT');
                break;

            case 'MENU':
                // If we ever end up here, just go back to shoot
                this.setMode('SHOOT');
                break;

            case 'SHOOT':
                if (button === 'select') this.cyclePalette();
                if (button === 'up') this.adjustBrightness(0.1);
                if (button === 'down') this.adjustBrightness(-0.1);
                if (button === 'left') this.cycleStamp(-1);
                if (button === 'right') this.cycleStamp(1);
                break;

            case 'VIEW':
                if (button === 'b') this.setMode('SHOOT');
                break;
        }

        window.dispatchEvent(new CustomEvent('gb-input', { detail: { button } }));
        window.dispatchEvent(new CustomEvent('gb-state-change'));
        this.playSound('click');
    },

    setMode(mode: GBMode) {
        this.state.mode = mode;
        window.dispatchEvent(new CustomEvent('gb-mode-change', { detail: { mode } }));
        window.dispatchEvent(new CustomEvent('gb-state-change'));
    },

    cyclePalette() {
        const names = Object.keys(PALETTES);
        const currentIndex = names.indexOf(this.state.paletteName);
        const nextIndex = (currentIndex + 1) % names.length;
        this.state.paletteName = names[nextIndex];
    },

    cycleStamp(dir: number) {
        this.state.stampIndex = (this.state.stampIndex + dir + STAMPS.length) % STAMPS.length;
    },

    adjustBrightness(delta: number) {
        this.state.brightness = Math.max(-1, Math.min(1, this.state.brightness + delta));
    },

    playSound(type: 'click' | 'shutter' | 'print') {
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'shutter') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        }
    }
};
