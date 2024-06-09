import { Particle, ParticleContext, ParticleAnchor, simulateFrame as simParticleFrame, ParticleLayer, ParticleContent, ParticleContentEffect } from './modules/Particle.js';
import { ParticleFlowEffect, ParticleSlowEffect } from './modules/ParticleEffects.js';
import { randVec, Vec, vecAdd, vecCpy, vecDiv, vecMul, vecNorm, vecSub } from './modules/vectors.js';
import { RepeatingFunction, delay, getElementSize } from './modules/utilities.js';

import { button, messageField } from './main-layout.js';

const particleFrameBgd = document.querySelector('#particle-frame-bgd');
const particleFrameFgd = document.querySelector('#particle-frame-fgd');

const particleContext = new ParticleContext(particleFrameFgd);
const particleLayerBgd = new ParticleLayer(particleContext, particleFrameBgd);
const particleLayerFgd = new ParticleLayer(particleContext, particleFrameFgd);
const buttonAnchor = new ParticleAnchor(particleContext, button, null);

const pFrequency = 30;
const particleHandler = new RepeatingFunction(() => {

    simParticleFrame(particleContext, 1.0 / pFrequency);

    //console.log('In handler');
}, 1.0 / pFrequency);





class RectEmission {
    constructor(position, dimension) {
        this._position = vecCpy(position);
        this._halfDimension = vecMul(dimension, 0.5);
        this._ratio = vecNorm(this._halfDimension);
    }

    randomSurfacePos(dst = undefined) {
        dst ??= Vec(2);
        randVec(dst);

        vecMul(dst, this._ratio, dst);
        
        if (Math.abs(dst[0]) < Math.abs(dst[1])) {
            dst[0] = Math.sign(dst[0]) ?? 1;
        } else {
            dst[1] = Math.sign(dst[1]) ?? 1;
        }

        vecMul(dst, this._halfDimension, dst);

        vecAdd(dst, this._position, dst);

        return dst;
    }
    
    randomAreaPos(dst = undefined) {
        dst ??= Vec(2);
        randVec(dst);

        vecMul(dst, this._halfDimension, dst);

        vecAdd(dst, this._position, dst);

        return dst;
    }
}

particleHandler.start();


const particleSlowEffect = new ParticleSlowEffect(1, 0.1);
const particleFlowEffect = new ParticleFlowEffect(1000, 5);

const particleShrinkEffect = new class ParticleShrinkEffect extends ParticleContentEffect {
    constructor() {
        super();
    }

    #sCurve(x) {
        const firstStep = 0.6;

        if (x < firstStep) {
            x = 1;
        } else {
            x = (x - firstStep) / (1 - firstStep);
            x = 1 - x;
        }

        return x;
    }
    
    #oCurve(x) {
        const firstStep = 0.1, secondStep = 0.6;

        if (x < firstStep) {
            x = (x) / (firstStep);
        } else if (x < secondStep) {
            x = 1;
        } else {
            x = (x - secondStep) / (1 - secondStep);
            x = 1 - x;
        }

        return x;
    }

    apply(context, particles) {
        particles.forEach(p => {
            const ec = p.elementContent;

            const v = this.#sCurve(p.lifetimeElapsed);

            ec.style.scale = `${this.#sCurve(p.lifetimeElapsed) * 100}%`;
            ec.style.opacity = `${this.#oCurve(p.lifetimeElapsed) * 100}%`;
        });
    }
};

const questionContent = new ParticleContent({
    dimensions: [50, 50],
    html: "<span class='particle-text'>?</span>",
    effects: [particleShrinkEffect],
});

async function spawnButtonParticles(count, period, lifetime) {
    if (count < 1)
        return;

    const minGapPeriod = 0.1;
    const gapPeriod = period / count;

    const surf = new RectEmission([0, 0], getElementSize(buttonAnchor.element));

    let posScratch = Vec(2);
    let velScratchA = Vec(2), velScratchB = Vec(2);

    let remaining = 0;
    let batchCount = 0;
    for (; remaining < count; remaining++) {
        let totalLifetime = lifetime;
        totalLifetime += Math.max(0.05 * totalLifetime, 0.4) * (Math.random() * 2 - 1);

        const np = new Particle(particleLayerFgd, questionContent, totalLifetime, buttonAnchor);
        np.addEffect(particleSlowEffect);
        np.addEffect(particleFlowEffect);

        surf.randomSurfacePos(posScratch);
        np.position = posScratch;
        
        {
            vecNorm(posScratch, velScratchA);

            randVec(velScratchB);
            vecMul(velScratchB, 0.2, velScratchB);
            
            vecAdd(velScratchA, velScratchB, velScratchA);

            vecMul(velScratchA, 200, velScratchA);
            np.velocity = velScratchA;
        }
        particleContext.addParticle(np);

        batchCount++;
        if (batchCount * gapPeriod > minGapPeriod) {
            await delay(minGapPeriod * 1000);
            batchCount = 0;
        }
    }
}



// const particleAdder = new RepeatingFunction(() => void spawnButtonParticles(30, 1), 5);

// particleAdder.start();





export default {
    spawnButtonParticles,
};