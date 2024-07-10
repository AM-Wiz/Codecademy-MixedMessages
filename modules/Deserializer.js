

export class SrzClass {
    constructor(name, type, fields) {
        this._name = name;
        this._type = type;
        this._fields = fields ?? [];
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

    newEmpty() {
        return Reflect.construct(this._type, []);
    }
    
    newClone(serializer, source) {
        const t = this.newEmpty();

        this._fields.forEach(f => {
            const original = f.getValue(source);
            let v;
            if (f.owned) {
                v = serializer.clone(original);
            } else {
                v = original;
            }

            f.setValue(t, v);
        });

        return t;
    }

    onDsrz(element) {
        throw Error('Not implemented');
    }
}

export class SrzField {
    constructor(name, fieldClass) {
        this._name = name;
        this._fieldClass = fieldClass;
        this._owned = false;
    }

    /**
     * The name of the field in it's parent
     */
    get name() {
        return this._name;
    }

    /**
     * The `SrzClass` of the field
     */
    get fieldClass() {
        return this._fieldClass;
    }

    /**
     * If true, this field is considered to be owned by it's parent object
     */
    get owned() {
        return this._owned;
    }

    set owned(value) {
        if (typeof value !== 'boolean')
            throw Error('Incorrect type');

        this._owned = value;
    }
    

    /**
     * Get the value of the field on target
     * @param {*} target 
     * @returns {*} 
     */
    getValue(target) {
        return target[this.name];
    }

    /**
     * Set the value of the field on target to fieldValue
     * @param {*} target 
     * @param {*} fieldValue 
     */
    setValue(target, fieldValue) {
        target[this.name] = fieldValue;
    }
    
    /**
     * Deserialize element
     * @param {SrzElement} element 
     * @description The class is responsible for using the data in element to construct an appropriate value for element
     */
    onDsrz(element) {
        throw Error('Not implemented');
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
    
    #findNamed(name) {
        if (this._nameMap === null) {
            this._nameMap = {};

            this._classes.forEach(a => {
                this._nameMap[a.name] = a;
            });
        }

        return this._nameMap[name] ?? null;
    }

    #findConstructor(constructor) {
        return this._classes.find(c => c.type === constructor) ?? null;
    }

    get classes() {
        return this._classes;
    }

    set classes(value) {
        let converted;
        if (value instanceof Array)
            converted = value.map(Serializer.#toClass);
        else
            converted = [Serializer.#toClass(value)];
    
        this._classes = [];
        converted.forEach(a => this.#addClass(a));

        if (this._defaultClass === null || this.#findClass(this._defaultClass) < 0)
            this._defaultClass = null;

        this._nameMap = null;
    }

    #addClass(value) {
        if (this.#findClass(value) >= 0)
            return;

        this._classes.push(value);

        this._nameMap = null;

        return value;
    }

    addClass(value) {
        value = Serializer.#toClass(value);

        return this.#addClass(value);
    }

    get defaultClass() {
        return this._defaultClass;
    }
    set defaultClass(value) {
        if (!value) {
            this._defaultClass = null;
            return;
        }

        this._defaultClass = this.addClass(value);
    }


    getClass(name) {
        if (typeof name === "string") {
            return this.#findNamed(name);
        } else if (name instanceof Function) {
            return this.#findConstructor(name);
        } else {
            throw Error('Unsupported name');
        }
    }

    getClassOf(obj) {
        return this.#findConstructor(obj.constructor);
    }


    clone(obj) {
        const c = this.getClassOf(obj);
        if (!c)
            throw Error('Unknown type');

        return c.newClone(this, obj);
    }
}

export class SrzEnvironment {
    constructor(serializer) {
        this._serializer = serializer;
        this._collection = {};
        this._elementPool = [];
    }

    get serializer() {
        return this._serializer;
    }


    get valueCollection() {
        return this._collection;
    }

    getValue(name) {
        return this._collection[name] ?? null;
    }
}

function addResult(environment, name, value) {
    environment._collection[name] = value;
}

function returnElementPool(environment, element) {
    if (element._preserve)
        return;

    environment._elementPool.push(element);
}

function leaseElementPool(environment) {
    return environment._elementPool.pop() ?? new SrzElement(environment);
}





export class SrzElement {
    constructor(environment) {
        this._environment = environment;
        this._parent = null;
        this._name = null;
        this._srzField = null;
        this._srzClass = null;
        this._value = undefined;
        this._data = undefined;
        this._preserve = false;
        this._initValue = false;
    }

    get serializer() {
        return this._environment.serializer;
    }

    get environment() {
        return this._environment;
    }



    get name() {
        return this._name;
    }


    get srzField() {
        return this._srzField;
    }

    get srzClass() {
        return this._srzClass;
    }


    get data() {
        return this._data;
    }

    get dataKeys() {
        if (this._data instanceof Array)
            return [... this._data.keys()];
        else if (this._data instanceof Object)
            return Object.keys(this._data);
        else
            return undefined;
    }



    preserve() {
        if (this._preserve)
            return this;

        this.parent.preserve();
        this._preserve = true;

        return this;
    }


    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
        this._initValue = true;
    }



    get parent() {
        return this._parent;
    }

    get isTop() {
        return !!this.parent;
    }
}
  
function initializeElement(element, parent, name, field, srzClass, data) {
    element._parent = parent;
    element._name = name;
    element._field = field;
    element._srzClass = srzClass;
    element._data = data;
    element._initValue = false;
    element._value = undefined;
}

export function initializeDefaultValue(element) {
    if (element._initValue)
        return;

    element.value = element.srzClass.newEmpty();
}

export class PrimitiveSrzClass extends SrzClass {
    constructor() {
        super('primitive', Object);
    }

    newEmpty() {
        throw Error('Not supported');
    }

    onDsrz(element) {
        element.value = element.data;
    }
}

export class ArraySrzClass extends SrzClass {
    constructor(elementType) {
        super(`{innerType.name}[]`, Array);
        this._elementType = elementType;
    }

    get elementType() {
        return this._elementType;
    }

    newEmpty() {
        return [];
    }

    onDsrz(element) {
        initializeDefaultValue(element);

        element.dataKeys.forEach(k => {
            const v = element.data[k];

            element.value[k] = v;
        });
    }
}



class DefaultSrzClass extends SrzClass {
    static default = (() => {
        const d = new DefaultSrzClass("Unknown", Object);
        d._isDefault = true;
        return d;
    })();

    static #enumFields(type) {
        if (!type)
            return [];
        
        const fields = [];
        for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(type.prototype))) {
            if (!(d['get'] && d['set']))
                continue;
            if (k.startsWith('_'))
                continue;

            fields.push(new DefaultSrzField(k));
        }

        return fields;
    }

