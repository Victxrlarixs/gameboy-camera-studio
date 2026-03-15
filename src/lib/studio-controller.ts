import { AppStore } from "../store/app";
import { PhotoStore } from "../store/photos";
import { PALETTES } from "./dither";

export class StudioController {
    private brightnessInput: HTMLInputElement | null;
    private contrastInput: HTMLInputElement | null;
    private contrastVal: HTMLElement | null;
    private paletteGrid: HTMLElement | null;
    private frameGrid: HTMLElement | null;
    private recentPhotos: HTMLElement | null;

    constructor() {
        this.brightnessInput = document.getElementById('input-brightness') as HTMLInputElement;
        this.contrastInput = document.getElementById('input-contrast') as HTMLInputElement;
        this.contrastVal = document.getElementById('val-contrast');
        this.paletteGrid = document.getElementById('palette-grid');
        this.frameGrid = document.getElementById('frame-grid');
        this.recentPhotos = document.getElementById('recent-photos');

        this.brightnessInput?.addEventListener('input', (e) => {
            AppStore.state.brightness = parseFloat((e.target as HTMLInputElement).value);
            this.emit();
        });

        this.contrastInput?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            AppStore.state.contrast = val;
            if (this.contrastVal) this.contrastVal.innerText = val.toFixed(1);
            this.emit();
        });

        this.populatePalettes();
        this.populateFrames();

        window.addEventListener('gb-photo-saved', () => this.renderRecentPhotos());
        window.addEventListener('gb-photo-deleted', () => this.renderRecentPhotos());
        window.addEventListener('gb-state-change', () => this.syncUI());

        if (this.recentPhotos) {
            this.recentPhotos.parentElement?.addEventListener('click', () => {
                AppStore.setMode('VIEW');
                AppStore.playSound('click');
            });
            this.recentPhotos.parentElement?.classList.add('cursor-pointer');
        }

        this.renderRecentPhotos();
    }

    private populatePalettes() {
        if (!this.paletteGrid) return;
        this.paletteGrid.innerHTML = '';
        Object.keys(PALETTES).forEach(name => this.paletteGrid?.appendChild(this.makePaletteBtn(name)));
    }

    private makePaletteBtn(name: string): HTMLButtonElement {
        const btn = document.createElement('button');
        const colors = (PALETTES as any)[name];

        btn.className = `p-2 matte-plastic border-2 border-black/20 shadow-sm hover:translate-y-[-1px] active:translate-y-[1px] transition-all flex flex-col gap-2 items-center group rounded-sm ${AppStore.state.paletteName === name ? 'border-[#302080] bg-[#cfcecb]' : ''}`;

        const strip = document.createElement('div');
        strip.className = 'flex w-full h-4 rounded-xs overflow-hidden border border-black/40 shadow-inner';
        colors.forEach((c: number[]) => {
            const dot = document.createElement('div');
            dot.style.backgroundColor = `rgb(${c.join(',')})`;
            dot.className = 'flex-1';
            strip.appendChild(dot);
        });

        const label = document.createElement('span');
        label.className = 'text-[7px] font-pixel text-[#302080]/60 group-hover:text-[#302080]';
        label.innerText = name;

        btn.appendChild(strip);
        btn.appendChild(label);

        btn.onclick = () => {
            AppStore.state.paletteName = name;
            AppStore.playSound('click');
            this.refreshPaletteSelection();
            this.emit();
        };

        return btn;
    }

    private populateFrames() {
        if (!this.frameGrid) return;
        import('../store/app').then(({ FRAMES }) => {
            this.frameGrid!.innerHTML = '';
            FRAMES.forEach((name: string, i: number) => this.frameGrid?.appendChild(this.makeFrameBtn(name, i)));
        });
    }

    private makeFrameBtn(name: string, index: number): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.className = `min-w-[70px] h-[60px] p-2 bg-[#d1d0cd] border-2 border-black/20 rounded-md shadow-sm flex flex-col items-center justify-between group transition-all shrink-0 ${AppStore.state.frameIndex === index ? 'border-[#302080] shadow-inner bg-[#c4c3c0]' : ''}`;

        const preview = document.createElement('div');
        preview.className = 'w-full grow border border-black/20 rounded-xs mb-1 bg-white/50 flex items-center justify-center';
        preview.innerHTML = `<span class="text-[5px] font-pixel opacity-40">${name}</span>`;

        const label = document.createElement('span');
        label.className = 'text-[6px] font-pixel text-[#302080]/60 uppercase';
        label.innerText = name.substring(0, 10);

        btn.appendChild(preview);
        btn.appendChild(label);

        btn.onclick = () => {
            AppStore.state.frameIndex = index;
            AppStore.playSound('click');
            import('../store/app').then(({ FRAMES }) => AppStore.setOSD('FRAME', index / (FRAMES.length - 1)));
            this.refreshFrameSelection();
            this.emit();
        };

        return btn;
    }

    private refreshFrameSelection() {
        this.frameGrid?.querySelectorAll('button').forEach((btn, idx) => {
            const active = AppStore.state.frameIndex === idx;
            btn.classList.toggle('border-[#302080]', active);
            btn.classList.toggle('bg-[#c4c3c0]', active);
            btn.classList.toggle('shadow-inner', active);
            btn.classList.toggle('border-black/20', !active);
        });
    }

    private refreshPaletteSelection() {
        const names = Object.keys(PALETTES);
        this.paletteGrid?.querySelectorAll('button').forEach((btn, idx) => {
            const active = AppStore.state.paletteName === names[idx];
            btn.classList.toggle('border-[#302080]', active);
            btn.classList.toggle('shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]', active);
            btn.classList.toggle('border-black/20', !active);
        });
    }

    private renderRecentPhotos() {
        if (!this.recentPhotos) return;
        const photos = PhotoStore.getPhotos().slice(0, 5);

        if (photos.length === 0) {
            this.recentPhotos.innerHTML = `
                <div class="w-20 h-20 shrink-0 bg-black/40 border-2 border-[#1a1b1c] rounded-xs flex items-center justify-center relative shadow-lg">
                     <span class="text-[5px] font-pixel text-zinc-700 uppercase">Empty</span>
                     <div class="absolute inset-0 bg-white/5 pointer-events-none"></div>
                </div>
            `;
            return;
        }

        this.recentPhotos.innerHTML = photos.map(photo => `
            <div class="w-16 h-16 shrink-0 bg-white p-1 border-y-4 border-[#1a1b1c] relative flex flex-col items-center justify-center group cursor-pointer hover:scale-105 transition-all shadow-xl">
                <div class="absolute inset-y-0 left-0.5 w-1 flex flex-col justify-between py-1 opacity-20"><div class="w-1 h-1 bg-black rounded-full"></div><div class="w-1 h-1 bg-black rounded-full"></div><div class="w-1 h-1 bg-black rounded-full"></div></div>
                <img src="${photo.dataUrl}" alt="Recent photo thumbnail" class="w-full h-full object-cover pixelated shadow-sm">
                <div class="absolute inset-y-0 right-0.5 w-1 flex flex-col justify-between py-1 opacity-20"><div class="w-1 h-1 bg-black rounded-full"></div><div class="w-1 h-1 bg-black rounded-full"></div><div class="w-1 h-1 bg-black rounded-full"></div></div>
                <div class="absolute bottom-0 inset-x-0 bg-black/60 text-[4px] font-pixel text-white text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">#${photo.id.substring(0,4)}</div>
            </div>
        `).join('');
    }

    private syncUI() {
        if (this.brightnessInput) this.brightnessInput.value = AppStore.state.brightness.toString();
        if (this.contrastInput) this.contrastInput.value = AppStore.state.contrast.toString();
        if (this.contrastVal) this.contrastVal.innerText = AppStore.state.contrast.toFixed(1);
        this.refreshPaletteSelection();
        this.refreshFrameSelection();
        this.updateBrightnessDots();
    }

    private updateBrightnessDots() {
        const container = document.getElementById('brightness-dots');
        if (!container) return;
        const active = Math.round(((AppStore.state.brightness + 1) / 2) * 5);
        container.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const dot = document.createElement('div');
            dot.className = `w-1.5 h-1.5 rounded-full ${i < active ? 'bg-[#a01050]' : 'bg-black/10'}`;
            container.appendChild(dot);
        }
    }

    private emit() {
        window.dispatchEvent(new CustomEvent('gb-state-change'));
    }
}
