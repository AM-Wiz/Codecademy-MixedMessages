export async function loadJSONRelative(path) {
    const rep = await fetch(path);
    const text = await rep.text();
    return JSON.parse(text);
}

export function delay(ms) {
    ms = Math.floor(ms);
    return new Promise(res => setTimeout(res, ms));
}


export function fract(a) {
    a %= 1;
    if (a < 0)
        a += 1;
    return a;
}




export class RepeatingFunction {
    constructor(method, period) {
        this._method = method;
        this._period = period;
        this._state = 'idle';
        this._thunk = this.#execute.bind(this);
        this._id = 0;
    }

    #execute(id) {
        if (this._id !== id)
            return;
        
        try {
            if (this._state !== 'active')
                return;

            this._method();
        } catch (e) {
            console.log(e);
        }
        if (this._state === 'active')
            this.#launch();
    }

    #launch() {
        window.setTimeout(this._thunk, this._period * 1000, this._id);
    }

    start() {
        if (this._state === 'active')
            return;
        
        this._id++;
        this._state = 'active';
        this.#launch();

        return this;
    }

    stop() {
        if (this._state === 'idle')
            return;

        this._state = 'idle';
        
        return this;
    }
}



function getFrameAnchor(frame) {
    if (!frame)
        return [0, 0];
    const fbr = frame.getBoundingClientRect();

    return [fbr.left, fbr.top];
}

export function getElementPosition(frame, element, dst = undefined) {
    dst ??= [0, 0];
    
    const fa = getFrameAnchor(frame);
    const ebr = element.getBoundingClientRect();
    
    dst[0] = (ebr.left + ebr.width / 2) + fa[0];
    dst[1] = (ebr.top + ebr.height / 2) + fa[1];

    return dst;
}

export function setElementPosition(frame, element, pos) {
    const fa = getFrameAnchor(frame);
    const ebr = element.getBoundingClientRect();
    
    element.style.left = `${(pos[0] - ebr.width / 2) - fa[0]}px`;
    element.style.top = `${(pos[1] - ebr.height / 2) - fa[1]}px`;
}

export function getElementSize(frame, dst = undefined) {
    dst ??= [0, 0];

    const fbr = frame.getBoundingClientRect();

    return [fbr.width, fbr.height];
}