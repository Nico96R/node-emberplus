"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_integer_pair_1 = require("./string-integer-pair");
const ber_1 = require("../ber");
const errors_1 = require("../error/errors");
class StringIntegerCollection {
    constructor() {
        this._collection = new Map();
    }
    static get BERID() {
        return ber_1.APPLICATION(8);
    }
    static decode(ber) {
        const sc = new StringIntegerCollection();
        const seq = ber.getSequence(StringIntegerCollection.BERID);
        while (seq.remain > 0) {
            const tag = seq.peek();
            if (tag !== ber_1.CONTEXT(0)) {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
            const data = seq.getSequence(ber_1.CONTEXT(0));
            const sp = string_integer_pair_1.StringIntegerPair.decode(data);
            sc.addEntry(sp.key, sp);
        }
        return sc;
    }
    addEntry(key, value) {
        this._collection.set(key, value);
    }
    get(key) {
        return this._collection.get(key);
    }
    encode(ber) {
        ber.startSequence(StringIntegerCollection.BERID);
        for (const [, sp] of this._collection) {
            ber.startSequence(ber_1.CONTEXT(0));
            sp.encode(ber);
            ber.endSequence();
        }
        ber.endSequence();
    }
    toJSON() {
        const collection = [];
        for (const [, sp] of this._collection) {
            collection.push(sp.toJSON());
        }
        return collection;
    }
}
exports.StringIntegerCollection = StringIntegerCollection;
//# sourceMappingURL=string-integer-collection.js.map