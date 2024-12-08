import { getElementPosition, setElementPosition } from "./utilities.js";
import { Vec, IsVec, vecAdd, vecMul, vecCpy, vecSub } from "./vectors.js";

/**
 * The set of particle states
 */
const PStates = {
    initial: '0ini',
    adding: '1add',
    active: '2act',
    disposing: '3dsp',
    dead: '4ded',
};

/**
 * The set of context states
 */
const CStates = {
    idle: '0idl',
    updatingParticles: '1upp',
    simulating: '2sim',
    updatingFrame: '3upf',
};



class PEffectList {
    constructor() {
        this._map = new Map();
    }
    
    get entries() {
        return this._map.entries();
    }

    reset() {
        this._map.values().forEach(a => a.length = 0);
    }

    #ensureEffect(effect) {
        let data = this._map.get(effect);
        if (data == undefined) {
            data = [];
            this._map.set(effect, data);
        }

        return data;
    }

    add(particle) {
        particle.effects.forEach(e => {
            this.#ensureEffect(e).push(particle);
        });
    }
}

class CEffectList {
    constructor() {
        this._map = new Map();
    }
    
    get entries() {
        return this._map.entries();
    }

    reset() {
        this._map.values().forEach(a => a.length = 0);
    }

    #ensureEffect(effect) {
        let data = this._map.get(effect);
        if (data == undefined) {
            data = [];
            this._map.set(effect, data);
        }

        return data;
    }

    add(particle) {
        if (!particle._content)
            return;

        particle._content.effects.forEach(e => {
            this.#ensureEffect(e).push(particle);
        });
    }
}

/**
 * Represents a particle simulation
 */
export class ParticleContext {
    constructor(frame) {
        this._frame = frame;
        this.particles = []; // TODO rename
        this.newParticles = [];
        this.dyingParticles = [];
        this._timeStep = 1.0 / 30;
        this._time = 0;
        this._state = CStates.idle;

        this._pEffectScratch = new PEffectList();
        this._cEffectScratch = new CEffectList();
    }

    addParticle(particle) {
        if (!(particle['state'] === PStates.initial))
            throw new Error('Particle was invalid or not in the initial state');

        particle.state = PStates.adding;
        this.newParticles.push(particle);
    }

    removeParticle(particle) {
        if (!(particle['state'] <= PStates.active))
            return;

        particle.state = PStates.disposing;
        this.dyingParticles.push(particle);
    }

    get time() {
        return this._time;
    }

    get timeStep() {
        return this._timeStep;
    }
}

/**
 * Represents a coordinate system against which particles are animate
 */
export class ParticleAnchor {
    constructor(context, element, offset=null) {
        this._context = context;
        this._element = element;
        this._offset = offset ?? Vec(2);

        this._origin = Vec(2);
    }

    get element() { return this._element; }
    get offset() { return this._offset; }

    get origin() {
        getElementPosition(null, this._element, this._origin);
        vecAdd(this._origin, this._offset, this._origin);

        return this._origin;
    }
    
    toGlobal(value, dst=null) {
        dst = vecCpy(value, dst);
        vecAdd(dst, this.origin, dst);
        
        return dst;
    }
    fromGlobal(value, dst=null) {
        dst = vecCpy(value, dst);
        vecSub(dst, this.origin, dst);

        return dst;
    }
}

/**
 * A logical particle display layer
 */
export class ParticleLayer { // TODO implement
    constructor(context, element) {
        this._context = context;
        this._element = element;

        this._origin = Vec(2);
    }


    get origin() {
        getElementPosition(null, this._element, this._origin);

        return this._origin;
    }
    
    toGlobal(value, dst=null) {
        dst = vecCpy(value, dst);
        vecAdd(dst, this.origin, dst);
        
        return dst;
    }
    fromGlobal(value, dst=null) {
        dst = vecCpy(value, dst);
        vecSub(dst, this.origin, dst);

        return dst;
    }
}


export class ParticleLayout {
    constructor(options) {
        this._content = options.content ?? null;
        this._effects = options.effects ?? [];
        this._maxLifetime = options.maxLifetime ?? null;
    }

