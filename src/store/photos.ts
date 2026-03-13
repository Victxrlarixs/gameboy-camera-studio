/**
 * Represents a captured photo stored in the Lab Book.
 */
export interface Photo {
    /** Unique identifier for the photo. */
    id: string;
    /** Base64-encoded PNG data URL of the captured frame. */
    dataUrl: string;
    /** Unix timestamp (ms) of when the photo was captured. */
    timestamp: number;
}

/**
 * Manages persistent photo storage using `localStorage`.
 * Enforces a maximum capacity and dispatches custom DOM events on mutations.
 */
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

    /**
     * Saves a new photo to the store. Evicts the oldest photo if at capacity.
     * Dispatches `gb-photo-saved` on `window` with the new {@link Photo} as detail.
     *
     * @param dataUrl - Base64-encoded PNG data URL of the captured frame.
     * @returns The newly created {@link Photo} object.
     */
    savePhoto(dataUrl: string): Photo {
        if (this.photos.length >= this.MAX_PHOTOS) {
            this.photos.pop();
        }

        const photo: Photo = {
            id: Math.random().toString(36).substr(2, 9),
            dataUrl,
            timestamp: Date.now()
        };
        this.photos.unshift(photo);
        this.persist();
        window.dispatchEvent(new CustomEvent('gb-photo-saved', { detail: photo }));
        return photo;
    }

    /**
     * Removes a photo from the store by its identifier.
     * Dispatches `gb-photo-deleted` on `window` with `{ id }` as detail.
     *
     * @param id - The unique identifier of the photo to remove.
     */
    deletePhoto(id: string): void {
        this.photos = this.photos.filter(p => p.id !== id);
        this.persist();
        window.dispatchEvent(new CustomEvent('gb-photo-deleted', { detail: { id } }));
    }

    /**
     * Returns all stored photos in reverse-chronological order (newest first).
     *
     * @returns Immutable-like array of {@link Photo} objects.
     */
    getPhotos(): Photo[] {
        return this.photos;
    }

    /**
     * Serializes the photo list to `localStorage`.
     */
    private persist(): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.photos));
        }
    }
}

/** Singleton instance of {@link PhotoStoreClass}. */
export const PhotoStore = new PhotoStoreClass();
