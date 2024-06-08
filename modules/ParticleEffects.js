import { Particle, ParticleContext, ParticleEffect } from './Particle.js';
import { Vec, vecAdd, vecMul, vecCpy, vecSub } from "./vectors.js";



export class ParticleSlowEffect extends ParticleEffect {
    constructor(amount, period = 1) {
        super();
        this.amount = amount;
        this.period = period;
    }


    beforeApply(context, particles) {
        const rat = 1 - this.amount * (context.timeStep / this.period);
        const temp = Vec(2);

        particles.forEach(p => {
            vecMul(p.velocity, rat, temp);
            p.velocity = temp;
        });
    }
}