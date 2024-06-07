import { getElementPosition, setElementPosition } from "./utilities.js";
import { Vec, vecAdd, vecMul, vecCpy, vecSub } from "./vectors.js";


const PStates = {
    initial: '0ini',
    adding: '1add',
    active: '2act',
    disposing: '3dsp',
    dead: '4ded',
};

const CStates = {
    idle: '0idl',
    updatingParticles: '1upp',
    simulating: '2sim',
    updatingFrame: '3upf',
};


export class ParticleContext {
    constructor(frame) {
        this._frame = frame;
        this.particles = [];
        this.newParticles = [];
        this.dyingParticles = [];
        this._timeStep = 1.0 / 30;
        this._state = CStates.idle;
    }

    addParticle(particle) {
        if (!(particle['state'] === PStates.initial))
            throw Error('Particle was invalid or not in the initial state');

        particle.state = PStates.adding;
        this.newParticles.push(particle);
    }

    removeParticle(particle) {
        if (!(particle['state'] <= PStates.active))
            return;

        particle.state = PStates.disposing;
        this.dyingParticles.push(particle);
    }

    get timeStep() {
        return this._timeStep;
    }
}



export class Particle {
    constructor(content, position, lifetime=null, anchor=null) {
        this._position = Vec(2);
        this._velocity = Vec(2);
        this._anchor = null;
        
        this._effects = [];

        this._maxLifetime = lifetime;
        this._lifetime = 0;

        this._context = null;
        this.state = PStates.initial;
        
        this._content = content;
        this._element = null;

        if (position !== undefined)
            this.position = position;
    }



    get position() {
        return this._position;
    }
    
    set position(value) {
        vecCpy(value, this._position);
    }
    
    get velocity() {
        return this._velocity;
    }
    
    set velocity(value) {
        vecCpy(value, this._velocity);
    }
    

    addEffect(effect) {
        this._effects.push(effect);
    }

    removeEffect(effect) {
        this._effects.push(effect);
    }

}

export class ParticleAnchor {
    constructor(element, offset=null) {
        this._element = element;
        this._offset = offset ?? Vec(2);
    }
}



export class ParticleEffect {
    constructor() {

    }

    before(context, particles) {

    }

    beforeVel(context, particles) {

    }

    beforeApply(context, particles) {

    }

    after(context, particles) {

    }
}

export class ParticleSlowEffect extends ParticleEffect {
    constructor(amount) {
        super();
        this.amount = amount;
    }


    beforeApply(context, particles) {
        const rat = 1 - this.amount * context.timeStep;
        const temp = Vec(2);

        particles.forEach(p => {
            vecMul(p.velocity, rat, temp);
            p.velocity = temp;
        });
    }
}




function updateElementPos(context, anchor, element, position) {
    let eP = vecCpy(position);
    
    if (anchor) {
        vecAdd(eP, anchor._offset, eP);
        if (anchor._element !== null) {
            const aP = getElementPosition(anchor._element);
            vecAdd(eP, aP, eP);
        }
    }

    const fp = getElementPosition(context._frame);
    
    vecSub(eP, fp, eP);

    element.innerText = `${Math.floor(eP[0])} ${Math.floor(eP[1])}`;

    setElementPosition(element, eP, [50, 50]);
}

function createElement(context, particle) {
    const newElem = document.createElement('div');
    newElem.style.position = 'fixed';
    newElem.style.width = '50px';
    newElem.style.height = '50px';

    updateElementPos(context, particle._anchor, newElem, particle.position);

    newElem.style.backgroundColor = 'red';
    if (typeof particle._content === 'string') {
        newElem.innerText = particle._content;
    } else {

    }

    particle._element = newElem;
    context._frame.appendChild(newElem);
}

function destroyElement(context, particle) {
    if (particle._element === undefined)
        return;
    context._frame.removeChild(particle._element);
    particle._element = undefined;
}

function updateElement(context, particle) {
    updateElementPos(context, particle._anchor, particle._element, particle.position);
}


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

function tickLife(context) {
    for (let i = 0; i < context.particles.length; i++) {
        const p = context.particles[i];

        p._lifetime += context.timeStep;

        if (p._lifetime > p._maxLifetime)
            context.removeParticle(p);
    }
}

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


function simulate(context) {
    const tempV = Vec(2);

    for (let i = 0; i < context.particles.length; i++) { // TODO optimize
        const p = context.particles[i];

        p._effects.forEach(e => {
            e.before(context, [p]);
        });
    }

    for (let i = 0; i < context.particles.length; i++) { // TODO optimize
        const p = context.particles[i];

        p._effects.forEach(e => {
            e.beforeVel(context, [p]);
        });
    }

    for (let i = 0; i < context.particles.length; i++) {
        const p = context.particles[i];

        vecMul(p.velocity, context.timeStep, tempV);
        vecAdd(p.position, tempV, p.position);
    }
    
    for (let i = 0; i < context.particles.length; i++) { // TODO optimize
        const p = context.particles[i];

        p._effects.forEach(e => {
            e.beforeApply(context, [p]);
        });
    }
}

function updateElements(context) {
    for (let i = 0; i < context.particles.length; i++) {
        const p = context.particles[i];

        updateElement(context, p);
    }
}


export function simulateFrame(context, timeStep) {
    if (!(context._state === CStates.idle))
        throw Error('Invalid operation');

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

    context._state = CStates.simulating;
    try {
        simulate(context);
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