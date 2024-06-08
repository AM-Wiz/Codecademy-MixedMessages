
export const button = document.querySelector('#btn-gen-message');
if (button == null)
    throw Error('Missing generator button');

export const messageField = document.querySelector('#message-field');
if (messageField == null)
    throw Error('Missing message field');