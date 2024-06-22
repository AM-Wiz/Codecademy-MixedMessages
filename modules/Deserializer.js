

export class SrzClass {
    constructor(name, type, fields) {
        this._name = name;
        this._type = type;
        this._fields = fields;
        this._fieldMap = null;
    }

    get name() {
        return this._name;
    }

    get type() {
        return this._type;
    }

    get fields() {
        return this._fields;
    }

    getField(name) {
        if (this._fieldMap === null) {
            this._fieldMap = {};

            this._fields.forEach(a => this._fieldMap[a.name] = a);
        }

        return this._fieldMap[name];
    }

    new() {
        return this._type.constructor();
    }
}

export class SrzField {
    constructor(name, fieldClass) {
        this._name = name;
        this._fieldClass = fieldClass;
    }

    get name() {
        return this._name;
    }

    get fieldClass() {
        return this._fieldClass;
    }
    

    setField(target, fieldValue) {
        target[this.name] = fieldValue;
    }
}


class DefaultSrzClass extends SrzClass {
    static default = (() => {
        const d = new DefaultSrzClass("Unknown", Object);
        d._isDefault = true;
        return d;
    })();

    constructor(name, type) {
        name ??= type.constructor.name;

        super(name, type, []);
    }

    getField(name) {
        return new DefaultSrzField(name);
    }

    new() {
        if (this._isDefault === true)
            throw Error("Unknown class type");

        return super.new();
    }
}

class DefaultSrzField extends SrzField {

    constructor(name) {
        super(name, DefaultSrzClass.default);
    }
}



export class Serializer {
    constructor() {
        this._classes = [];
        this._defaultClass = null;
        this._nameMap = {};
    }


    static #toClass(value) {
        if (value instanceof SrzClass)
            return value;

        if (value['constructor'] !== undefined)
            return new DefaultSrzClass(null, value);
            
        throw Error('Invalid type');
    }

    #findClass(value) {
        return this._classes.indexOf(value);
    }

    get classes() {
        return this._classes;
    }
    set classes(value) {
        this._classes = [];

        value.forEach(a => this.addClass(Serializer.#toClass(a)));

        if (this._defaultClass === null || this.#findClass(this._defaultClass) < 0)
            this._defaultClass = null;

        this._nameMap = null;
    }

    addClass(value) {
        value = Serializer.#toClass(value);

        if (this.#findClass(value) >= 0)
            return;

        this._classes.push(value);

        this._nameMap = null;
    }

    get defaultClass() {
        return this._defaultClass;
    }
    set defaultClass(value) {
        if (value === null) {
            this._defaultClass = null;
            return;
        }

        this.addClass(value);

        this._defaultClass = getClass(value);
    }


    getClass(name) {
        if (this._nameMap === null) {
            this._nameMap = {};

            this._classes.forEach(a => {
                this._nameMap[a.name] = a;
            });
        }

        return this._nameMap[name];
    }
}


class SrzState {
    constructor(serializer) {
        this._serializer = serializer;
        this._result = {};
    }

    get serializer() {
        return this._serializer;
    }

    get result() {
        return this._result;
    }

    addResult(name, value) {
        this._result[name] = value;
    }
}

function getClass(serializer, field, json) {
    const name = json['$type'];
    let type;
    if (name !== undefined && (type = serializer.getClass(name)) !== null)
        return type;

    if (field !== null && (type = field.class) !== null)
        return type;

    return undefined;
}

function desrzElement(state, field, json, isTop = false) {
    const c = getClass(state.serializer, field, json) ?? (isTop ? state.serializer.defaultClass : null);

    if (c === null)
        throw Error('Unknown element type');

    const inst = c.new();

    throw Error('Not implemented');
}

export function deserialize(serializer, json) {
    const state = new SrzState(serializer);
    
    if (Array.isArray(json)) {
        json.forEach(a => {
            const {name, value} = desrzElement(state, null, json);
            state.addResult(name, value);
        });
    } else {
        const {name, value} = desrzElement(state, null, json);
        state.addResult(name, value);
    }

    return result;
}