import { Particle, ParticleContext, ParticleAnchor, simulateFrame as simParticleFrame, ParticleLayer } from './modules/Particle.js';
import { ParticleSlowEffect } from './modules/ParticleEffects.js';
import { randVec, Vec, vecMul } from './modules/vectors.js';
import { RepeatingFunction } from './modules/utilities.js';

import { button, messageField } from './main-layout.js';

const particleFrame = document.querySelector('#particle-frame');
const particleContext = new ParticleContext(particleFrame);
const particleLayer = new ParticleLayer(particleContext, particleFrame);

const pFrequency = 30;
const particleHandler = new RepeatingFunction(() => {

    simParticleFrame(particleContext, 1.0 / pFrequency);

    //console.log('In handler');
}, 1.0 / pFrequency);

particleHandler.start();

const buttonAnchor = new ParticleAnchor(particleContext, button, null);
const particleSlowEffect = new ParticleSlowEffect(1, 0.5);
const particleAdder = new RepeatingFunction(() => {
    for (let i = 0; i < 20; i++) {
        const np = new Particle(particleLayer, "?", 5, buttonAnchor);
        np.addEffect(particleSlowEffect);

        np.velocity = vecMul(randVec(Vec(2)), 200);
        particleContext.addParticle(np);
    }
}, 3);

particleAdder.start();





export default {

};