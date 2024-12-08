import { ArraySrzClass, deserialize, PrimitiveSrzClass, Serializer, SrzClass } from "./modules/Deserializer.js";
import { WeightMap } from "./modules/WeightMap.js";
import { loadJSONRelative } from './modules/utilities.js';

async function loadPropMsg(path, serializer) {
    const dst = new WeightMap();

    const env = deserialize(serializer, await loadJSONRelative(path));
    for (var v of Object.values(env.valueCollection))
        dst.add(v.wgt, v);
    
    return dst;
}



export class MessageBase {
    _msg=undefined;
    _tone=undefined;
    _theme=undefined;
    _wgt=1;

    get msg() { return this._msg; }
    set msg(value) { this._msg = value; }
    
    get tone() { return this._tone; }
    set tone(value) { this._tone = value; }
    
    get theme() { return this._theme; }
    set theme(value) { this._theme = value; }
    
    get wgt() { return this._wgt; }
    set wgt(value) { this._wgt = value; }
}

export class FortMessage extends MessageBase {
}

export class PromptMessage extends MessageBase {
    _before=false;
    _after=false;

    get before() { return this._before; }
    set before(value) { this._before = value; }

    get after() { return this._after; }
    set after(value) { this._after = value; }
}

const {messages, generatorDuringMsgs, generatorIdleMsgs} = await (async () => {
    const fortSrz = new Serializer();

    fortSrz.defaultClass = new SrzClass(FortMessage, {
        fields: [
            {name:'msg', class:new PrimitiveSrzClass('string')},
            {name:'tone', class:new ArraySrzClass(new PrimitiveSrzClass('string'))},
            {name:'wgt', class:new PrimitiveSrzClass('number'), required:false},
        ],
    });
    
    const promptSrz = new Serializer();

    promptSrz.defaultClass = new SrzClass(PromptMessage, {
        fields: [
            {name:'msg', class:new PrimitiveSrzClass('string')},
            {name:'tone', class:new ArraySrzClass(new PrimitiveSrzClass('string'))},
            {name:'wgt', class:new PrimitiveSrzClass('number'), required:false},
            {name:'before', class:new PrimitiveSrzClass('boolean'), required:false},
            {name:'after', class:new PrimitiveSrzClass('boolean'), required:false},
        ],
    });
    
    const msgs = loadPropMsg('./data/messages.json', fortSrz);

    const gdmsgs = loadPropMsg('./data/gen-during-messages.json', promptSrz);
    
    const gimsgs = loadPropMsg('./data/gen-idle-messages.json', promptSrz);

    return {messages: await msgs, generatorDuringMsgs: await gdmsgs, generatorIdleMsgs: await gimsgs};
})();




function makeToneMapKey(first, second) { return `${first}+${second}`; }

const toneMap = await (async () => {
    const weightsRaw = await loadJSONRelative('./data/gen-message-weights.json');

    const map = new Map();

    weightsRaw.forEach(p => {
        const {first, second, wgt} = p;

        if (typeof first !== 'string' || typeof second !== 'string' || !(wgt > 0))
            throw new Error(`Invalid message weight-pair ${p}`);

        map.set(makeToneMapKey(first, second), wgt);
        map.set(makeToneMapKey(second, first), wgt);
    });

    return map;
})();

function toneWeighting(first, second) {
    return toneMap.get(makeToneMapKey(first, second)) ?? 1;
}


function fromToneWeighting(messages, tone, influence = 1) {
    if (typeof tone === 'string') {
        return messages.reweightBy((w, v) => {
            let mul = v.tone.reduce((acc, cur) => {
                let mul = toneWeighting(tone, cur);
        
                mul = mul * (influence) + (1 - influence);
        
                return acc * mul;
            }, 1);
        
            return w * mul;
        })
    } else if (Array.isArray(tone)) {
        return messages.reweightBy((w, v) => {
            let mul = v.tone.reduce((acc, curMsgTone) => {
                let mul = tone.reduce((acc, curKeyTone) => acc * toneWeighting(curKeyTone, curMsgTone), 1)

                mul = mul * (influence) + (1 - influence);
        
                return acc * mul;
            }, 1);
        
            return w * mul;
        })
    }
    
    return messages;
}


const tones = await (async () => {
    const tonesRaw = await loadJSONRelative('./data/message-tones.json');

    if (!Array.isArray(tonesRaw))
        throw new Error("Invalid tone format");

    return tonesRaw;
})();


/*
{ // Debug code for tone weightings
    console.log("Debugging tone weightings");
    tones.forEach(a => {
        tones.forEach(b => {
            const w = toneWeighting(a, b);

            console.log(`${a} ${b} = ${w}`);
        });
    });
}
*/


export default {
    messages,
    generatorDuringMsgs,
    generatorIdleMsgs,

    tones,

    toneWeighting,
    fromToneWeighting,
};