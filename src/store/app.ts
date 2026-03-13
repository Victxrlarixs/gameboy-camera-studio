import { PALETTES } from '../lib/dither';

/** Valid operational modes for the Game Boy system */
export type GBMode = 'MENU' | 'SHOOT' | 'VIEW' | 'EDIT' | 'PLAY' | 'PRINT' | 'SPLASH';

/** Represents a selectable option in the system menu */
export interface MenuOption {
    label: string;
    mode: GBMode;
}

/** Predefined main menu structure */
export const MAIN_MENU: MenuOption[] = [
    { label: 'SHOOT', mode: 'SHOOT' },
    { label: 'VIEW', mode: 'VIEW' },
    { label: 'PLAY', mode: 'PLAY' }
];

/** Internal state structure for the application */
interface State {
    mode: GBMode;
    menuIndex: number;
    paletteName: string;
    brightness: number;
    contrast: number;
    stampIndex: number;
}

/** Available decorative stamps for camera mode */
export const STAMPS = ['NONE', 'HEART', 'STAR', 'SMILE', 'SKULL', 'FLOWER', 'GHOST'];

/**
 * Global Store following a simple pattern to manage the application state.
 * Dispatches custom events on window to notify systems of changes.
 */
export const AppStore = {
    /** Reactive state object */
    state: {
        mode: 'SPLASH' as GBMode,
        menuIndex: 0,
        paletteName: 'DMG',
        brightness: 0,
        contrast: 1,
        stampIndex: 0,
    },

    /**
     * Processes input from physical or virtual buttons.
     * @param button identifier of the pressed button
     */
    handleInput(button: string): void {
        switch (this.state.mode) {
            case 'SPLASH':
                this.setMode('SHOOT');
                break;

            case 'MENU':
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

        // Haptic Feedback for physical sensation
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    },

    /**
     * Updates the global operation mode.
     * @param mode destination mode
     */
    setMode(mode: GBMode): void {
        this.state.mode = mode;
        window.dispatchEvent(new CustomEvent('gb-mode-change', { detail: { mode } }));
        window.dispatchEvent(new CustomEvent('gb-state-change'));
    },

    /** Cycles through available color palettes */
    cyclePalette(): void {
        const names = Object.keys(PALETTES);
        const currentIndex = names.indexOf(this.state.paletteName);
        const nextIndex = (currentIndex + 1) % names.length;
        this.state.paletteName = names[nextIndex];
    },

    /**
     * Cycles through available camera stamps.
     * @param dir direction of cycling (1 or -1)
     */
    cycleStamp(dir: number): void {
        this.state.stampIndex = (this.state.stampIndex + dir + STAMPS.length) % STAMPS.length;
    },

    /**
     * Modifies the camera brightness exposure.
     * @param delta amount to shift brightness
     */
    adjustBrightness(delta: number): void {
        this.state.brightness = Math.max(-1, Math.min(1, this.state.brightness + delta));
    },

    /**
     * Generates vintage-style sound effects using the Web Audio API.
     * @param type the sound identifier
     */
    playSound(type: 'click' | 'shutter' | 'print'): void {
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
