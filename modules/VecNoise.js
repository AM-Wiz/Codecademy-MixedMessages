import { fract } from "./utilities.js";
import { Vec, vecCpy, vecAdd } from "./vectors.js";


export class VecNoise {
    constructor() {
        this._scratch0 = Vec(2);
        this._scratch1 = Vec(2);
        this._scratch2 = Vec(2);
        this._scratch3 = Vec(2);
        this._scratch4 = Vec(2);
    }

    hash2x1(a) {
        let x = Math.floor(a[0]), y = Math.floor(a[1]);
        x *= 0.3183099, y *= 0.3183099;
        x += 0.71, y += 0.113;
        x = fract(x), y = fract(y);
        x *= 50, y *= 50;

        return ((x * y * (x + y)) % 1);
    }

    smooth2x1(a) {
        const v00 = this.hash2x1(vecCpy(a, this._scratch0));
        const v10 = this.hash2x1(vecAdd(a, [1, 0], this._scratch0));
        const v01 = this.hash2x1(vecAdd(a, [0, 1], this._scratch0));
        const v11 = this.hash2x1(vecAdd(a, [1, 1], this._scratch0));

        const rx = fract(a[0]);
        const ry = fract(a[1]);

        const c0 = v00 * (1 - rx) + v10 * rx;
        const c1 = v01 * (1 - rx) + v11 * rx;

        var res = c0 * (1 - ry) + c1 * ry;

        // if (res < -1 || res > 1)
        //     throw new Error();
        return res;
    }

    curl2x1(a, dst = undefined) {
        dst ??= Vec(2);

        const delta = 0.01;

        const n = this.smooth2x1(vecAdd(a, [0, delta], this._scratch1));
        const e = this.smooth2x1(vecAdd(a, [delta, 0], this._scratch1));
        const s = this.smooth2x1(vecAdd(a, [0, -delta], this._scratch1));
        const w = this.smooth2x1(vecAdd(a, [-delta, 0], this._scratch1));

        const x = (e - w) / (2 * delta);
        const y = (n - s) / (2 * delta);

        dst[0] = y;
        dst[1] = -x;

        return dst;
    }
}
