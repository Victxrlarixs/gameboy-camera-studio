export type StampDrawFn = (ctx: CanvasRenderingContext2D, palette: number[][]) => void;

class StampRegistry {
    private readonly stamps: Map<string, StampDrawFn> = new Map();

    register(name: string, draw: StampDrawFn) { this.stamps.set(name, draw); }
    render(name: string, ctx: CanvasRenderingContext2D, palette: number[][]) {
        if (name === 'NONE') return;
        this.stamps.get(name)?.(ctx, palette);
    }
    getNames() { return ['NONE', ...this.stamps.keys()]; }
}

export const Stamps = new StampRegistry();

const r = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
};

Stamps.register('HEART', (ctx, p) => {
    const c = `rgb(${p[0].join(',')})`, x = 18, y = 18;
    r(ctx, x+2, y,   2, 2, c); r(ctx, x+6, y,   2, 2, c);
    r(ctx, x,   y+2, 10, 4, c);
    r(ctx, x+2, y+6, 6,  2, c);
    r(ctx, x+4, y+8, 2,  2, c);
});

Stamps.register('STAR', (ctx, p) => {
    const c = `rgb(${p[0].join(',')})`, x = 130, y = 18;
    r(ctx, x+3, y,   2, 2, c);
    r(ctx, x,   y+2, 8, 2, c); r(ctx, x+2, y+4, 4, 4, c);
    r(ctx, x,   y+8, 3, 3, c); r(ctx, x+5, y+8, 3, 3, c);
});

Stamps.register('SMILE', (ctx, p) => {
    const c = `rgb(${p[0].join(',')})`, x = 128, y = 20;
    r(ctx, x+2, y+2, 2, 2, c); r(ctx, x+6, y+2, 2, 2, c);
    r(ctx, x,   y+6, 2, 2, c); r(ctx, x+8, y+6, 2, 2, c);
    r(ctx, x+2, y+6, 6,  2, c);
});

Stamps.register('SKULL', (ctx, p) => {
    const c = `rgb(${p[0].join(',')})`, x = 16, y = 130;
    r(ctx, x+2, y,    4, 2, c);
    r(ctx, x,   y+2,  8, 4, c);
    r(ctx, x+1, y+6,  2, 2, c); r(ctx, x+5, y+6,  2, 2, c);
    r(ctx, x+2, y+8,  4, 2, c);
    r(ctx, x+1, y+10, 6, 2, c);
});

Stamps.register('FLOWER', (ctx, p) => {
    const c = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`, x = 18, y = 128;
    r(ctx, x+3, y,   2, 2, c); r(ctx, x+3, y+8, 2, 2, c);
    r(ctx, x,   y+3, 2, 2, c); r(ctx, x+8, y+3, 2, 2, c);
    r(ctx, x+2, y+1, 6, 8, c); r(ctx, x+1, y+2, 8, 6, c);
    r(ctx, x+3, y+3, 4, 4, c2);
});

Stamps.register('GHOST', (ctx, p) => {
    const c = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`, x = 126, y = 128;
    r(ctx, x+2, y,    6,  2, c);
    r(ctx, x,   y+2,  10, 8, c);
    r(ctx, x+2, y+3,  2,  2, c2); r(ctx, x+6, y+3,  2, 2, c2);
    r(ctx, x,   y+10, 2,  2, c);  r(ctx, x+4, y+10, 2, 2, c); r(ctx, x+8, y+10, 2, 2, c);
});

Stamps.register('GRID', (ctx, p) => {
    ctx.strokeStyle = `rgb(${p[0].join(',')})`;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    const cw = 40, ch = 36; // 160/4, 144/4
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i*cw, 12); ctx.lineTo(i*cw, 132); ctx.stroke(); }
    for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(12, j*ch); ctx.lineTo(148, j*ch); ctx.stroke(); }
    ctx.globalAlpha = 1;
});

Stamps.register('CROSS', (ctx, p) => {
    const c = `rgb(${p[0].join(',')})`, c2 = `rgb(${p[1].join(',')})`;
    r(ctx, 70, 71, 8, 2, c); r(ctx, 83, 71, 8, 2, c);
    r(ctx, 79, 62, 2, 8, c); r(ctx, 79, 75, 2, 8, c);
    r(ctx, 79, 71, 2, 2, c2);
});

Stamps.register('CORNER', (ctx, p) => {
    const c = `rgb(${p[0].join(',')})`, s = 10, t = 2;
    r(ctx, 12,    12,    s, t, c); r(ctx, 12,    12,    t, s, c);
    r(ctx, 148-s, 12,    s, t, c); r(ctx, 148,   12,    t, s, c);
    r(ctx, 12,    132,   s, t, c); r(ctx, 12,    132-s, t, s, c);
    r(ctx, 148-s, 132,   s, t, c); r(ctx, 148,   132-s, t, s, c);
});
