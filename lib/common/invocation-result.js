"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const parameter_type_1 = require("./parameter-type");
const function_argument_1 = require("./function/function-argument");
const errors_1 = require("../error/errors");
const element_base_1 = require("./element.base");
class InvocationResult extends element_base_1.ElementBase {
    constructor(invocationId, success, result) {
        super();
        this.invocationId = invocationId;
        this.success = success;
        this.result = result;
    }
    static decode(ber) {
        const invocationResult = new InvocationResult();
        ber = ber.getSequence(InvocationResult.BERID);
        while (ber.remain > 0) {
            let tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                invocationResult.invocationId = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(1)) {
                invocationResult.success = seq.readBoolean();
            }
            else if (tag === ber_1.CONTEXT(2)) {
                invocationResult.result = [];
                const res = seq.getSequence(ber_1.EMBER_SEQUENCE);
                while (res.remain > 0) {
                    tag = res.peek();
                    if (tag === ber_1.CONTEXT(0)) {
                        const resTag = res.getSequence(ber_1.CONTEXT(0));
                        tag = resTag.peek();
                        invocationResult.result.push(new function_argument_1.FunctionArgument(parameter_type_1.ParameterTypeFromBERTAG(tag), resTag.readValue()));
                    }
                    else {
                        throw new errors_1.UnimplementedEmberTypeError(tag);
                    }
                }
                continue;
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return invocationResult;
    }
    encode(ber) {
        ber.startSequence(InvocationResult.BERID);
        if (this.invocationId != null) {
            ber.startSequence(ber_1.CONTEXT(0));
            ber.writeInt(this.invocationId);
            ber.endSequence();
        }
        if (this.success != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            ber.writeBoolean(this.success);
            ber.endSequence();
        }
        if (this.result != null && this.result.length) {
            ber.startSequence(ber_1.CONTEXT(2));
            ber.startSequence(ber_1.EMBER_SEQUENCE);
            for (let i = 0; i < this.result.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                ber.writeValue(this.result[i].value, parameter_type_1.ParameterTypeToBERTAG(this.result[i].type));
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
        ber.endSequence();
    }
    isInvocationResult() {
        return true;
    }
    setFailure() {
        this.success = false;
    }
    setSuccess() {
        this.success = true;
    }
    setResult(result) {
        this.result = result;
    }
    toJSON() {
        return {
            invocationId: this.invocationId,
            success: this.success,
            result: this.result == null ? [] : this.result.map(r => r.toJSON())
        };
    }
    toQualified() {
        return this;
    }
    static get BERID() {
        return ber_1.APPLICATION(23);
    }
}
exports.InvocationResult = InvocationResult;
//# sourceMappingURL=invocation-result.js.map