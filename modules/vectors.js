
export function Vec(sz) {
    const v = [];
    for (let i = 0; i < sz; i++)
        v.push(0);

    return v;
}


export function randVec(dst) {
    for (let i = 0; i < dst.length; i++)
        dst[i] = Math.random() * 2 - 1;
    return dst;
}


export function vecCpy(src, dst=undefined) {
    dst ??= Vec(src.length);
    for (let i = 0; i < dst.length; i++)
        dst[i] = src[i];
    return dst;
}

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
        throw Error('Invalid input to vector add');
    
    return dst;
}

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
        throw Error('Invalid input to vector subtract');
    
    return dst;
}

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
        throw Error('Invalid input to vector multiply');
    
    return dst;
}

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
        throw Error('Invalid input to vector multiply');
    
    return dst;
}