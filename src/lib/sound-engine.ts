/**
 * Union of all playable sound identifiers in the system.
 */
export type SoundType = 'click' | 'shutter' | 'print' | 'save' | 'delete' | 'mode' | 'camera-swap' | 'boot';

/**
 * Contract for audio playback services.
 */
export interface ISoundEngine {
    /**
     * Plays a sound effect by identifier.
     * @param type - The sound to play.
     */
    play(type: SoundType): void;
}

/**
 * Synthesizes vintage Game Boy-style sound effects using the Web Audio API.
 * Each sound is composed of multiple layered oscillator and noise nodes
 * to approximate the character of DMG-era hardware audio.
 */
export class SoundEngine implements ISoundEngine {

    private audioCtx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private _volume: number = 0.5;

    public setVolume(vol: number) {
        this._volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setValueAtTime(this._volume, this.audioCtx.currentTime);
        }
    }

    private getContextAndDest(): { ctx: AudioContext, dest: AudioNode } | null {
        if (!this.audioCtx) {
            const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
            if (AudioCtx) {
                this.audioCtx = new AudioCtx();
                this.masterGain = this.audioCtx.createGain();
                this.masterGain.gain.value = this._volume;
                this.masterGain.connect(this.audioCtx.destination);
            }
        }
        if (this.audioCtx && this.masterGain) {
            return { ctx: this.audioCtx, dest: this.masterGain };
        }
        return null;
    }

    /**
     * Schedules a single oscillator note on the given audio context.
     *
     * @param ctx       - Active `AudioContext`.
     * @param freq      - Starting frequency in Hz.
     * @param oscType   - Oscillator waveform type.
     * @param startTime - Offset in seconds from `ctx.currentTime`.
     * @param duration  - Note duration in seconds.
     * @param vol       - Initial gain amplitude.
     * @param endFreq   - Optional target frequency for an exponential ramp.
     */
    private note(
        ctx: AudioContext,
        dest: AudioNode,
        freq: number,
        oscType: OscillatorType,
        startTime: number,
        duration: number,
        vol: number,
        endFreq?: number
    ): void {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        if (endFreq !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + startTime + duration);
        }
        gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration + 0.01);
    }

    /**
     * Schedules a band-pass filtered white noise burst on the given audio context.
     *
     * @param ctx       - Active `AudioContext`.
     * @param startTime - Offset in seconds from `ctx.currentTime`.
     * @param duration  - Noise duration in seconds.
     * @param vol       - Initial gain amplitude.
     */
    private noise(ctx: AudioContext, dest: AudioNode, startTime: number, duration: number, vol: number): void {
        const bufSize = ctx.sampleRate * duration;
        const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data    = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const src    = ctx.createBufferSource();
        const gain   = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type            = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value         = 0.8;
        src.buffer = buffer;
        gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        src.start(ctx.currentTime + startTime);
        src.stop(ctx.currentTime + startTime + duration + 0.01);
    }

    /**
     * Plays a sound effect by identifier.
     * Each type triggers a unique multi-layer synthesis patch.
     *
     * @param type - The sound effect to play.
     */
    play(type: SoundType): void {
        const result = this.getContextAndDest();
        if (!result) return;
        const { ctx, dest } = result;

        const n = (freq: number, t: OscillatorType, s: number, d: number, v: number, e?: number) =>
            this.note(ctx, dest, freq, t, s, d, v, e);

        switch (type) {
            case 'click':
                n(1200, 'square',   0,    0.04, 0.03, 200);
                n(600,  'square',   0.01, 0.03, 0.01);
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
                for (let i = 0; i < 8; i++) {
                    n(1800, 'square', i * 0.05, 0.02, 0.015, 900);
                }
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

            case 'camera-swap':
                n(150,  'sawtooth', 0,    0.15, 0.04, 300);
                n(400,  'square',   0,    0.05, 0.02);
                n(300,  'square',   0.08, 0.08, 0.02, 100);
                this.noise(ctx, dest, 0, 0.12, 0.02);
                break;

            case 'boot':
                // Classic GB boot "pling"
                n(1046, 'square', 0,    0.04, 0.04); // C6
                n(2093, 'square', 0.04, 0.2,  0.03); // C7
                break;
        }
    }
}

/** Singleton {@link SoundEngine} instance shared across the application. */
export const soundEngine = new SoundEngine();
