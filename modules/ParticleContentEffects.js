import { Particle, ParticleContext, ParticleContentEffect } from './Particle.js';
import { Vec, vecAdd, vecMul, vecCpy, vecSub, vecDiv } from "./vectors.js";
import { VecNoise } from "./VecNoise.js";



export class ParticleShrinkEffect extends ParticleContentEffect {
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