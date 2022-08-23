"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const qualified_element_1 = require("./qualified-element");
const template_element_1 = require("./template-element");
const template_1 = require("./template");
class QualifiedTemplate extends qualified_element_1.QualifiedElement {
    constructor(path, element) {
        super(path);
        this.element = element;
        this.element = element;
        this._seqID = QualifiedTemplate.BERID;
    }
    static get BERID() {
        return ber_1.APPLICATION(25);
    }
    get description() {
        return this._description;
    }
    set description(description) {
        this._description = description;
    }
    static decode(ber) {
        const qt = new QualifiedTemplate('');
        ber = ber.getSequence(QualifiedTemplate.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                qt.setPath(seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID));
            }
            else {
                template_element_1.TemplateElement.decodeContent(qt, tag, seq);
            }
        }
        return qt;
    }
    isTemplate() {
        return true;
    }
    encode(ber) {
        ber.startSequence(QualifiedTemplate.BERID);
        this.encodePath(ber);
        template_element_1.TemplateElement.encodeContent(this, ber);
        ber.endSequence();
    }
    toElement() {
        const element = new template_1.Template(this.getNumber());
        element.update(this);
        return element;
    }
    update(element) {
        this.element = element;
        return true;
    }
}
exports.QualifiedTemplate = QualifiedTemplate;
//# sourceMappingURL=qualified-template.js.map