    /**
     * @returns {ParticleContent}
     */
    get content() { return this._content; }
    set content(value) { this._content = value; }
    /**
     * @returns {ParticleEffect[]}
     */
    get effects() { return this._effects; }
    set effects(value) { this._effects = value; }
    /**
     * @returns {number}
     */
    get maxLifetime() { return this._maxLifetime; }
    set maxLifetime(value) { this._maxLifetime = value; }
}


/**
 * Represents a single particle with a set of effects
 */
export class Particle {
    /**
     * 
     * @param {ParticleLayer} layer 
     * @param {any} options 
     */
    constructor(layer, options) {
        this._position = Vec(2);
        this._globalPosition = Vec(2);
        this._velocity = Vec(2);
        this._anchor = options.anchor ?? null;
        
        this._effects = [];

        this._maxLifetime = options.maxLifetime ?? options.layout?.maxLifetime ?? null;
        this._lifetime = 0;

        this._layer = layer;
        this._context = null;
        this.state = PStates.initial;
        
        this._content = options.content ?? options.layout?.content ?? content;
        this._element = null;

        if (options.effects) {
            for (var ef of options.effects)
                this.addEffect(ef);
        }
        
        if (options.layout?.effects) {
            for (var ef of options.layout.effects)
                this.addEffect(ef);
        }
    }

    /**
     * @returns {number}
     */
    get lifetime() {
        return this._lifetime;
    }
    
    /** @summary The maximum lifetime of the particle
     *  @returns {number} A positive non-zero number indicating the lifetime, or null if the particle is immortal
     */
    get maxLifetime() {
        return this._maxLifetime;
    }

    /**
     * @returns {number}
     */
    get lifetimeElapsed() {
        if (this._maxLifetime === null)
            return 0;

        return this._lifetime / this._maxLifetime;
    }



    #posFromGlob(value, dst) {
        return this._anchor.fromGlobal(value, dst);
    }
    
    #posToGlob(value, dst) {
        return this._anchor.toGlobal(value, dst);
    }

    /**
     * @returns {number[]}
     */
    get position() {
        return this._position;
    }
    
    set position(value) {
        vecCpy(value, this._position);
        this.#posToGlob(this._position, this._globalPosition);
    }
    
    /**
     * @returns {number[]}
     */
    get globalPosition() {
        this.#posToGlob(this._position, this._globalPosition);
        return this._globalPosition;
    }

    set globalPosition(value) {
        vecCpy(value, this._globalPosition);
        this.#posFromGlob(this._globalPosition, this._position);
    }
    


    /**
     * @returns {number[]}
     */
    get velocity() {
        return this._velocity;
    }
    
    set velocity(value) {
        vecCpy(value, this._velocity);
    }
    

    /**
     * @returns {ParticleEffect[]}
     */
    get effects() {
        return this._effects;
    }
    set effects(value) {
        if (!Array.isArray(value))
            throw new Error('Invalid effects array');
        value = Array.from(value);

        this._effects = value;
    }


    addEffect(effect) {
        if (!(effect instanceof ParticleEffect))
            throw new Error('Invalid effect');

        this._effects.push(effect);
    }

    removeEffect(effect) {
        if (!(effect instanceof ParticleEffect))
            throw new Error('Invalid effect');
        
        this._effects.push(effect);
    }




    /**
     * @returns {ParticleContent}
     */
    get elementContent() {
        return this._element.childNodes[0];
    }
}


/**
 * Can animate the transform of a particle
 */
export class ParticleEffect {
    constructor() {

    }

    /**
     * Called at the beginning of effect evaluation
     * @param {ParticleContext} context 
     * @param {Particle[]} particles 
     */
    before(context, particles) {

    }

    /**
     * Called before velocity is calculated
     * @param {ParticleContext} context 
     * @param {Particle[]} particles 
     */
    beforeVel(context, particles) {

    }

    /**
     * Called before the particles have had their effects applied
     * @param {ParticleContext} context 
     * @param {Particle[]} particles 
     */
    beforeApply(context, particles) {

    }

    /**
     * Called after effect evaluation
     * @param {ParticleContext} context 
     * @param {Particle[]} particles 
     */
    after(context, particles) {

    }
}

