"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const function_argument_1 = require("./function/function-argument");
const parameter_type_1 = require("./parameter-type");
const errors_1 = require("../error/errors");
let _id = 1;
class Invocation {
    constructor(id, args) {
        this.id = id;
        this.arguments = args;
    }
    static decode(ber) {
        const invocation = new Invocation();
        ber = ber.getSequence(Invocation.BERID);
        while (ber.remain > 0) {
            let tag = ber.peek();
            let seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                invocation.id = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(1)) {
                invocation.arguments = [];
                seq = seq.getSequence(ber_1.EMBER_SEQUENCE);
                while (seq.remain > 0) {
                    const dataSeq = seq.getSequence(ber_1.CONTEXT(0));
                    tag = dataSeq.peek();
                    const val = dataSeq.readValue();
                    invocation.arguments.push(new function_argument_1.FunctionArgument(parameter_type_1.ParameterTypeFromBERTAG(tag), val));
                }
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return invocation;
    }
    static newInvocationID() {
        return _id++;
    }
    encode(ber) {
        ber.startSequence(Invocation.BERID);
        if (this.id != null) {
            ber.startSequence(ber_1.CONTEXT(0));
            ber.writeInt(this.id);
            ber.endSequence();
        }
        if (this.arguments != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            ber.startSequence(ber_1.EMBER_SEQUENCE);
            for (let i = 0; i < this.arguments.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                ber.writeValue(this.arguments[i].value, parameter_type_1.ParameterTypeToBERTAG(this.arguments[i].type));
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
        ber.endSequence();
    }
    toJSON() {
        var _a;
        return {
            id: this.id,
            arguments: (_a = this.arguments) === null || _a === void 0 ? void 0 : _a.map(a => a.toJSON())
        };
    }
    static get BERID() {
        return ber_1.APPLICATION(22);
    }
}
exports.Invocation = Invocation;
//# sourceMappingURL=invocation.js.map