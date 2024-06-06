import { delay } from './modules/utilities.js';

const button = document.querySelector('#btn-gen-message');
if (button == null)
    throw Error('Missing generator button');

const messageField = document.querySelector('#message-field');
if (messageField == null)
    throw Error('Missing message field');


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