import { WeightMap } from "./modules/WeightMap.js";
import { loadJSONRelative } from './modules/utilities.js';

function msgFormatterWith(fields) {
    return (v) => {
        let w = v['wgt'] || 1;

        const res = { };

        fields.forEach(f => {
            if (typeof f === 'string') {
                res[f] = v[f];

                return;
            }

            const name = f['name'];
            const srcName = f['srcName'] || name;
            const fType = f['type'];
            const customSelector = f['customSelector'];
            const defaultValue = f['default'];

            if (typeof srcName !== 'string')
                throw Error(`Invalid field format ${f}`);

            let fv = v[srcName];

            if (fv !== undefined && typeof customSelector === 'function')
                fv = customSelector(fv);

            if (fv === undefined)
                fv = defaultValue;


            if (fType !== undefined && typeof fv !== fType) {
                if (fv == defaultValue && defaultValue === undefined && Object.hasOwn(fv, 'default')) {
                    // Value is missing, but we have an explicitly undefined 'default', so ignore
                } else
                    throw Error(`Invalid or missing field ${srcName} on ${v}`);
            }
            
            if (fv === undefined)
                return;
                
            res[name] = fv; 
        });

        return {wgt: w, data: res };
    }
}

async function loadPropMsg(path, formatter) {
    const dst = new WeightMap();

    const msgsRaw = await loadJSONRelative(path);
    if (Array.isArray(msgsRaw) !== true)
        throw Error('Invalid message data format');

    msgsRaw.forEach((v) => {
        const {wgt, data} = formatter(v);
        dst.add(wgt, data);
    });

    return dst;
}


function toneFormatter(v) {
    if (typeof v === 'string')
        return [v];
    else if (Array.isArray(v))
        return v;
    else
        throw Error(`Invalid tone type ${v}`);
}

const stdMsgFormatter = msgFormatterWith([
    {name: 'msg', type: 'string'},
    {name: 'tone', customSelector: toneFormatter, default: []},
]);


const btnMsgFormatter = msgFormatterWith([
    {name: 'msg', type: 'string'},
    {name: 'tone', customSelector: toneFormatter, default: []},
    {name: 'before', type: 'boolean', default: false},
    {name: 'after', type: 'boolean', default: false},
]);

const messages = await loadPropMsg('./data/messages.json', stdMsgFormatter);
const generatorDuringMsgs = await loadPropMsg('./data/gen-during-messages.json', stdMsgFormatter);
const generatorIdleMsgs = await loadPropMsg('./data/gen-idle-messages.json', btnMsgFormatter);


function makeToneMapKey(first, second) { return `${first}+${second}`; }

const toneMap = await (async () => {
    const weightsRaw = await loadJSONRelative('./data/gen-message-weights.json');

    const map = new Map();

    weightsRaw.forEach(p => {
        const {first, second, wgt} = p;

        if (typeof first !== 'string' || typeof second !== 'string' || !(wgt > 0))
            throw Error(`Invalid message weight-pair ${p}`);

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
        throw Error("Invalid tone format");

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