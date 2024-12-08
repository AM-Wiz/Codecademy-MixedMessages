
function isTypeClass(maybeType) {
    return maybeType && maybeType['constructor'] !== undefined;
}


export class SrzClass {

    static #processFields(fields) {
        if (!fields)
            return [];

        var fcpy = [];

        for (const f of fields) {
            if (f instanceof SrzField) {
                fcpy.push(f);
                continue;
            } else if (typeof f == 'object') {
                const name = f.name;
                const klass = f.class;
                if (!(typeof name == 'string' && klass instanceof SrzClass))
                    throw new Error('Invalid implicit field type');

                const autof = new SrzField(name, klass, f);
                fcpy.push(autof);
            } else {
                throw new Error('Invalid input');
            }
        }

        return fcpy;
    }

    /**
     * 
     * @param {Object} type 
     * @param {Object} options 
     */
    constructor(type, options = null) {
        if (!isTypeClass(type))
            throw new Error('Invalid type');

        this._name = null;
        this._type = type;
        this._fields = [];
        this._fieldMap = null;

        if (options) {
            const fields = options.fields;
            const name = options.name;
            if (fields instanceof Array)
                this.fields = fields;
            if (typeof name == 'string')
                this._name = name;
        }

        if (this._name == null)
            this._name = type.name;
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

    set fields(fields) {
        this._fields = SrzClass.#processFields(fields);
        this._fieldMap = null;
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

    /**
     * @param {SrzElement} element 
     */
    onDsrz(element) {
        element.initializeDefaultValue();

        this.fields.forEach(f => {
            f.onDsrz(element);
        });
    }
}

export class SrzField {
    constructor(name, fieldClass, options = null) {
        this._name = name;
        this._fieldClass = fieldClass;
        this._owned = false;
        this._required = true;
        this._jsName = undefined;

        if (options) {
            if (typeof options.owned == 'boolean')
                this._owned = options.owned;
            
            if (typeof options.required == 'boolean')
                this._required = options.required;
            
            if (typeof options.jsName == 'string')
                this._jsName = options.jsName;
        }

        this._jsName ??= this._name;
    }

    /**
     * The name of the field in it's parent
     */
    get name() {
        return this._name;
    }
    
    /**
     * The name of the underlying javascript field
     */
    get jsName() {
        return this._jsName;
    }

    get dataName() {
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
            throw new Error('Incorrect type');

        this._owned = value;
    }
    
    get required() {
        return this._required;
    }

    set required(value) {
        if (typeof value !== 'boolean')
            throw new Error('Incorrect type');

        this._required = value;
    }

    /**
     * Get the value of the field on target
     * @param {any} target 
     * @returns {any} 
     */
    getValue(target) {
        return target[this.jsName];
    }

    /**
     * 
     * @param {any} target 
     * @returns {boolean}
     */
    hasValue(target) {
        return this.getValue(target) !== undefined;
    }

    /**
     * Set the value of the field on target to fieldValue
     * @param {any} target 
     * @param {any} fieldValue 
     */
    setValue(target, fieldValue) {
        target[this.jsName] = fieldValue;
    }
    
    /**
     * 
     * @param {any} elementData 
     * @returns {any}
     */
    getData(elementData) {
        return elementData[this.dataName];
    }

    /**
     * Deserialize element
     * @param {SrzElement} element 
     * @description The class is responsible for using the data in element to construct an appropriate value for element
     */
    onDsrz(element) {
        const fieldData = element.data[this.dataName];
        if (fieldData == undefined) {
            if (this.hasValue(element.value))
                return;
            else if (!this.required)
                return;
            else
                throw new SrzFormatError(`Missing field ${this.name}`);
        }

        processElementField(element, this, fieldData);
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

        if (isTypeClass(value))
            return new DefaultSrzClass(value);
            
        throw new Error('Invalid type');
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

    addClasses(values) {
        for (const value of values) {
            this.addClass(value);
        }
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
            throw new Error('Unsupported name');
        }
    }

    getClassOf(obj) {
        return this.#findConstructor(obj.constructor);
    }


    clone(obj) {
        const c = this.getClassOf(obj);
        if (!c)
            throw new Error('Unknown type');

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

export class SrzFormatError extends Error {
    constructor(message, ...args) {
        super(message, ...args);
    }
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
    

    initializeDefaultValue() {
        if (this._initValue)
            return;

        this.value = this.srzClass.newEmpty();
    }

    clearValue() {
        if (this._initValue)
            return;

        this._initValue = false;
        this.value = undefined;
    }



    get parent() {
        return this._parent;
    }

    get isTop() {
        return !!this.parent;
    }
}
  
function initializeElement(element, parent, name, srzField, srzClass, data) {
    element._parent = parent;
    element._name = name;
    element._srzField = srzField;
    element._srzClass = srzClass;
    element._data = data;
    element._initValue = false;
    element._value = undefined;
}



export class PrimitiveSrzClass extends SrzClass {
    static default = (() => {
        const d = new PrimitiveSrzClass([
            "null",
            "symbol",
            "object",
            "string",
            "number",
            "boolean",
            "bigint"
        ]);
        return d;
    })();

    /**
     * 
     * @param {string|string[]} types 
     */
    constructor(types) {
        super(Object, {name:'primitive'});
        if (types instanceof Array)
            this._types = types;
        else if (typeof types == 'string')
            this._types = [types];
        else
            throw new Error('Invalid argument');
    }

    newEmpty() {
        throw new Error('Not supported');
    }


    allows(data) {
        return this._types.indexOf(typeof data) >= 0;
    }

    onDsrz(element) {
        if (!this.allows(element.data))
            throw new SrzFormatError("Element was not in list of types");

        element.value = element.data;
    }
}

export class ArraySrzClass extends SrzClass {
    constructor(elementType, options = {}) {
        var optCpy = {};
        Object.assign(optCpy, options);
        optCpy.name ??= `${elementType.name}[]`;

        super(Array, optCpy);
        this._elementType = elementType;
        this._ownsElements = options.ownsElements ?? false;
    }

    get elementType() {
        return this._elementType;
    }

    get ownsElements() {
        return this._ownsElements;
    }

    newEmpty() {
        return [];
    }

    newClone(serializer, other) {
        if (this.ownsElements)
            return other.map(serializer.clone);
        else
            return [...other];
    }

    onDsrz(element) {
        if (!(element.data instanceof Array))
            throw new SrzFormatError('Expected array');

        element.initializeDefaultValue();

        element.dataKeys.forEach(k => {
            const d = element.data[k];

            const v = readElementChild(element, this.elementType, d);

            element.value[k] = v;
        });
    }
}


export class AbstractSrzClass extends SrzClass {
    constructor(type, options = {}) {
        super(type, options);
    }

    newEmpty() {
        return null;
    }

    newClone(serializer, source) {
        const c = serializer.getClassOf(source);
        if (!c)
            throw new SrzFormatError(`Unknown type ${source.constructor}`);
        else if (c instanceof AbstractSrzClass)
            throw new SrzFormatError(`Cannot create instance of abstract class ${this.type}`);

        return c.newClone(serializer, source);
    }

    onDsrz(element) {
        throw new SrzFormatError(`Cannot create instance of abstract class ${this.type}`);
    }
}

export class DefaultSrzClass extends SrzClass {
    static default = (() => {
        const d = new DefaultSrzClass(Object, {name:"unknown", allowAnyField: true, isDefault:true});
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

    constructor(type, options = null) {
        var optCpy = {};
        Object.assign(optCpy, options);
        type ??= Object;
        optCpy.name ??= type.name;

        optCpy.fields = DefaultSrzClass.#enumFields(type);

        super(type, optCpy);
        this._allowAnyField = false;

        if (typeof optCpy.allowAnyField == 'boolean')
            this._allowAnyField = optCpy.allowAnyField;

        if (typeof optCpy.isDefault == 'boolean')
            this._isDefault = optCpy.isDefault;
    }

    get allowAnyField() {
        return this._allowAnyField;
    }

    getField(name) {
        return new DefaultSrzField(name);
    }

    newEmpty() {
        if (this._isDefault === true)
            throw new Error("Unknown class type");

        return super.newEmpty();
    }

    onDsrz(element) {
        element.initializeDefaultValue();

        element.dataKeys.forEach(k => {
            const v = element.data[k];

            element.value[k] = v;
        });
    }
}

export class DefaultSrzField extends SrzField {

    constructor(name) {
        super(name, DefaultSrzClass.default);
    }
}


export class SrzVariantError extends SrzFormatError {
    constructor(message, innerErrors, ...args) {
        super(message, ...args);
        this._innerErrors = innerErrors;
    }

    get innerErrors() {
        return this._innerErrors;
    }
    
    set innerErrors(value) {
        this._innerErrors = value;
    }
}

export class VariantSrzClass extends SrzField {
    
    /**
     * @param {String} name 
     * @param {Function} type 
     * @param {SrzClass[]} variants 
     */
    constructor(name, type, variants) {
        name ??= type.name;

        super(name, type, []);
        
        this._variants = variants;
    }

    onDsrz(element) {
        element.dataKeys.forEach(k => {
            var errors = [];

            for (const v of this._variants) {
                try {
                    element.clearValue();
                    v.onDsrz(element);

                    return;
                } catch (error) {
                    if (!(error instanceof SrzFormatError))
                        throw error;
                    errors.push(error);
                }
            }

            throw new SrzVariantError(`None of the variants for ${this._name} matched`, errors);
        });
    }
}



class RootSrzClass extends SrzClass {
    static default = new RootSrzClass();

    constructor() {
        super(RootSrzClass, {name:'root'});
    }


    #processSingle(parent, data) {
        const inEl = loadElement(parent, null, null, data);

        if (!inEl.name)
            throw new SrzFormatError('Missing name on root element');

        enterElement(inEl);

        addResult(parent.environment, inEl.name, inEl.value);
    }

    #processTopLevelArray(parent, data) {
        for (var c of data)
            this.#processSingle(parent, c);
    }

    #processTopLevel(parent, data) {
        const values = data['$values'];
        const value = data['$value'];
        if ((values ?? value) !== undefined) {
            const topType = data['$type'];
            if (topType) {
                const tt = parent.serializer.getClass(topType);
                if (!(tt instanceof SrzClass))
                    throw new SrzFormatError(`Invalid top level type ${topType}`);

                parent.environment.defaultClass = tt;
            }

            if (values !== undefined && value !== undefined)
                throw new SrzFormatError(`Top level block may not contain both a \"$values\" and \"$value\" declaration`);
            else if (Array.isArray(values))
                this.#processTopLevelArray(parent, values);
            else if (value !== undefined)
                this.#processSingle(parent, value);
            else
                throw new SrzFormatError(`Top level block had invalid format`);

        } else {
            this.#processSingle(parent, data);
        }
    }


    onDsrz(el) {
        if (el.data instanceof Array) {
            this.#processTopLevelArray(el, el.data);
        } else if (el.data instanceof Object) {
            this.#processTopLevel(el, el.data);
        } else {
            throw new SrzFormatError('Not supported');
        }
    }


    getField(name) {
        return new RootSrzField(name); // TODO Cache?
    }

    newEmpty() {
        throw new SrzFormatError('Not supported');
    }

    newClone(serializer, source) {
        throw new SrzFormatError('Not supported');
    }
}

class RootSrzField extends SrzField {
    constructor(name) {
        super(name, null);
    }

    getValue(target) {
        if (!(target instanceof SrzEnvironment))
            throw new SrzFormatError('Target was not environment');

        target.getValue(this.name);
    }

    setValue(target, fieldValue) {
        if (!(target instanceof SrzEnvironment))
            throw new SrzFormatError('Target was not environment');

        addResult(target, this.name, fieldValue);
    }
    
    onDsrz(element) {
        throw new SrzFormatError('Not implemented');
    }
}

/**
 * 
 * @param {SrzElement} parent 
 * @param {SrzField | null} field 
 * @param {SrzClass | null} klass 
 * @param {any} data 
 * @returns {SrzElement}
 */
function loadElement(parent, field, klass, data) {
    const name = data['$name'];
    const typeName = data['$type'];
    const inheritName = data['$inherit'];
    let inherit;

    if (typeName) { // Try to use the type name
        klass = parent.serializer.getClass(typeName);
    }

    if (inheritName) { // If we have an inherit declaration, get our inherited object
        inherit = parent.environment.getValue(inheritName);

        if (inherit === undefined)
            throw new Error(`No such inheritable value \"${inheritName}\"`);
    }

    if (!klass && inherit !== undefined) { // Try using the inherited type
        klass = parent.serializer.getClassOf(inherit);
    }

    if (!klass && field?.fieldClass) { // Try using the type of the field
        klass = field.fieldClass;
    }

    if (!klass && parent.isTop && parent.environment.defaultClass) { // If we are at the top level, try using the declared default type
        klass = parent.environment.defaultClass;
    }

    if (!klass && parent.isTop && parent.serializer.defaultClass) { // If we are at the top level, try using the explicit default type
        klass = parent.serializer.defaultClass;
    }

    if (!(klass instanceof SrzClass)) // No valid type could be resolved
        throw new Error("Could not determine element type");

    const el = leaseElementPool(parent.environment);

    var dataCpy;
    if (Array.isArray(data)) { // Forward arrays straight
        dataCpy = data;
    } else if (typeof data == 'object') { // Remove special names from objects
        dataCpy = {... data};
        delete dataCpy['$name'];
        delete dataCpy['$type'];
        delete dataCpy['$inherit'];
    } else { // Forward primitives stright
        dataCpy = data;
    }

    initializeElement(el, parent, name, field, klass, dataCpy);
    
    if (inherit !== undefined) { // If we have an inherit declaration, clone the inherited object
        el.value = klass.newClone(parent.serializer, inherit);
    }

    return el;
}

function enterElement(element) {
    element.srzClass.onDsrz(element);
}

function releaseElement(environment, element) {
    initializeElement(element);
    returnElementPool(environment, element);
}

/**
 * 
 * @param {SrzElement} element 
 */
export function writeBackElement(element) {
    if (!element.srzField)
        throw new Error("No field associated with element");

    element.srzField.setValue(element.parent.value, element.value);
}

/**
 * 
 * @param {SrzElement} parent 
 * @param {SrzClass} klass 
 * @param {any} data 
 * @returns any
 */
function readElementChild(parent, klass, data) {
    const el = loadElement(parent, null, klass, data);
    enterElement(el);
    const value = el.value;
    releaseElement(el.environment, el);
    return value;
}

/**
 * 
 * @param {SrzElement} parent 
 * @param {SrzField | null} field 
 * @param {any} data 
 */
export function processElementField(parent, field, data) {
    const el = loadElement(parent, field, null, data);
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
        throw new Error('Serializer was not a serializer');

    var rootEl = leaseElementPool(environment);

    initializeElement(rootEl, environment, "root", null, RootSrzClass.default, json);

    rootEl.srzClass.onDsrz(rootEl);

    returnElementPool(environment, rootEl);

    return environment;
}