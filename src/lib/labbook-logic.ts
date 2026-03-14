import { PhotoStore } from "../store/photos";
import { AppStore } from "../store/app";

export function setupLabBookLogic() {
    const overlay = document.getElementById('lab-book-overlay');
    const grid = document.getElementById('lab-grid');
    const stats = document.getElementById('lab-storage-stats');
    const closeBtn = document.getElementById('close-lab-book');

    function renderGallery() {
        if (!grid || !stats) return;
        const photos = PhotoStore.getPhotos();
        stats.innerText = `${photos.length}/30`;

        if (photos.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full h-64 flex flex-col items-center justify-center opacity-30 grayscale">
                    <div class="w-24 h-24 mb-4 border-2 border-dashed border-[#302080] flex items-center justify-center">
                        <span class="text-[24px]">?</span>
                    </div>
                    <span class="text-[10px] font-pixel uppercase">No Lab Assets Detected</span>
                </div>
            `;
            return;
        }

        grid.innerHTML = photos.map(photo => `
            <div class="group relative bg-[#f4f4ec] p-3 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] border-x border-zinc-300 flex flex-col items-center gap-3 cursor-pointer lab-photo-card" data-id="${photo.id}">
                
                <div class="absolute -top-1 left-0 right-0 h-2 bg-[length:6px_6px]" style="background-image: linear-gradient(135deg, transparent 25%, #f4f4ec 25.5%, #f4f4ec 50%, transparent 50.5%), linear-gradient(225deg, transparent 25%, #f4f4ec 25.5%, #f4f4ec 50%, transparent 50.5%); background-repeat: repeat-x;"></div>
                
                <img src="${photo.dataUrl}" class="w-full aspect-square object-cover pixelated border border-black/5 shadow-inner" />
                
                <div class="w-full flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                    <span class="text-[6px] font-pixel text-zinc-500">${new Date(photo.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <button class="delete-photo-btn p-1 hover:text-red-600 transition-colors" data-id="${photo.id}">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>

                <div class="absolute inset-0 pointer-events-none opacity-[0.03] paper-grain"></div>
            </div>
        `).join('');

        grid.querySelectorAll('.lab-photo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if ((e.target as HTMLElement).closest('.delete-photo-btn')) return;
                const id = card.getAttribute('data-id');
                const photo = PhotoStore.getPhotos().find(p => p.id === id);
                if (photo) {
                    window.dispatchEvent(new CustomEvent('gb-print-start', { detail: { dataUrl: photo.dataUrl } }));
                    AppStore.setMode('SHOOT');
                }
            });
        });

        grid.querySelectorAll('.delete-photo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (id) {
                    AppStore.playSound('delete');
                    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                    PhotoStore.deletePhoto(id);
                }
            });
        });
    }

    window.addEventListener('gb-mode-change', (e: any) => {
        if (e.detail.mode === 'VIEW') {
            renderGallery();
            AppStore.playSound('mode');
            overlay?.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            overlay?.classList.add('opacity-100', 'scale-100');
        } else {
            overlay?.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            overlay?.classList.remove('opacity-100', 'scale-100');
        }
    });

    window.addEventListener('gb-photo-saved', renderGallery);
    window.addEventListener('gb-photo-deleted', renderGallery);

    closeBtn?.addEventListener('click', () => {
        AppStore.playSound('click');
        AppStore.setMode('SHOOT');
    });
}
