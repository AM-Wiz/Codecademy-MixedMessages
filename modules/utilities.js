export async function loadJSONRelative(path) {
    const rep = await fetch(path);
    const text = await rep.text();
    return JSON.parse(text);
}

export function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
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




export function getElementPosition(element, dst = undefined) {
    if (dst === undefined)
        dst = [0, 0];

    const br = element.getBoundingClientRect();
    
    dst[0] = window.screenX - (br.left + br.width / 2);
    dst[1] = window.screenY - (br.top + br.height / 2);

    return dst;
}

export function setElementPosition(element, pos, dim=undefined) {
    const w = dim[0] ?? 0, h = dim[1] ?? 0;
    
    element.style.left = `${(pos[0] + w/2) - window.screenX}px`;
    element.style.top = `${(pos[1] + h/2) - window.screenY}px`;
}
