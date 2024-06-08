
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


export function vecNeg(src, dst=undefined) {
    dst ??= Vec(src.length);
    for (let i = 0; i < dst.length; i++)
        dst[i] = -src[i];
    return dst;
}

export function vecRecip(src, dst=undefined) {
    dst ??= Vec(src.length);
    for (let i = 0; i < dst.length; i++)
        dst[i] = 1.0 / src[i];
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


export function vecDot(a, b) {
    let acc = 0;
    for (let i = 0; i < a.length; i++)
        acc += a[i] * b[i];
    return acc;
}

export function vecSqrLen(a) {
    return a.reduce((a, b) => a + b * b, 0);
}

export function vecLen(a) {
    return Math.sqrt(vecSqrLen(a));
}

export function vecNorm(a, dst = undefined) {
    dst = vecCpy(a, dst);
    
    const len = vecLen(dst);

    if (len > 0.001)
        vecDiv(dst, len, dst);

    return dst;
}


export function vecApply(a, func, dst = undefined) {
    dst ??= Vec(a.length);

    for (let i = 0; i < a.length; i++)
        dst[i] = func(a[i], i);

    return dst;
}