import { delay, getElementPosition, RepeatingFunction } from './modules/utilities.js';
import { button, messageField } from './main-layout.js';
import mainParticles from './main-particles.js';

import Messages from './messages.js'
const beforeMessages = Messages.generatorIdleMsgs.reweightBy((w, v) => v.before ? w : 0);
const afterMessages = Messages.generatorIdleMsgs.reweightBy((w, v) => v.after ? w : 0);


const minGenWait = 0.5, maxGenWait = 3;

let waiting = false;

button.addEventListener('click', async (e) => {
    if (waiting)
        return;

    const waitSeconds = (maxGenWait - minGenWait) * Math.random() + minGenWait;
    var curDelay = delay(Math.floor(waitSeconds * 1000));

    const weightedBeforeMsgs = Messages.generatorDuringMsgs;
    const beforeMsg = weightedBeforeMsgs.getRandom();
    const weightedMsgs = Messages.fromToneWeighting(Messages.messages, beforeMsg.tone);
    const msg = weightedMsgs.getRandom();
    const weightedAfterMsgs = Messages.fromToneWeighting(afterMessages, msg.tone);
    const afterMsg = weightedAfterMsgs.getRandom();

    mainParticles.spawnButtonParticles(30, 0.5, waitSeconds);

    console.log(weightedBeforeMsgs);
    console.log(beforeMsg.tone);
    console.log(weightedMsgs);
    console.log(msg.tone);
    console.log(weightedAfterMsgs);
    console.log(afterMsg.tone);


    messageField.innerHTML = "...";
    button.innerHTML = beforeMsg.msg;

    waiting = true;
    await curDelay;

    messageField.innerHTML = msg.msg;
    button.innerHTML = afterMsg.msg; // TODO

    waiting = false;
});


{
    const happyMessages = Messages.fromToneWeighting(beforeMessages, 'hopeful', 0.9);

    const genMsg = happyMessages.getRandom();

    button.innerHTML = genMsg.msg;
}


import { deserialize, PrimitiveSrzClass, Serializer, SrzClass } from './modules/Deserializer.js';

{
    class TestClass {
        constructor() {
            
        }

        valueC = null;
        
        _valueA = null;
        _valueB = null;
        _valueD = null;
        _valueE = null;

        get valueA() {
            return this._valueA;
        }

        set valueA(value) {
            this._valueA = value;
        }
        
        get valueB() {
            return this._valueB;
        }

        set valueB(value) {
            this._valueB = value;
        }
        
        get valueE() {
            return this._valueE;
        }

        set valueE(value) {
            this._valueE = value;
        }
    }


    const testJson = [
        {
            "$name": "A",
            "$type": "TestClass",
            "valueA": 5,
            "valueE": {"x": 5.5, "y": 6},
        },
        {
            "$name": "B",
            "$inherit": "A",
            "valueB": "text",
        }
    ];

    const testSrz = new Serializer();
    testSrz.addClasses([
        new SrzClass(TestClass, {
            fields: [
                {name:"valueA", class: new PrimitiveSrzClass('number')},
                {name:"valueB", class: new PrimitiveSrzClass('string'), required: false},
                {name:"valueC", class: new PrimitiveSrzClass('boolean'), required: false},
                {name:"valueE", class: new PrimitiveSrzClass('object')},
            ]
        })
    ]);

    console.log(testSrz);

    const result = deserialize(testSrz, testJson);

    console.log(result.valueCollection);
}

// console.log(getElementPosition(document.body, particleFrame));
// console.log(getElementPosition(document.body, button));