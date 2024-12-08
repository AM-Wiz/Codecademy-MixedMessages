import { fract } from "./utilities.js";

/**
 * 
 * @param {number} x dimension
 * @returns {number[]}
 */
export function Vec(x) {
    if (typeof x === 'number') {
        const v = [];
        for (let i = 0; i < x; i++)
            v.push(0);
        return v;
    } else if (Array.isArray(x)) {
        return x;
    } else {
        throw new Error(`Invalid input ${x} to Vec constructor`);
    }
}


/**
 * 
 * @param {*} vec 
 * @param {number | null} dim 
 * @returns {boolean}
 */
export function IsVec(vec, dim = null) {
    if (!Array.isArray(vec))
        return false;

    if (typeof dim == 'number' && vec.length != dim)
        return false;

    return true;
}


/**
 * 
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function randVec(dst) {
    for (let i = 0; i < dst.length; i++)
        dst[i] = Math.random() * 2 - 1;
    return dst;
}


/**
 * 
 * @param {number[]} src
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecCpy(src, dst=undefined) {
    dst ??= Vec(src.length);
    for (let i = 0; i < dst.length; i++)
        dst[i] = src[i];
    return dst;
}


/**
 * 
 * @param {number[]} src
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecNeg(src, dst=undefined) {
    dst ??= Vec(src.length);
    for (let i = 0; i < dst.length; i++)
        dst[i] = -src[i];
    return dst;
}

/**
 * 
 * @param {number[]} src
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecRecip(src, dst=undefined) {
    dst ??= Vec(src.length);
    for (let i = 0; i < dst.length; i++)
        dst[i] = 1.0 / src[i];
    return dst;
}

/**
 * 
 * @param {number[] | number} a
 * @param {number[] | number} b
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecAdd(a, b, dst=undefined) {
    dst ??= Vec(a['length'] ?? b['length']);

    if (typeof a === 'number' && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a + b[i];
    } else if (Array.isArray(a) && typeof b === 'number') {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] + b;
    } else if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] + b[i];
    } else
        throw new Error('Invalid input to vector add');
    
    return dst;
}

/**
 * 
 * @param {number[] | number} a
 * @param {number[] | number} b
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecSub(a, b, dst=undefined) {
    dst ??= Vec(a['length'] ?? b['length']);

    if (typeof a === 'number' && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a - b[i];
    } else if (Array.isArray(a) && typeof b === 'number') {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] - b;
    } else if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] - b[i];
    } else
        throw new Error('Invalid input to vector subtract');
    
    return dst;
}

/**
 * 
 * @param {number[] | number} a
 * @param {number[] | number} b
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecMul(a, b, dst=undefined) {
    dst ??= Vec(a['length'] ?? b['length']);

    if (typeof a === 'number' && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a * b[i];
    } else if (Array.isArray(a) && typeof b === 'number') {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] * b;
    } else if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] * b[i];
    } else
        throw new Error('Invalid input to vector multiply');
    
    return dst;
}

/**
 * 
 * @param {number[] | number} a
 * @param {number[] | number} b
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecDiv(a, b, dst=undefined) {
    dst ??= Vec(a['length'] ?? b['length']);

    if (typeof a === 'number' && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a / b[i];
    } else if (Array.isArray(a) && typeof b === 'number') {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] / b;
    } else if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] / b[i];
    } else
        throw new Error('Invalid input to vector divide');
    
    return dst;
}

/**
 * 
 * @param {number[] | number} a
 * @param {number[] | number} b
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecMod(a, b, dst=undefined) {
    dst ??= Vec(a['length'] ?? b['length']);

    if (typeof a === 'number' && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a % b[i];
    } else if (Array.isArray(a) && typeof b === 'number') {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] % b;
    } else if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] % b[i];
    } else
        throw new Error('Invalid input to vector modulo');
    
    return dst;
}

/**
 * 
 * @param {number[]} a
 * @param {number[]} b
 * @returns number
 */
export function vecDot(a, b) {
    let acc = 0;
    for (let i = 0; i < a.length; i++)
        acc += a[i] * b[i];
    return acc;
}

/**
 * 
 * @param {number[]} a
 * @returns number
 */
export function vecSqrLen(a) {
    return a.reduce((a, b) => a + b * b, 0);
}

/**
 * 
 * @param {number[]} a
 * @returns number
 */
export function vecLen(a) {
    return Math.sqrt(vecSqrLen(a));
}

/**
 * 
 * @param {number[]} a
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecNorm(a, dst = undefined) {
    dst = vecCpy(a, dst);
    
    const len = vecLen(dst);

    if (len > 0.001)
        vecDiv(dst, len, dst);

    return dst;
}

/**
 * 
 * @param {number[]} a
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecFloor(a, dst = undefined) {
    dst ??= Vec(a.length);

    for (let i = 0; i < dst.length; i++)
        dst[i] = Math.floor(a[i]);

    return dst;
}

/**
 * 
 * @param {number[]} a
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecFract(a, dst = undefined) {
    dst ??= Vec(a.length);

    for (let i = 0; i < dst.length; i++)
        dst[i] = fract(a[i]);

    return dst;
}

/**
 * 
 * @param {number[]} a
 * @param {number[]} b
 * @param {number | number[]} x
 * @param {number[]} dst
 * @returns {number[]} dst
 */
export function vecLerp(a, b, x, dst=undefined) {
    dst ??= Vec(a['length'] ?? b['length']);

    if (typeof x === 'number') {
        const mx = 1 - x;
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] * mx + b[i] * x;
    } else if (Array.isArray(x)) {
        for (let i = 0; i < dst.length; i++)
            dst[i] = a[i] * (1 - x) + b[i] * x;
    } else
        throw new Error('Invalid input to vector modulo');
    
    return dst;
}


/**
 * 
 * @param {number[]} a 
 * @param {Function} func 
 * @param {number[]} dst 
 * @returns {number[]} dst
 */
export function vecApply0(a, func, dst = undefined) {
    dst ??= Vec(a.length);

    for (let i = 0; i < a.length; i++)
        dst[i] = func(a[i], i);

    return dst;
}