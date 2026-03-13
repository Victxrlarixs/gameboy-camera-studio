export interface Photo {
    id: string;
    dataUrl: string;
    timestamp: number;
}

class PhotoStoreClass {
    private photos: Photo[] = [];
    private readonly STORAGE_KEY = 'gb_camera_photos';
    private readonly MAX_PHOTOS = 30;

    constructor() {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                try {
                    this.photos = JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse saved photos', e);
                }
            }
        }
    }

    savePhoto(dataUrl: string) {
        if (this.photos.length >= this.MAX_PHOTOS) {
            this.photos.pop(); // Remove oldest to stay within limit
        }

        const photo = {
            id: Math.random().toString(36).substr(2, 9),
            dataUrl,
            timestamp: Date.now()
        };
        this.photos.unshift(photo);
        this.persist();
        window.dispatchEvent(new CustomEvent('gb-photo-saved', { detail: photo }));
        return photo;
    }

    deletePhoto(id: string) {
        this.photos = this.photos.filter(p => p.id !== id);
        this.persist();
        window.dispatchEvent(new CustomEvent('gb-photo-deleted', { detail: { id } }));
    }

    getPhotos() {
        return this.photos;
    }

    private persist() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.photos));
        }
    }
}

export const PhotoStore = new PhotoStoreClass();
