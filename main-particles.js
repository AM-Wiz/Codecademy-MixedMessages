import { Particle, ParticleContext, ParticleAnchor, simulateFrame as simParticleFrame, ParticleLayer } from './modules/Particle.js';
import { ParticleFlowEffect, ParticleSlowEffect } from './modules/ParticleEffects.js';
import { randVec, Vec, vecAdd, vecCpy, vecDiv, vecMul, vecNorm, vecSub } from './modules/vectors.js';
import { RepeatingFunction, getElementSize } from './modules/utilities.js';

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


const particleSlowEffect = new ParticleSlowEffect(1, 0.5);
const particleFlowEffect = new ParticleFlowEffect(1000, 5);
export function spawnButtonParticles() {
    const surf = new RectEmission([0, 0], getElementSize(buttonAnchor.element));

    let posScratch = Vec(2);
    let velScratchA = Vec(2), velScratchB = Vec(2);

    for (let i = 0; i < 20; i++) {
        const np = new Particle(particleLayerFgd, "?", 30, buttonAnchor);
        np.addEffect(particleSlowEffect);
        np.addEffect(particleFlowEffect);

        surf.randomSurfacePos(posScratch);
        np.position = posScratch;
        
        {
            vecNorm(posScratch, velScratchA);

            randVec(velScratchB);
            vecMul(velScratchB, 0.2, velScratchB);
            
            vecAdd(velScratchA, velScratchB, velScratchA);

            vecMul(velScratchA, 100, velScratchA);
            np.velocity = velScratchA;
        }
        particleContext.addParticle(np);
    }
}



const particleAdder = new RepeatingFunction(() => void spawnButtonParticles(), 3);

particleAdder.start();





export default {

};