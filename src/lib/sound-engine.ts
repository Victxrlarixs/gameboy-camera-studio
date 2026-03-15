export type SoundType = 
    'click' | 'shutter' | 'print' | 'save' | 'delete' | 'mode' | 'camera-swap' | 'boot' | 'tick' |
    'button-a' | 'button-b' | 'dpad' | 'cartridge-in' | 'motor-loop' | 'tear';

export class SoundEngine {
    private audioCtx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private _volume = 0.5;
    private unlocked = false;

    constructor() {
        if (typeof window === 'undefined') return;
        const unlock = () => {
            this.unlocked = true;
            this.audioCtx?.state === 'suspended' && this.audioCtx.resume().catch(() => {});
            window.removeEventListener('mousedown', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('mousedown', unlock);
        window.addEventListener('touchstart', unlock);
        window.addEventListener('keydown', unlock);
    }

    setVolume(vol: number) {
        this._volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setValueAtTime(this._volume, this.audioCtx.currentTime);
        }
    }

    private ctx(): { ctx: AudioContext, dest: AudioNode } | null {
        if (!this.unlocked) return null;
        if (!this.audioCtx) {
            const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
            if (!Ctx) return null;
            this.audioCtx = new Ctx();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this._volume;
            this.masterGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume().catch(() => {});
        return this.masterGain ? { ctx: this.audioCtx, dest: this.masterGain } : null;
    }

    private note(
        ctx: AudioContext,
        dest: AudioNode,
        freq: number,
        type: OscillatorType,
        start: number,
        dur: number,
        vol: number,
        endFreq?: number
    ) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + start + dur);
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.01);
    }

    private noise(ctx: AudioContext, dest: AudioNode, start: number, dur: number, vol: number) {
        const bufSize = ctx.sampleRate * dur;
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.8;
        src.buffer = buffer;
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        src.start(ctx.currentTime + start);
        src.stop(ctx.currentTime + start + dur + 0.01);
    }

    play(type: SoundType) {
        const result = this.ctx();
        if (!result) return;
        const { ctx, dest } = result;

        const n = (freq: number, t: OscillatorType, s: number, d: number, v: number, e?: number) =>
            this.note(ctx, dest, freq, t, s, d, v, e);

        switch (type) {
            case 'click':
                n(1200, 'square', 0, 0.04, 0.03, 200);
                n(600,  'square', 0.01, 0.03, 0.01);
                break;

            case 'shutter':
                n(180,  'sawtooth', 0,    0.08, 0.12, 80);
                n(3200, 'square',   0,    0.03, 0.06, 400);
                n(900,  'square',   0.03, 0.06, 0.04, 200);
                this.noise(ctx, dest, 0, 0.06, 0.08);
                n(55,   'sine',     0,    0.1,  0.08);
                break;

            case 'print':
                n(42, 'sawtooth', 0, 0.4, 0.06);
                n(48, 'sawtooth', 0, 0.4, 0.04);
                for (let i = 0; i < 8; i++) n(1800, 'square', i * 0.05, 0.02, 0.015, 900);
                break;

            case 'save':
                n(523,  'square', 0,    0.1,  0.04);
                n(659,  'square', 0.1,  0.1,  0.04);
                n(784,  'square', 0.2,  0.15, 0.04);
                n(1047, 'square', 0.32, 0.2,  0.03);
                break;

            case 'delete':
                n(523, 'square', 0,    0.07, 0.04);
                n(392, 'square', 0.08, 0.07, 0.04);
                n(261, 'square', 0.16, 0.12, 0.04);
                break;

            case 'mode':
                n(440, 'square', 0,    0.06, 0.03);
                n(660, 'square', 0.07, 0.08, 0.03);
                break;

            case 'tear':
                this.noise(ctx, dest, 0, 0.1, 0.08);
                n(2500, 'square', 0, 0.05, 0.04, 1800);
                setTimeout(() => {
                    this.noise(ctx, dest, 0, 0.12, 0.06);
                    n(2200, 'square', 0, 0.06, 0.03, 1500);
                }, 50);
                break;

            case 'button-a':
                n(180, 'square', 0, 0.05, 0.04, 100);
                this.noise(ctx, dest, 0, 0.03, 0.02);
                break;

            case 'button-b':
                n(220, 'square', 0, 0.04, 0.04, 120);
                this.noise(ctx, dest, 0, 0.02, 0.02);
                break;

            case 'dpad':
                n(1400, 'square', 0,    0.02, 0.03, 800);
                n(700,  'square', 0.01, 0.02, 0.01);
                break;

            case 'cartridge-in':
                n(80,   'sawtooth', 0, 0.15, 0.1, 40);
                n(1200, 'square',   0, 0.04, 0.06, 200);
                this.noise(ctx, dest, 0, 0.1, 0.05);
                break;

            case 'motor-loop':
                n(45,   'sawtooth', 0, 0.2, 0.04);
                n(3200, 'square',   0, 0.1, 0.01, 3000);
                for (let i = 0; i < 4; i++) this.noise(ctx, dest, i * 0.05, 0.02, 0.03);
                break;

            case 'camera-swap':
                n(150, 'sawtooth', 0,    0.2,  0.08, 300);
                n(300, 'square',   0.05, 0.1,  0.04, 100);
                this.noise(ctx, dest, 0,   0.2,  0.03);
                this.noise(ctx, dest, 0.1, 0.15, 0.02);
                break;

            case 'boot':
                // GB boot pling
                n(1046, 'square', 0,    0.04, 0.04);
                n(2093, 'square', 0.04, 0.2,  0.03);
                break;

            case 'tick':
                n(2200, 'square', 0, 0.01, 0.02, 3000);
                break;
        }
    }
}

export const soundEngine = new SoundEngine();
