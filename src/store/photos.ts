import { AppStore, FRAMES } from './app';

export interface Photo {
    id: string;
    dataUrl: string;
    timestamp: number;
    metadata?: {
        brightness: number;
        contrast: number;
        paletteName: string;
        frameName: string;
    };
    rawData?: number[];
}

class PhotoStoreClass {
    private photos: Photo[] = [];
    private readonly KEY = 'gb_camera_photos';
    private readonly MAX = 30;

    constructor() {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(this.KEY);
        if (saved) {
            try { this.photos = JSON.parse(saved); } catch { /* corrupt data */ }
        }
    }

    savePhoto(dataUrl: string, rawData?: number[]): Photo {
        if (this.photos.length >= this.MAX) this.photos.pop();

        const photo: Photo = {
            id: Math.random().toString(36).substr(2, 9),
            dataUrl,
            timestamp: Date.now(),
            rawData,
            metadata: {
                brightness: AppStore.state.brightness,
                contrast: AppStore.state.contrast,
                paletteName: AppStore.state.paletteName,
                frameName: FRAMES[AppStore.state.frameIndex]
            }
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

    updatePhoto(id: string, updates: Partial<Photo>) {
        const photo = this.photos.find(p => p.id === id);
        if (!photo) return;
        Object.assign(photo, updates);
        this.persist();
        window.dispatchEvent(new CustomEvent('gb-photo-saved', { detail: photo }));
    }

    getPhotos(): Photo[] {
        return this.photos;
    }

    private persist() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.KEY, JSON.stringify(this.photos));
        }
    }
}

export const PhotoStore = new PhotoStoreClass();
