
export const button = document.querySelector('#btn-gen-message');
if (button == null)
    throw new Error('Missing generator button');

export const messageField = document.querySelector('#message-field');
if (messageField == null)
    throw new Error('Missing message field');