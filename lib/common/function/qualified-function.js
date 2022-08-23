"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const qualified_element_1 = require("../qualified-element");
const function_contents_1 = require("./function-contents");
const errors_1 = require("../../error/errors");
const function_1 = require("./function");
class QualifiedFunction extends qualified_element_1.QualifiedElement {
    constructor(path, func, identifier) {
        super(path);
        this.func = func;
        this.func = func;
        this._seqID = QualifiedFunction.BERID;
        if (identifier != null) {
            this.setContents(new function_contents_1.FunctionContents(identifier));
        }
    }
    static get BERID() {
        return ber_1.APPLICATION(20);
    }
    get contents() {
        return this._contents;
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
        const qf = new QualifiedFunction('');
        ber = ber.getSequence(QualifiedFunction.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                qf.setPath(seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID));
            }
            else if (tag === ber_1.CONTEXT(1)) {
                qf.setContents(function_contents_1.FunctionContents.decode(seq));
            }
            else if (tag === ber_1.CONTEXT(2)) {
                qf.decodeChildren(seq);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return qf;
    }
    isFunction() {
        return true;
    }
    toElement() {
        const element = new function_1.Function(this.getNumber(), this.func);
        element.update(this);
        return element;
    }
}
exports.QualifiedFunction = QualifiedFunction;
//# sourceMappingURL=qualified-function.js.map