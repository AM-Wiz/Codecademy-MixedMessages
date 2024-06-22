import { Particle, ParticleContext, ParticleEffect } from './Particle.js';
import { Vec, vecAdd, vecMul, vecCpy, vecSub, vecDiv } from "./vectors.js";
import { VecNoise } from "./VecNoise.js";



export class ParticleSlowEffect extends ParticleEffect {
    constructor(amount = 1, period = 1) {
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


export class ParticleFlowEffect extends ParticleEffect {
    constructor(force = 10, scale = 1) {
        super();
        this.force = force;
        this.scale = scale;

        this.noise = new VecNoise();
    }

    beforeVel(context, particles) {
        const temp = Vec(2);
        const temp1 = Vec(2);
        const accAmt = context.timeStep;

        particles.forEach(p => {
            vecDiv(p.position, this.scale, temp);

            this.noise.curl2x1(temp, temp1);

            vecMul(temp1, -this.force * accAmt, temp1);

            vecAdd(p.velocity, temp1, temp);

            p.velocity = temp;
        });
    }
}