/**
 * The content of a particle that is displayed
 */
export class ParticleContent {
    constructor(options = {}) {
        if (IsVec(options.dimensions, 2))
            this._dimensions = vecCpy(options.dimensions);
        else
            this._dimensions = Vec([50, 50]);

        if (typeof options.text == 'string')
            this._text = options.text;
        else
            this._text = undefined;

        if (typeof options.html == 'string')
            this._html = options.html;
        else
            this._html = undefined;
        
        if (Array.isArray(options.cssClasses))
            this._cssClasses = options.cssClasses;
        else
            this._cssClasses = [];
        
        if (Array.isArray(options.effects))
            this._effects = options.effects;
        else
            this._effects = [];
    }

    /**
     * @returns {number[]} 
     */
    get dimensions() { return this._dimensions; }
    
    set dimensions(value) {
        vecCpy(value, this._dimensions);
    }

    /**
     * @returns {string} 
     */
    get text() { return this._text; }
    set text(value) {
        this._text = value;
        this._html = undefined;
    }
    
    /**
     * @returns {string} 
     */
    get html() { return this._html; }
    set html(value) {
        this._html = value;
        this._text = undefined;
    }


    /**
     * @returns {string[]}
     */
    get cssClasses() { return this._cssClasses; }
    set cssClasses(values) {
        if (!Array.isArray(values))
            throw new Error('Invalid class array');
        values = [...values];

        this._cssClasses = values
    }

    
    /**
     * @returns {ParticleContentEffect[]} 
     */
    get effects() {
        return this._effects;
    }
    
    set effects(values) {
        if (!Array.isArray(values))
            throw new Error('Invalid effects array');
        values = [...values];

        this._effects = values;
    }


    addEffect(effect) {
        if (!(effect instanceof ParticleContentEffect))
            throw new Error('Invalid effect');

        this._effects.push(effect);
    }

    removeEffect(effect) {
        if (!(effect instanceof ParticleContentEffect))
            throw new Error('Invalid effect');

        this._effects.push(effect);
    }
}

/**
 * Can animate the content of a particle
 */
export class ParticleContentEffect {
    constructor() {

    }

    /**
     * Apply the content effect to `particles`
     * @param {ParticleContext} context 
     * @param {Particle[]} particles 
     */
    apply(context, particles) {

    }
}



/**
 * Update the the position of a particle `Element`
 * @param {ParticleContext} context 
 * @param {ParticleAnchor} anchor 
 * @param {Element} element 
 * @param {number[]} position 
 */
function updateElementPos(context, anchor, element, position) {
    let eP = vecCpy(position);
    
    if (anchor) {
        vecAdd(eP, anchor._offset, eP);
        if (anchor._element !== null) {
            const aP = getElementPosition(context._frame, anchor._element);
            vecAdd(eP, aP, eP);
        }
    }

    // element.innerText = `${Math.floor(eP[0])} ${Math.floor(eP[1])}`;

    setElementPosition(context._frame, element, eP);
}

/**
 * The name of the particle body css class
 */
const particleBodyClass = 'particle-container';

/**
 * Create an element for `particle`
 * @param {ParticleContext} context 
 * @param {Particle} particle 
 */
function createElement(context, particle) {
    const newElem = document.createElement('div');
    newElem.classList.add(particleBodyClass);
    
    let dimensions;
    // newElem.style.backgroundColor = 'red';
    if (particle._content) {
        if (particle._content.text !== undefined) {
            const innerDiv = document.createElement('div');
            innerDiv.textContent = particle._content.text;
            newElem.appendChild(innerDiv);
        } else if (particle._content.html !== undefined) {
            newElem.innerHTML = particle._content.html;
        }

        if (particle._content.cssClasses) {
            newElem.firstElementChild.classList.add(... particle._content.cssClasses);
        }

        dimensions = particle._content.dimensions;
    } else {
        dimensions = [50, 50];
    }
    
    newElem.style.width = `${dimensions[0]}px`;
    newElem.style.height = `${dimensions[1]}px`;

    updateElementPos(context, particle._anchor, newElem, particle.position);

    particle._element = newElem;
    context._frame.appendChild(newElem);
}

