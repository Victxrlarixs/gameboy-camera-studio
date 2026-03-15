export type FrameDrawFn = (ctx: CanvasRenderingContext2D, palette: number[][]) => void;

class FrameRegistry {
    private readonly frames: Map<string, FrameDrawFn> = new Map();

    register(name: string, draw: FrameDrawFn) { this.frames.set(name, draw); }
    render(name: string, ctx: CanvasRenderingContext2D, palette: number[][]) {
        (this.frames.get(name) || this.frames.get('CLASSIC'))?.(ctx, palette);
    }
    getNames() { return Array.from(this.frames.keys()); }
}

export const Frames = new FrameRegistry();

const r = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
};

Frames.register('CLASSIC', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1); r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1); r(ctx, 148, 0, 12, 144, c1);
    for (let i = 20; i < 140; i += 10) { r(ctx, i, 2, 2, 8, c2); r(ctx, i, 134, 2, 8, c2); }
});

Frames.register('GAME BOY', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c3 = `rgb(${p[3].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1); r(ctx, 0, 128, 160, 16, c1);
    r(ctx, 0, 0, 12, 144, c1); r(ctx, 148, 0, 12, 144, c1);
    ctx.fillStyle = c3;
    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME BOY', 80, 140);
});

Frames.register('DOTS', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1); r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1); r(ctx, 148, 0, 12, 144, c1);
    for (let x = 4; x < 160; x += 8) {
        for (let y = 4; y < 144; y += 8) {
            if (x < 12 || x > 148 || y < 12 || y > 132) r(ctx, x, y, 2, 2, c2);
        }
    }
});

Frames.register('RETRO', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 144, c1);
    r(ctx, 4, 4, 152, 136, c2);
    r(ctx, 6, 6, 148, 132, c1);
    ctx.clearRect(12, 12, 136, 120);
});

Frames.register('SPARKLE', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1); r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1); r(ctx, 148, 0, 12, 144, c1);
    [[18,4],[80,4],[140,4],[18,136],[80,136],[140,136],[4,30],[4,110],[152,30],[152,110]].forEach(([sx, sy]) => {
        r(ctx, sx+2, sy, 2, 6, c2); r(ctx, sx, sy+2, 6, 2, c2);
    });
});

Frames.register('WILD', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1); r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1); r(ctx, 148, 0, 12, 144, c1);
    for (let x = 0; x < 160; x += 16) { r(ctx, x+4, 4, 4, 4, c2); r(ctx, x+10, 136, 4, 4, c2); }
    for (let y = 0; y < 144; y += 16) { r(ctx, 4, y+4, 4, 4, c2); r(ctx, 152, y+10, 4, 4, c2); }
});

Frames.register('HEARTS', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1); r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1); r(ctx, 148, 0, 12, 144, c1);
    [[2,2],[150,2],[2,134],[150,134]].forEach(([hx, hy]) => {
        r(ctx, hx+2, hy, 4, 2, c2); r(ctx, hx, hy+2, 8, 3, c2);
        r(ctx, hx+2, hy+5, 4, 2, c2);
    });
});

Frames.register('ZELDA', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1); r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1); r(ctx, 148, 0, 12, 144, c1);
    r(ctx, 78, 4, 4, 4, c2); r(ctx, 78, 136, 4, 4, c2);
    r(ctx, 4, 70, 4, 4, c2); r(ctx, 152, 70, 4, 4, c2);
});

Frames.register('TV', (ctx, p) => {
    const c1 = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 0, 0, 160, 12, c1); r(ctx, 0, 132, 160, 12, c1);
    r(ctx, 0, 0, 12, 144, c1); r(ctx, 148, 0, 12, 144, c1);
    ctx.globalAlpha = 0.3;
    for (let y = 14; y < 130; y += 4) r(ctx, 14, y, 132, 1, c2);
    ctx.globalAlpha = 1.0;
});
