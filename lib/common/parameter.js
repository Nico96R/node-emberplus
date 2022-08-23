"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const element_1 = require("./element");
const parameter_contents_1 = require("./parameter-contents");
const qualified_parameter_1 = require("./qualified-parameter");
const errors_1 = require("../error/errors");
class Parameter extends element_1.Element {
    static get BERID() {
        return ber_1.APPLICATION(1);
    }
    get contents() {
        return this._contents;
    }
    get minimum() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.minimum;
    }
    set minimum(minimum) {
        this.setContent('minimum', minimum);
    }
    get maximum() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.maximum;
    }
    set maximum(maximum) {
        this.setContent('maximum', maximum);
    }
    get access() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.access;
    }
    set access(access) {
        this.setContent('access', access);
    }
    get format() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.format;
    }
    set format(format) {
        this.setContent('format', format);
    }
    get enumeration() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.enumeration;
    }
    set enumeration(enumeration) {
        this.setContent('enumeration', enumeration);
    }
    get factor() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.factor;
    }
    set factor(factor) {
        this.setContent('factor', factor);
    }
    get isOnline() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.isOnline;
    }
    set isOnline(isOnline) {
        this.setContent('isOnline', isOnline);
    }
    get formula() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.formula;
    }
    set formula(formula) {
        this.setContent('formula', formula);
    }
    get step() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.step;
    }
    set step(step) {
        this.setContent('step', step);
    }
    get default() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.default;
    }
    set default(value) {
        this.setContent('default', value);
    }
    get value() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.value;
    }
    set value(value) {
        this.setContent('value', value);
    }
    get streamIdentifier() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.streamIdentifier;
    }
    set streamIdentifier(streamIdentifier) {
        this.setContent('streamIdentifier', streamIdentifier);
    }
    get enumMap() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.enumMap;
    }
    set enumMap(enumMap) {
        this.setContent('enumMap', enumMap);
    }
    get streamDescriptor() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.streamDescriptor;
    }
    set streamDescriptor(streamDescriptor) {
        this.setContent('streamDescriptor', streamDescriptor);
    }
    get schemaIdentifiers() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.schemaIdentifiers;
    }
    set schemaIdentifiers(schemaIdentifiers) {
        this.setContent('schemaIdentifiers', schemaIdentifiers);
    }
    get type() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.type;
    }
    set type(type) {
        this.setContent('type', type);
    }
    constructor(number, type, value) {
        super(number);
        this._seqID = Parameter.BERID;
        if (type != null) {
            this.setContents(new parameter_contents_1.ParameterContents(type, value));
        }
    }
    static decode(ber) {
        const p = new Parameter(0);
        ber = ber.getSequence(Parameter.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                p.setNumber(seq.readInt());
            }
            else if (tag === ber_1.CONTEXT(1)) {
                p.setContents(parameter_contents_1.ParameterContents.decode(seq));
            }
            else if (tag === ber_1.CONTEXT(2)) {
                p.decodeChildren(seq);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return p;
    }
    isParameter() {
        return true;
    }
    isStream() {
        return this.contents != null &&
            this.contents.streamIdentifier != null;
    }
    setValue(value) {
        return this.getTreeBranch(undefined, (m) => {
            m.setContents((value instanceof parameter_contents_1.ParameterContents) ? value : parameter_contents_1.ParameterContents.createParameterContent(value));
        });
    }
    toQualified() {
        const qp = new qualified_parameter_1.QualifiedParameter(this.getPath());
        qp.update(this);
        return qp;
    }
}
exports.Parameter = Parameter;
//# sourceMappingURL=parameter.js.map