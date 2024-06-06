export class Entry {
    constructor(weight, value) {
        this.weight = weight;
        this.value = value;
    }
}

export class WeightMap {
    constructor(initial = undefined) {
        this.entries_ = [];
        this.total_ = 0;

        if (Array.isArray(initial)) {
            initial.forEach(e => this.add(e.weight, e.value));
        } else if (typeof initial === 'object' && initial.constructor?.name === 'Entry') {
            this.add(initial.weight, initial.value);
        } else if (initial !== undefined) {
            throw Error('Bad initial value');
        }
    }

    add(weight, value) {
        if (!(weight > 0))
            throw Error('Invalid weight!');

        this.total_ += weight
        
        this.entries_.push(new Entry(weight, value));
    }

    getRandom() {
        if (this.entries_.length < 1)
            return undefined;

        const pidx = Math.random() * this.total_;
        let idx = 0;
        
        for (let acc = 0; ; idx++) {
            acc += this.entries_[idx].weight;
            if (acc >= pidx)
                break;
        }

        return this.entries_[idx].value;
    }
    
    reweightBy(weightFunc) {
        const eCpy = this.entries_.map(
            e => {
                const newWeight = weightFunc(e.weight, e.value);
                if (!(newWeight >= 0))
                    throw Error('Invalid reweighting');
                
                return new Entry(newWeight, e.value);
            }
        ).filter(
            e => e.weight > 0
        );
        
        return new WeightMap(eCpy);
    }
};