/**
 * Destroy the element corresponding to `particle`
 * @param {ParticleContext} context 
 * @param {Particle} particle 
 */
function destroyElement(context, particle) {
    if (particle._element === undefined)
        return;
    context._frame.removeChild(particle._element);
    particle._element = undefined;
}

/**
 * Update the element corresponding to `particle`
 * @param {ParticleContext} context 
 * @param {Particle} particle 
 */
function updateElement(context, particle) {
    updateElementPos(context, particle._anchor, particle._element, particle.position);
}


/**
 * Instantiate any particles that were added to the new queue
 * @param {ParticleContext} context 
 */
function addNew(context) {
    while (context.newParticles.length > 0) {
        const p = context.newParticles.pop();
        if (p.state !== PStates.adding)
            continue;

        p._context = context;
        p.state = PStates.active;
        context.particles.push(p);

        createElement(context, p);
    }
}

/**
 * Tick the life of particles
 * @param {ParticleContext} context 
 */
function tickLife(context) {
    for (let i = 0; i < context.particles.length; i++) {
        const p = context.particles[i];

        p._lifetime += context.timeStep;

        if (p._lifetime > p._maxLifetime)
            context.removeParticle(p);
    }
}

/**
 * Remove any particles that have been marked for disposal
 * @param {ParticleContext} context 
 */
function removeOld(context) {
    while (context.dyingParticles.length > 0) {
        const p = context.dyingParticles.pop();
        
        p._context = null;
        p.state = PStates.disposing;
        const idx = context.particles.indexOf(p);
        if (idx >= 0) {
            context.particles.splice(idx, 1);

            destroyElement(context, p);
        }
    }
}

/**
 * Prepare particle effects for simulation
 * @param {ParticleContext} context 
 */
function processEffects(context) {
    context._pEffectScratch.reset();

    context.particles.forEach(a => {
        context._pEffectScratch.add(a);
    });

    for (const [ef, ps] of context._pEffectScratch.entries) {
        ef.before(context, ps);
    }
}

/**
 * Simulate particles effects
 * @param {ParticleContext} context 
 */
function simulateEffects(context) {
    const tempV = Vec(2);

    for (const [ef, ps] of context._pEffectScratch.entries) {
        ef.beforeVel(context, ps);
    }
    
    for (const [ef, ps] of context._pEffectScratch.entries) {
        ef.beforeApply(context, ps);
    }

    for (let i = 0; i < context.particles.length; i++) {
        const p = context.particles[i];

        vecMul(p.velocity, context.timeStep, tempV);
        vecAdd(p.position, tempV, p.position);
    }
}

/**
 * Update the elements corresponding to each particle
 * @param {ParticleContext} context 
 */
function updateElements(context) {
    context._cEffectScratch.reset();

    context.particles.forEach(a => {
        context._cEffectScratch.add(a);
    });

    
    for (let i = 0; i < context.particles.length; i++) {
        const p = context.particles[i];
        
        updateElement(context, p);
    }

    for (const [ef, ps] of context._cEffectScratch.entries) {
        ef.apply(context, ps);
    }
}

/**
 * Simulate a frame for the particles in `context`
 * @param {ParticleContext} context The particle context to simulate
 * @param {number} timeStep The time step to simulate
 */
export function simulateFrame(context, timeStep) {
    if (!(context._state === CStates.idle))
        throw new Error('Invalid operation');

    context._state = CStates.updatingParticles;
    context._timeStep = timeStep;

    try {
        addNew(context);
        tickLife(context);
        removeOld(context);
    } catch (e) {
        context._state = CStates.idle;
        throw e;
    }

    try {
        processEffects(context);
    } catch (e) {
        context._state = CStates.idle;
        throw e;
    }

    context._state = CStates.simulating;
    try {
        simulateEffects(context);
    } catch (e) {
        context._state = CStates.idle;
        throw e;
    }

    context._state = CStates.updatingFrame;
    try {
        updateElements(context);
    } catch (e) {
        context._state = CStates.idle;
        throw e;
    }
    
    context._state = CStates.idle;
}