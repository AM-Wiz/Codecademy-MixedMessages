export async function loadJSONRelative(path) {
    const rep = await fetch(path);
    const text = await rep.text();
    return JSON.parse(text);
}



export function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}


