"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const function_argument_1 = require("./function-argument");
const errors_1 = require("../../error/errors");
class FunctionContents {
    constructor(_identifier, _description) {
        this._identifier = _identifier;
        this._description = _description;
        this._arguments = [];
        this._result = [];
    }
    get identifier() {
        return this._identifier;
    }
    set identifier(value) {
        this._identifier = value;
    }
    get description() {
        return this._description;
    }
    set description(description) {
        this._description = description;
    }
    get arguments() {
        return this._arguments;
    }
    set arguments(value) {
        this._arguments = value;
    }
    get result() {
        return this._result;
    }
    set result(result) {
        this._result = result;
    }
    get templateReference() {
        return this._templateReference;
    }
    set templateReference(value) {
        this._templateReference = value;
    }
    static decode(ber) {
        const fc = new FunctionContents();
        ber = ber.getSequence(ber_1.EMBER_SET);
        while (ber.remain > 0) {
            let tag = ber.peek();
            let seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                fc._identifier = seq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(1)) {
                fc._description = seq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(2)) {
                fc._arguments = [];
                const dataSeq = seq.getSequence(ber_1.EMBER_SEQUENCE);
                while (dataSeq.remain > 0) {
                    seq = dataSeq.getSequence(ber_1.CONTEXT(0));
                    fc._arguments.push(function_argument_1.FunctionArgument.decode(seq));
                }
            }
            else if (tag === ber_1.CONTEXT(3)) {
                fc._result = [];
                const dataSeq = seq.getSequence(ber_1.EMBER_SEQUENCE);
                while (dataSeq.remain > 0) {
                    tag = dataSeq.peek();
                    if (tag === ber_1.CONTEXT(0)) {
                        const fcSeq = dataSeq.getSequence(tag);
                        fc.result.push(function_argument_1.FunctionArgument.decode(fcSeq));
                    }
                    else {
                        throw new errors_1.UnimplementedEmberTypeError(tag);
                    }
                }
            }
            else if (tag === ber_1.CONTEXT(4)) {
                fc.templateReference = seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return fc;
    }
    encode(ber) {
        ber.startSequence(ber_1.EMBER_SET);
        if (this.identifier != null) {
            ber.startSequence(ber_1.CONTEXT(0));
            ber.writeString(this.identifier, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        if (this.description != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            ber.writeString(this.description, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        if (this.arguments != null) {
            ber.startSequence(ber_1.CONTEXT(2));
            ber.startSequence(ber_1.EMBER_SEQUENCE);
            for (let i = 0; i < this.arguments.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                this.arguments[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
        if (this.result != null && this.result.length > 0) {
            ber.startSequence(ber_1.CONTEXT(3));
            ber.startSequence(ber_1.EMBER_SEQUENCE);
            for (let i = 0; i < this.result.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                this.result[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
        if (this.templateReference != null) {
            ber.startSequence(ber_1.CONTEXT(4));
            ber.writeRelativeOID(this.templateReference, ber_1.EMBER_RELATIVE_OID);
            ber.endSequence();
        }
        ber.endSequence();
    }
    toJSON() {
        return {
            identifier: this.identifier,
            description: this.description,
            arguments: this.arguments.map(a => a.toJSON()),
            result: this.result.map(r => r.toJSON()),
            templateReference: this.templateReference
        };
    }
}
exports.FunctionContents = FunctionContents;
//# sourceMappingURL=function-contents.js.map