    constructor(name, type) {
        name ??= type.name;

        const fields = DefaultSrzClass.#enumFields(type);

        super(name, type, fields);
    }

    getField(name) {
        return new DefaultSrzField(name);
    }

    newEmpty() {
        if (this._isDefault === true)
            throw Error("Unknown class type");

        return super.newEmpty();
    }

    onDsrz(element) {
        initializeDefaultValue(element);

        element.dataKeys.forEach(k => {
            const v = element.data[k];

            element.value[k] = v;
        });
    }
}

class DefaultSrzField extends SrzField {

    constructor(name) {
        super(name, DefaultSrzClass.default);
    }
}

class RootSrzClass extends SrzClass {
    static default = new RootSrzClass();

    constructor() {
        super("root", null, []);
    }


    #processSingle(parent, data) {
        const inEl = loadElement(parent, null, data);

        if (!inEl.name)
            throw Error('Missing name on root element');

        enterElement(inEl);

        addResult(parent.environment, inEl.name, inEl.value);
    }

    onDsrz(el) {
        if (el.data instanceof Array) {
            el.data.forEach(value => void this.#processSingle(el, value));
        } else if (el.data instanceof Object) {
            this.#processSingle(el, el.data);
        } else {
            throw Error('Not supported');
        }
    }


    getField(name) {
        return new RootSrzField(name);
    }

    newEmpty() {
        throw Error('Not supported');
    }
}

class RootSrzField extends SrzField {
    constructor(name) {
        super(name, null);
    }

    setValue(target, fieldValue) {
        if (!(target instanceof SrzEnvironment))
            throw Error('Target was not environment');

        addResult(target, this.name, fieldValue);
    }
    
    onDsrz(element) {
        throw Error('Not implemented');
    }
}


function loadElement(parent, field, data) {
    const name = data['$name'];
    const typeName = data['$type'];
    const inheritName = data['$inherit'];
    let type;
    let inherit;

    if (typeName) {
        type = parent.serializer.getClass(typeName);
    }

    if (inheritName) {
        inherit = parent.environment.getValue(inheritName);
    }

    if (!type && inherit) {
        type = parent.serializer.getClassOf(inherit);
    }

    if (!type && field?.fieldClass) {
        type = field.fieldClass;
    }

    if (!type && parent.isTop && parent.serializer.defaultClass) {
        type = parent.serializer.defaultClass;
    }

    if (!(type instanceof SrzClass))
        throw Error("Could not determine element type");

    const el = leaseElementPool(parent.environment);


    const dataCpy = {... data};
    delete dataCpy['$name'];
    delete dataCpy['$type'];
    delete dataCpy['$inherit'];

    initializeElement(el, parent, name, field, type, dataCpy);
    
    if (inherit) {
        el.value = type.newClone(parent.serializer, inherit);
    }

    return el;
}

function enterElement(element) {
    element.srzClass.onDsrz(element);
}

function releaseElement(element) {
    initializeElement(element);
    returnElementPool(element);
}

export function writeBackElement(element) {
    if (!element.field)
        throw Error("No field associated with element");

    element.field.setValue(element.parent.value, element.value);
}

export function processElement(parent, field, data) {
    const el = loadElement(parent, field, data);
    enterElement(el);
    writeBackElement(el);
    releaseElement(el.environment, el);
}


export function deserialize(serializer, json) {
    let environment;
    if (serializer instanceof SrzEnvironment)
        environment = serializer;
    else if (serializer instanceof Serializer)
        environment = new SrzEnvironment(serializer);
    else
        throw Error('Serializer was not a serializer');

    var rootEl = leaseElementPool(environment);

    initializeElement(rootEl, environment, "root", null, RootSrzClass.default, json);

    rootEl.srzClass.onDsrz(rootEl);

    returnElementPool(environment, rootEl);

    return environment;
}