export interface Photo {
    id: string;
    dataUrl: string;
    timestamp: number;
}

class PhotoStoreClass {
    private photos: Photo[] = [];

    savePhoto(dataUrl: string) {
        const photo = {
            id: Math.random().toString(36).substr(2, 9),
            dataUrl,
            timestamp: Date.now()
        };
        this.photos.unshift(photo);
        window.dispatchEvent(new CustomEvent('gb-photo-saved', { detail: photo }));
        return photo;
    }

    getPhotos() {
        return this.photos;
    }
}

export const PhotoStore = new PhotoStoreClass();
