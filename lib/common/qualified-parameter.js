"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const qualified_element_1 = require("./qualified-element");
const parameter_contents_1 = require("./parameter-contents");
const errors_1 = require("../error/errors");
const parameter_type_1 = require("./parameter-type");
const parameter_1 = require("./parameter");
class QualifiedParameter extends qualified_element_1.QualifiedElement {
    static get BERID() {
        return ber_1.APPLICATION(9);
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
    constructor(path, type, value) {
        super(path);
        this._seqID = QualifiedParameter.BERID;
        if (type != null) {
            this.setContents(new parameter_contents_1.ParameterContents(type, value));
        }
    }
    static decode(ber) {
        const qp = new QualifiedParameter('');
        ber = ber.getSequence(QualifiedParameter.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                qp.setPath(seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID));
            }
            else if (tag === ber_1.CONTEXT(1)) {
                qp.setContents(parameter_contents_1.ParameterContents.decode(seq));
            }
            else if (tag === ber_1.CONTEXT(2)) {
                qp.decodeChildren(seq);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return qp;
    }
    isParameter() {
        return true;
    }
    isStream() {
        return this.contents != null &&
            this.contents.streamIdentifier != null;
    }
    setValue(value) {
        const r = this.getNewTree();
        const qp = new QualifiedParameter(this.path);
        r.addElement(qp);
        qp.setContents((value instanceof parameter_contents_1.ParameterContents) ? value : new parameter_contents_1.ParameterContents(parameter_type_1.ParameterType.integer, value));
        return r;
    }
    toElement() {
        const element = new parameter_1.Parameter(this.getNumber());
        element.update(this);
        return element;
    }
}
exports.QualifiedParameter = QualifiedParameter;
//# sourceMappingURL=qualified-parameter.js.map