import { PhotoStore } from "../store/photos";
import type { Photo } from "../store/photos";
import { AppStore } from "../store/app";

export function setupLabBookLogic() {
    const overlay = document.getElementById('lab-book-overlay');
    const grid = document.getElementById('lab-grid');
    const closeBtn = document.getElementById('close-lab-book');
    const detailsPanel = document.getElementById('photo-details-panel');
    const storageDots = document.getElementById('lab-storage-dots');

    let selectedId: string | null = null;

    function renderGallery() {
        if (!grid || !storageDots) return;
        const photos = PhotoStore.getPhotos();

        storageDots.querySelectorAll('div').forEach((dot, i) => {
            dot.className = i < photos.length
                ? "w-2 h-2 rounded-full bg-[#302080] shadow-[0_0_5px_rgba(48,32,128,0.4)]"
                : "w-2 h-2 rounded-full bg-black/5 border border-black/5";
        });

        if (photos.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full h-64 flex flex-col items-center justify-center opacity-30 grayscale border-2 border-dashed border-black/10 rounded-xl">
                    <svg class="w-12 h-12 mb-4 text-[#302080]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span class="text-[10px] font-pixel uppercase tracking-widest">No Gallery Photos Found</span>
                </div>
            `;
            resetDetails();
            return;
        }

        grid.innerHTML = photos.map(photo => `
            <div class="lab-photo-card p-3 flex flex-col items-center gap-3 cursor-pointer ${selectedId === photo.id ? 'selected' : ''}" data-id="${photo.id}">
                <div class="w-full aspect-square relative bg-zinc-100 p-1 flex items-center justify-center overflow-hidden">
                    <img src="${photo.dataUrl}" alt="Gallery photo ${photo.id}" class="w-full h-full object-cover pixelated shadow-sm" />
                    <div class="absolute inset-0 serreado-edge opacity-5 pointer-events-none"></div>
                </div>
                <div class="w-full flex justify-between items-center opacity-60">
                    <span class="text-[6px] font-pixel text-zinc-400">#${photo.id.substring(0,6).toUpperCase()}</span>
                    <span class="text-[6px] font-pixel text-zinc-500">${new Date(photo.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.lab-photo-card').forEach(card => {
            card.addEventListener('click', () => selectPhoto(card.getAttribute('data-id')));
        });
    }

    function selectPhoto(id: string | null) {
        selectedId = id;
        const photo = PhotoStore.getPhotos().find(p => p.id === id);

        if (!photo || !detailsPanel) {
            resetDetails();
            return;
        }

        AppStore.playSound('click');
        detailsPanel.classList.remove('opacity-40');
        renderGallery();

        const preview = document.getElementById('detail-preview') as HTMLImageElement;
        if (preview) {
            preview.src = photo.dataUrl;
            preview.classList.remove('opacity-20', 'grayscale');
        }

        const stamp = document.getElementById('detail-stamp');
        if (stamp) { stamp.classList.remove('hidden'); stamp.innerText = "SAVED"; }

        const metaId = document.getElementById('meta-id');
        const metaTime = document.getElementById('meta-time');
        const metaBright = document.getElementById('meta-bright');
        const metaContrast = document.getElementById('meta-contrast');
        const metaPalette = document.getElementById('meta-palette');

        if (metaId) metaId.innerText = photo.id.toUpperCase();
        if (metaTime) metaTime.innerText = new Date(photo.timestamp).toLocaleString();
        if (photo.metadata) {
            if (metaBright) metaBright.innerText = (photo.metadata.brightness * 10).toFixed(0);
            if (metaContrast) metaContrast.innerText = (photo.metadata.contrast * 5).toFixed(0);
            if (metaPalette) metaPalette.innerText = photo.metadata.paletteName + " / " + photo.metadata.frameName;
        }
    }

    function resetDetails() {
        if (!detailsPanel) return;
        detailsPanel.classList.add('opacity-40');
        const preview = document.getElementById('detail-preview') as HTMLImageElement;
        if (preview) {
            preview.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            preview.classList.add('opacity-20', 'grayscale');
        }
    }

    document.getElementById('btn-lab-print')?.addEventListener('click', () => {
        if (!selectedId) return;
        const photo = PhotoStore.getPhotos().find(p => p.id === selectedId);
        if (photo) {
            window.dispatchEvent(new CustomEvent('gb-print-start', { detail: { dataUrl: photo.dataUrl } }));
            AppStore.setMode('SHOOT');
        }
    });

    document.getElementById('btn-lab-redevelop')?.addEventListener('click', async () => {
        if (!selectedId) return;
        const photo = PhotoStore.getPhotos().find(p => p.id === selectedId);
        if (!photo?.rawData) {
            alert("This photo lacks raw data for re-development. Only new captures support this feature.");
            return;
        }

        AppStore.playSound('click');

        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 144;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;

        const imgData = ctx.createImageData(128, 112);
        photo.rawData.forEach((val, i) => {
            const idx = i * 4;
            imgData.data[idx] = imgData.data[idx + 1] = imgData.data[idx + 2] = val;
            imgData.data[idx + 3] = 255;
        });

        const { applyDither, PALETTES } = await import("./dither");
        const { FRAMES } = await import("../store/app");

        applyDither(imgData, {
            palette: PALETTES[AppStore.state.paletteName],
            brightness: AppStore.state.brightness,
            contrast: AppStore.state.contrast
        });

        const ditherCanvas = document.createElement('canvas');
        ditherCanvas.width = 128;
        ditherCanvas.height = 112;
        ditherCanvas.getContext('2d')!.putImageData(imgData, 0, 0);

        const palette = PALETTES[AppStore.state.paletteName];
        ctx.fillStyle = `rgb(${palette[3].join(',')})`;
        ctx.fillRect(0, 0, 160, 144);
        ctx.drawImage(ditherCanvas, 16, 16);

        const { Frames } = await import("../features/frames/frame-registry");
        Frames.render(FRAMES[AppStore.state.frameIndex], ctx, palette);

        PhotoStore.updatePhoto(selectedId, {
            dataUrl: canvas.toDataURL('image/png'),
            metadata: {
                brightness: AppStore.state.brightness,
                contrast: AppStore.state.contrast,
                paletteName: AppStore.state.paletteName,
                frameName: FRAMES[AppStore.state.frameIndex]
            }
        });

        AppStore.playSound('mode');
        selectPhoto(selectedId);
    });

    document.getElementById('btn-lab-delete')?.addEventListener('click', () => {
        if (!selectedId) return;
        AppStore.playSound('delete');
        PhotoStore.deletePhoto(selectedId);
        selectedId = null;
        renderGallery();
        resetDetails();
    });

    window.addEventListener('gb-mode-change', (e: any) => {
        if (e.detail.mode === 'VIEW') {
            renderGallery();
            AppStore.playSound('mode');
            overlay?.classList.remove('opacity-0', 'pointer-events-none');
            overlay?.classList.add('opacity-100');
        } else {
            overlay?.classList.add('opacity-0', 'pointer-events-none');
            overlay?.classList.remove('opacity-100');
        }
    });

    window.addEventListener('gb-photo-saved', () => {
        if (AppStore.state.mode === 'VIEW') renderGallery();
    });

    window.addEventListener('gb-photo-deleted', renderGallery);

    closeBtn?.addEventListener('click', () => {
        AppStore.playSound('click');
        AppStore.setMode('SHOOT');
    });
}
