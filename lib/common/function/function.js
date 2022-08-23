"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const element_1 = require("../element");
const function_contents_1 = require("./function-contents");
const qualified_function_1 = require("./qualified-function");
const errors_1 = require("../../error/errors");
class Function extends element_1.Element {
    constructor(number, _func, identifier) {
        super(number);
        this._func = _func;
        this._seqID = Function.BERID;
        if (identifier != null) {
            this.setContents(new function_contents_1.FunctionContents(identifier));
        }
    }
    get contents() {
        return this._contents;
    }
    get func() {
        return this._func;
    }
    get arguments() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.arguments;
    }
    set arguments(value) {
        this.setContent('arguments', value);
    }
    get result() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.result;
    }
    get templateReference() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.templateReference;
    }
    set templateReference(value) {
        this.setContent('templateReference', value);
    }
    static decode(ber) {
        const f = new Function(0);
        ber = ber.getSequence(Function.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                f.setNumber(seq.readInt());
            }
            else if (tag === ber_1.CONTEXT(1)) {
                f.setContents(function_contents_1.FunctionContents.decode(seq));
            }
            else if (tag === ber_1.CONTEXT(2)) {
                f.decodeChildren(seq);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return f;
    }
    isFunction() {
        return true;
    }
    toQualified() {
        const qf = new qualified_function_1.QualifiedFunction(this.getPath(), this.func);
        qf.update(this);
        return qf;
    }
    static get BERID() {
        return ber_1.APPLICATION(19);
    }
}
exports.Function = Function;
//# sourceMappingURL=function.js.map