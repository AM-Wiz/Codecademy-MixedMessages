import { Particle, ParticleContext, ParticleAnchor, simulateFrame as simParticleFrame, ParticleLayer, ParticleContent, ParticleContentEffect, ParticleLayout, ParticleEffect } from './modules/Particle.js';
import { randVec, Vec, vecAdd, vecCpy, vecDiv, vecMul, vecNorm, vecSub } from './modules/vectors.js';
import { RepeatingFunction, delay, getElementSize, loadJSONRelative } from './modules/utilities.js';
import { SrzEnvironment, Serializer, SrzClass, SrzField, deserialize, ArraySrzClass, PrimitiveSrzClass, AbstractSrzClass } from './modules/Deserializer.js';

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


import { ParticleFlowEffect, ParticleSlowEffect } from './modules/ParticleEffects.js';
import { ParticleShrinkEffect } from './modules/ParticleContentEffects.js';

const particleSlowEffect = new ParticleSlowEffect(1, 0.1);
const particleFlowEffect = new ParticleFlowEffect(1000, 5);


const questionContent = new ParticleContent({
    dimensions: [50, 50],
    html: "<span class='particle-text'>?</span>",
    effects: [new ParticleShrinkEffect()],
});


const particleTypes = await (async () => {
    const srz = new Serializer();

    class PLContentField extends SrzField {
        constructor(options) {
            super(options.name, options.class, options);
        }

        getValue(target) {
            return target.content[this.jsName];
        }

        setValue(target, value) {
            target.content[this.jsName] = value;
        }
    }


    class PLClass extends SrzClass {
        constructor() {
            super(ParticleLayout, {
                fields: [
                    new PLContentField({name:'content-text', jsName: 'text', class: new PrimitiveSrzClass('string'), required: false}),
                    new PLContentField({name:'content-html', jsName: 'html', class: new PrimitiveSrzClass('string'), required: false}),
                    new PLContentField({name:'content-effect', jsName:'effects', class: new ArraySrzClass(new AbstractSrzClass(ParticleContentEffect)), required: false}),
                    new PLContentField({name:'css-class', jsName:'cssClasses', class: new ArraySrzClass(new PrimitiveSrzClass('string')), required: false}),
    
                    {name:'physics-effect', jsName:'effects', class: new ArraySrzClass(new AbstractSrzClass(ParticleEffect)), required: false},
                    {name:'max-lifetime', jsName:'maxLifetime', class: new PrimitiveSrzClass('number'), required: false},
                ]
            });
        }

        newEmpty() {
            return new ParticleLayout({
                content: new ParticleContent(),
            });
        }
    }


    class PCEClass extends SrzClass {
        
    }

    class PEClass extends SrzClass {

    }
    
    class PCEShrinkClass extends PCEClass {
        constructor() {
            super(ParticleShrinkEffect);
        }
    }

    class PESlowClass extends PEClass {
        constructor() {
            super(ParticleSlowEffect, {
                fields: [
                    {name:'amount', class:new PrimitiveSrzClass('number')},
                    {name:'period', class:new PrimitiveSrzClass('number')},
                ]
            });
        }
    }
    
    class PEFlowClass extends PEClass {
        constructor() {
            super(ParticleFlowEffect, {
                fields: [
                    {name:'force', class:new PrimitiveSrzClass('number')},
                    {name:'scale', class:new PrimitiveSrzClass('number')},
                ]
            });
        }
    }

    // srz.defaultClass = new PLClass();
    srz.addClasses([
        new PLClass(),
        new PCEShrinkClass(),
        new PESlowClass(),
        new PEFlowClass(),
    ]);

    const path = './data/particle-types.json';

    const env = deserialize(srz, await loadJSONRelative(path));


    return env.valueCollection;
    // console.log(env.valueCollection);
})();







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

        const np = new Particle(particleLayerFgd, {layout:particleTypes.question, anchor:buttonAnchor});

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