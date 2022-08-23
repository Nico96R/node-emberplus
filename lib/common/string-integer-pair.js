"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const errors_1 = require("../error/errors");
class StringIntegerPair {
    constructor(_key, _value) {
        this._key = _key;
        this._value = _value;
    }
    static get BERID() {
        return ber_1.APPLICATION(7);
    }
    get key() {
        return this._key;
    }
    set key(key) {
        if (typeof (key) !== 'string') {
            throw new errors_1.InvalidEmberNodeError('', 'Invalid key');
        }
        this._key = key;
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (typeof (value) !== 'number') {
            throw new errors_1.InvalidEmberNodeError('', 'Invalid value');
        }
        this._value = value;
    }
    static decode(ber) {
        const sp = { key: null, value: null };
        const seq = ber.getSequence(StringIntegerPair.BERID);
        while (seq.remain > 0) {
            const tag = seq.peek();
            const dataSeq = seq.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                sp.key = dataSeq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(1)) {
                sp.value = dataSeq.readInt();
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return new StringIntegerPair(sp.key, sp.value);
    }
    encode(ber) {
        ber.startSequence(StringIntegerPair.BERID);
        ber.startSequence(ber_1.CONTEXT(0));
        ber.writeString(this.key, ber_1.EMBER_STRING);
        ber.endSequence();
        ber.startSequence(ber_1.CONTEXT(1));
        ber.writeInt(this.value);
        ber.endSequence();
        ber.endSequence();
    }
    toJSON() {
        return {
            key: this.key,
            value: this.value
        };
    }
}
exports.StringIntegerPair = StringIntegerPair;
//# sourceMappingURL=string-integer-pair.js.map