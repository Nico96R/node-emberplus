"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const parameter_type_1 = require("../parameter-type");
const errors_1 = require("../../error/errors");
class FunctionArgument {
    constructor(_type, _value, _name) {
        this._type = _type;
        this._value = _value;
        this._name = _name;
        if (isNaN(Number(_type))) {
            throw new errors_1.InvalidEmberNodeError(`Invalid Function type ${_type}`);
        }
        if (_name != null && typeof (_name) !== 'string') {
            throw new errors_1.InvalidEmberNodeError(`Invalid Function name ${_name}`);
        }
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
    }
    get type() {
        return this._type;
    }
    get name() {
        return this._name;
    }
    static decode(ber) {
        const tuple = { type: null, name: null, value: null };
        ber = ber.getSequence(FunctionArgument.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                tuple.type = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(1)) {
                tuple.name = seq.readString(ber_1.EMBER_STRING);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return new FunctionArgument(tuple.type, tuple.value, tuple.name);
    }
    encode(ber) {
        ber.startSequence(FunctionArgument.BERID);
        if (this.type == null) {
            throw new errors_1.InvalidEmberNodeError('', 'FunctionArgument requires a type');
        }
        ber.startSequence(ber_1.CONTEXT(0));
        ber.writeInt(this.type);
        ber.endSequence();
        if (this.name != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            ber.writeString(this.name, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        ber.endSequence();
    }
    toJSON() {
        return {
            type: parameter_type_1.parameterTypeToString(this.type),
            name: this.name,
            value: this.value
        };
    }
    static get BERID() {
        return ber_1.APPLICATION(21);
    }
}
exports.FunctionArgument = FunctionArgument;
//# sourceMappingURL=function-argument.js.map