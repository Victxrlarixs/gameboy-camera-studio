/**
 * Signature for a pixel-art stamp renderer operating on a 160×144 canvas.
 *
 * @param ctx     - The `CanvasRenderingContext2D` of the camera display.
 * @param palette - Active 4-shade palette as an array of `[R, G, B]` tuples,
 *                  ordered from darkest (`[0]`) to lightest (`[3]`).
 */
export type StampDrawFn = (ctx: CanvasRenderingContext2D, palette: number[][]) => void;

/**
 * Open/Closed-compliant registry of decorative camera overlay stamps.
 * New stamps are added via {@link StampRegistry.register} without modifying
 * any rendering consumers.
 */
class StampRegistry {
    private readonly stamps: Map<string, StampDrawFn> = new Map();

    /**
     * Registers a new stamp renderer under the given name.
     *
     * @param name - Unique stamp identifier (e.g. `'HEART'`).
     * @param draw - Pixel-art drawing function conforming to {@link StampDrawFn}.
     */
    register(name: string, draw: StampDrawFn): void {
        this.stamps.set(name, draw);
    }

    /**
     * Invokes the renderer for the specified stamp on the given context.
     * A `name` of `'NONE'` is a no-op.
     *
     * @param name    - Identifier of the stamp to render.
     * @param ctx     - Target `CanvasRenderingContext2D`.
     * @param palette - Active palette for color selection.
     */
    render(name: string, ctx: CanvasRenderingContext2D, palette: number[][]): void {
        if (name === 'NONE') return;
        this.stamps.get(name)?.(ctx, palette);
    }

    /**
     * Returns all registered stamp names prefixed with `'NONE'`.
     *
     * @returns Ordered array of stamp identifiers.
     */
    getNames(): string[] {
        return ['NONE', ...this.stamps.keys()];
    }
}

/** Singleton {@link StampRegistry} instance. */
export const Stamps = new StampRegistry();

/**
 * Fills a rectangle on `ctx` with the given color.
 */
const r = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
};

Stamps.register('HEART', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c = `rgb(${p[0].join(',')})`;
    const x = 18, y = 18;
    r(ctx, x+2, y,   2, 2, c); r(ctx, x+6, y,   2, 2, c);
    r(ctx, x,   y+2, 10, 4, c);
    r(ctx, x+2, y+6, 6,  2, c);
    r(ctx, x+4, y+8, 2,  2, c);
});

Stamps.register('STAR', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c = `rgb(${p[0].join(',')})`;
    const x = 130, y = 18;
    r(ctx, x+3, y,   2, 2, c);
    r(ctx, x,   y+2, 8, 2, c); r(ctx, x+2, y+4, 4, 4, c);
    r(ctx, x,   y+8, 3, 3, c); r(ctx, x+5, y+8, 3, 3, c);
});

Stamps.register('SMILE', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c = `rgb(${p[0].join(',')})`;
    const x = 128, y = 20;
    r(ctx, x+2, y+2, 2, 2, c); r(ctx, x+6, y+2, 2, 2, c);
    r(ctx, x,   y+6, 2, 2, c); r(ctx, x+8, y+6, 2, 2, c);
    r(ctx, x+2, y+6, 6,  2, c);
});

Stamps.register('SKULL', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c = `rgb(${p[0].join(',')})`;
    const x = 16, y = 130;
    r(ctx, x+2, y,    4, 2, c);
    r(ctx, x,   y+2,  8, 4, c);
    r(ctx, x+1, y+6,  2, 2, c); r(ctx, x+5, y+6,  2, 2, c);
    r(ctx, x+2, y+8,  4, 2, c);
    r(ctx, x+1, y+10, 6, 2, c);
});

Stamps.register('FLOWER', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c  = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    const x = 18, y = 128;
    r(ctx, x+3, y,   2, 2, c); r(ctx, x+3, y+8, 2, 2, c);
    r(ctx, x,   y+3, 2, 2, c); r(ctx, x+8, y+3, 2, 2, c);
    r(ctx, x+2, y+1, 6, 8, c); r(ctx, x+1, y+2, 8, 6, c);
    r(ctx, x+3, y+3, 4, 4, c2);
});

Stamps.register('GHOST', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c  = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    const x = 126, y = 128;
    r(ctx, x+2, y,    6,  2, c);
    r(ctx, x,   y+2,  10, 8, c);
    r(ctx, x+2, y+3,  2,  2, c2); r(ctx, x+6, y+3,  2, 2, c2);
    r(ctx, x,   y+10, 2,  2, c);  r(ctx, x+4, y+10, 2, 2, c); r(ctx, x+8, y+10, 2, 2, c);
});

Stamps.register('GRID', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    ctx.strokeStyle = `rgb(${p[0].join(',')})`;
    ctx.lineWidth   = 1;
    ctx.globalAlpha = 0.4;
    const cols = 4, rows = 4;
    const cw = 160 / cols, ch = 144 / rows;
    for (let i = 1; i < cols; i++) {
        ctx.beginPath(); ctx.moveTo(i * cw, 12); ctx.lineTo(i * cw, 132); ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
        ctx.beginPath(); ctx.moveTo(12, j * ch); ctx.lineTo(148, j * ch); ctx.stroke();
    }
    ctx.globalAlpha = 1;
});

Stamps.register('CROSS', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c  = `rgb(${p[0].join(',')})`;
    const c2 = `rgb(${p[1].join(',')})`;
    const cx = 80, cy = 72;
    r(ctx, cx-10, cy-1, 8, 2, c); r(ctx, cx+3, cy-1, 8, 2, c);
    r(ctx, cx-1, cy-10, 2, 8, c); r(ctx, cx-1, cy+3, 2, 8, c);
    r(ctx, cx-1,  cy-1, 2, 2, c2);
});

Stamps.register('CORNER', (ctx: CanvasRenderingContext2D, p: number[][]) => {
    const c = `rgb(${p[0].join(',')})`;
    const s = 10, t = 2;
    r(ctx, 12,    12,    s, t, c); r(ctx, 12,    12,    t, s, c);
    r(ctx, 148-s, 12,    s, t, c); r(ctx, 148,   12,    t, s, c);
    r(ctx, 12,    132,   s, t, c); r(ctx, 12,    132-s, t, s, c);
    r(ctx, 148-s, 132,   s, t, c); r(ctx, 148,   132-s, t, s, c);
});
