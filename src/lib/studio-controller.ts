import { AppStore } from "../store/app";
import { PhotoStore } from "../store/photos";
import { PALETTES } from "./dither";

/**
 * StudioController
 * Orchestrates the Studio Side Panel UI. Manages image development parameters,
 * film stock selection, and the physical presentation of the lab roll.
 */
export class StudioController {
    private brightnessInput: HTMLInputElement | null = null;
    private contrastInput: HTMLInputElement | null = null;
    private contrastVal: HTMLElement | null = null;
    private paletteGrid: HTMLElement | null = null;
    private frameGrid: HTMLElement | null = null;
    private recentPhotos: HTMLElement | null = null;

    constructor() {
        this.initElements();
        this.setupBindings();
        this.populatePalettes();
        this.populateFrames();
        this.registerGlobalEvents();
    }

    /**
     * Grabs references to the static panel elements.
     */
    private initElements(): void {
        this.brightnessInput = document.getElementById('input-brightness') as HTMLInputElement;
        this.contrastInput = document.getElementById('input-contrast') as HTMLInputElement;
        this.contrastVal = document.getElementById('val-contrast');
        this.paletteGrid = document.getElementById('palette-grid');
        this.frameGrid = document.getElementById('frame-grid');
        this.recentPhotos = document.getElementById('recent-photos');
    }

