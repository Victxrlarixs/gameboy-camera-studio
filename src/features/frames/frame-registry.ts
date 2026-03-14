/**
 * Signature for a pixel-art frame renderer operating on a 160×144 canvas.
 */
export type FrameDrawFn = (ctx: CanvasRenderingContext2D, palette: number[][]) => void;

class FrameRegistry {
    private readonly frames: Map<string, FrameDrawFn> = new Map();

    register(name: string, draw: FrameDrawFn): void {
        this.frames.set(name, draw);
    }

    render(name: string, ctx: CanvasRenderingContext2D, palette: number[][]): void {
        const frame = this.frames.get(name) || this.frames.get('CLASSIC');
        frame?.(ctx, palette);
    }

    getNames(): string[] {
        return Array.from(this.frames.keys());
    }
}

export const Frames = new FrameRegistry();

const r = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
};

// 1. CLASSIC: The standard border with vent marks
Frames.register('CLASSIC', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    const thickness = 12;

    // Border
    r(ctx, 0, 0, 160, thickness, c1);
    r(ctx, 0, 144 - thickness, 160, thickness, c1);
    r(ctx, 0, 0, thickness, 144, c1);
    r(ctx, 160 - thickness, 0, thickness, 144, c1);

    // Vent marks
    for (let i = 20; i < 140; i += 10) {
        r(ctx, i, 2, 2, 8, c2);
        r(ctx, i, 134, 2, 8, c2);
    }
});

// 2. GAME BOY: Classic logo at the bottom
Frames.register('GAME BOY', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    const c3 = `rgb(${p[3].join(',')})`;
    
    // Wider bottom for the logo
    r(ctx, 0, 0, 160, 12, c1);
    r(ctx, 0, 144 - 16, 160, 16, c1);
    r(ctx, 0, 0, 12, 144, c1);
    r(ctx, 160 - 12, 0, 12, 144, c1);

    // "GAME BOY" Text (Simple Pixel Representation)
    ctx.fillStyle = c3;
    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME BOY', 80, 140);
});

// 3. DOTS: Minimalist dotted pattern
Frames.register('DOTS', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    
    r(ctx, 0, 0, 160, 12, c1);
    r(ctx, 0, 144 - 12, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1);
    r(ctx, 160 - 12, 0, 12, 144, c1);

    // Dots pattern
    for (let x = 4; x < 160; x += 8) {
        for (let y = 4; y < 144; y += 8) {
            if (x < 12 || x > 148 || y < 12 || y > 132) {
                r(ctx, x, y, 2, 2, c2);
            }
        }
    }
});

// 4. RETRO: Double line border
Frames.register('RETRO', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    
    r(ctx, 0, 0, 160, 144, c1);
    r(ctx, 4, 4, 152, 136, c2);
    r(ctx, 6, 6, 148, 132, c1);
    ctx.clearRect(12, 12, 136, 120);
});

// 5. SPARKLE: Magic/Starlight effect
Frames.register('SPARKLE', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1);
    r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1);
    r(ctx, 148, 0, 12, 144, c1);
    
    const stars = [[18, 4], [80, 4], [140, 4], [18, 136], [80, 136], [140, 136], [4, 30], [4, 110], [152, 30], [152, 110]];
    stars.forEach(([sx, sy]) => {
        r(ctx, sx + 2, sy, 2, 6, c2);
        r(ctx, sx, sy + 2, 6, 2, c2);
    });
});

// 6. WILD: Jungle/Nature vines
Frames.register('WILD', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1);
    r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1);
    r(ctx, 148, 0, 12, 144, c1);

    for (let x = 0; x < 160; x += 16) {
        r(ctx, x + 4, 4, 4, 4, c2);
        r(ctx, x + 10, 136, 4, 4, c2);
    }
    for (let y = 0; y < 144; y += 16) {
        r(ctx, 4, y + 4, 4, 4, c2);
        r(ctx, 152, y + 10, 4, 4, c2);
    }
});

// 7. HEARTS: Cute hearts in corners
Frames.register('HEARTS', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1);
    r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1);
    r(ctx, 148, 0, 12, 144, c1);

    const corners = [[2, 2], [150, 2], [2, 134], [150, 134]];
    corners.forEach(([hx, hy]) => {
        r(ctx, hx+2, hy, 4, 2, c2);
        r(ctx, hx, hy+2, 8, 3, c2);
        r(ctx, hx+2, hy+5, 4, 2, c2);
    });
});

// 8. ZELDA: Inspired by classic fantasy borders
Frames.register('ZELDA', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1);
    r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1);
    r(ctx, 148, 0, 12, 144, c1);

    const xPos = [12, 148];
    const yPos = [12, 132];
    // Draw small triforce triangles in the frame center
    r(ctx, 80-2, 4, 4, 4, c2);
    r(ctx, 80-2, 136, 4, 4, c2);
    r(ctx, 4, 72-2, 4, 4, c2);
    r(ctx, 152, 72-2, 4, 4, c2);
});

// 9. TV: Old CRT television bezel
Frames.register('TV', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c1 = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    
    // Rounded corners mask
    r(ctx, 0, 0, 160, 12, c1);
    r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1);
    r(ctx, 148, 0, 12, 144, c1);
    
    // Scanline indicators
    ctx.globalAlpha = 0.3;
    for(let y = 14; y < 130; y += 4) {
        r(ctx, 14, y, 132, 1, c2);
    }
    ctx.globalAlpha = 1.0;
});