    /**
     * Sets up local event listeners for panel controls.
     */
    private setupBindings(): void {
        this.brightnessInput?.addEventListener('input', (e) => {
            AppStore.state.brightness = parseFloat((e.target as HTMLInputElement).value);
            this.dispatchStateChange();
        });

        this.contrastInput?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            AppStore.state.contrast = val;
            if (this.contrastVal) this.contrastVal.innerText = val.toFixed(1);
            this.dispatchStateChange();
        });
    }

    /**
     * Generates the selection grid for available film stocks (palettes).
     */
    private populatePalettes(): void {
        if (!this.paletteGrid) return;
        this.paletteGrid.innerHTML = '';

        Object.keys(PALETTES).forEach(name => {
            const btn = this.createPaletteButton(name);
            this.paletteGrid?.appendChild(btn);
        });
    }

    /**
     * Creates a styled button for a specific film stock.
     * @param name Name of the palette
     * @returns Structured button element
     */
    private createPaletteButton(name: string): HTMLButtonElement {
        const btn = document.createElement('button');
        const colors = (PALETTES as any)[name];
        
        btn.className = `p-2 matte-plastic border-2 border-black/20 shadow-sm hover:translate-y-[-1px] active:translate-y-[1px] transition-all flex flex-col gap-2 items-center group rounded-sm ${AppStore.state.paletteName === name ? 'border-[#302080] bg-[#cfcecb]' : ''}`;
        
        const colorStrip = document.createElement('div');
        colorStrip.className = 'flex w-full h-4 rounded-xs overflow-hidden border border-black/40 shadow-inner';
        colors.forEach((c: number[]) => {
            const dot = document.createElement('div');
            dot.style.backgroundColor = `rgb(${c.join(',')})`;
            dot.className = 'flex-1';
            colorStrip.appendChild(dot);
        });

        const label = document.createElement('span');
        label.className = 'text-[7px] font-pixel text-[#302080]/60 group-hover:text-[#302080]';
        label.innerText = name;

        btn.appendChild(colorStrip);
        btn.appendChild(label);
        
        btn.onclick = () => {
            AppStore.state.paletteName = name;
            AppStore.playSound('click');
            this.updatePaletteSelection();
            this.dispatchStateChange();
        };

        return btn;
    }

    private populateFrames(): void {
        if (!this.frameGrid) return;
        import('../store/app').then(({ FRAMES }) => {
            this.frameGrid!.innerHTML = '';
            FRAMES.forEach((name: string, index: number) => {
                const btn = this.createFrameButton(name, index);
                this.frameGrid?.appendChild(btn);
            });
        });
    }

    private createFrameButton(name: string, index: number): HTMLButtonElement {
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
            
            import('../store/app').then(({ FRAMES }) => {
                AppStore.setOSD('FRAME', index / (FRAMES.length - 1));
            });
            
            this.updateFrameSelection();
            this.dispatchStateChange();
        };

        return btn;
    }

    private updateFrameSelection(): void {
        const buttons = this.frameGrid?.querySelectorAll('button');
        buttons?.forEach((btn, idx) => {
            if (AppStore.state.frameIndex === idx) {
                btn.classList.add('border-[#302080]', 'bg-[#c4c3c0]', 'shadow-inner');
                btn.classList.remove('border-black/20');
            } else {
                btn.classList.remove('border-[#302080]', 'bg-[#c4c3c0]', 'shadow-inner');
                btn.classList.add('border-black/20');
            }
        });
    }

    /**
     * Visually highlights the currently selected film stock button.
     */
    private updatePaletteSelection(): void {
        const buttons = this.paletteGrid?.querySelectorAll('button');
        buttons?.forEach((btn, idx) => {
            const name = Object.keys(PALETTES)[idx];
            if (AppStore.state.paletteName === name) {
                btn.classList.add('border-[#302080]', 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]');
                btn.classList.remove('border-black/20');
            } else {
                btn.classList.remove('border-[#302080]', 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]');
                btn.classList.add('border-black/20');
            }
        });
    }

    /**
     * Subscribes to system-wide events relevant to the studio.
     */
    private registerGlobalEvents(): void {
        window.addEventListener('gb-photo-saved', () => this.renderRecentPhotos());
        window.addEventListener('gb-photo-deleted', () => this.renderRecentPhotos());
        window.addEventListener('gb-state-change', () => this.syncUI());
        
        // Make the buffer container clickable to open the Lab Book
        if (this.recentPhotos) {
            this.recentPhotos.parentElement?.addEventListener('click', () => {
                AppStore.setMode('VIEW');
                AppStore.playSound('click');
            });
            this.recentPhotos.parentElement?.classList.add('cursor-pointer');
        }

        this.renderRecentPhotos();
    }

    /**
     * Renders the most recent photos from the PhotoStore.
     */
    private renderRecentPhotos(): void {
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
            <div class="w-24 h-24 shrink-0 bg-black p-1 border border-white/10 relative flex flex-col items-center justify-center group cursor-pointer hover:border-[#a01050] transition-all overflow-hidden shadow-xl">
                <div class="absolute top-1 inset-x-0 flex justify-around opacity-20"><div class="w-1 h-3 bg-white"></div><div class="w-1 h-3 bg-white"></div><div class="w-1 h-3 bg-white"></div></div>
                <img src="${photo.dataUrl}" class="w-[85%] h-[85%] object-cover pixelated grayscale contrast-[1.4] shadow-2xl">
                <div class="absolute bottom-1 inset-x-0 flex justify-around opacity-20"><div class="w-1 h-3 bg-white"></div><div class="w-1 h-3 bg-white"></div><div class="w-1 h-3 bg-white"></div></div>
            </div>
        `).join('');
    }

    /**
     * Keeps the panel controls in sync with external state changes.
     */
    private syncUI(): void {
        if (this.brightnessInput) this.brightnessInput.value = AppStore.state.brightness.toString();
        if (this.contrastInput) this.contrastInput.value = AppStore.state.contrast.toString();
        if (this.contrastVal) this.contrastVal.innerText = AppStore.state.contrast.toFixed(1);
        this.updatePaletteSelection();
        this.updateFrameSelection();
        this.updateBrightnessDots();
    }

    private updateBrightnessDots(): void {
        const container = document.getElementById('brightness-dots');
        if (!container) return;
        const val = (AppStore.state.brightness + 1) / 2; // 0 to 1
        const dotsCount = 5;
        const activeDots = Math.round(val * dotsCount);
        
        container.innerHTML = '';
        for (let i = 0; i < dotsCount; i++) {
            const dot = document.createElement('div');
            dot.className = `w-1.5 h-1.5 rounded-full ${i < activeDots ? 'bg-[#a01050]' : 'bg-black/10'}`;
            container.appendChild(dot);
        }
    }

    /**
     * Notifies the rest of the system that a state change was initiated from this panel.
     */
    private dispatchStateChange(): void {
        window.dispatchEvent(new CustomEvent('gb-state-change'));
    }
}
