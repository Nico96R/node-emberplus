"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const element_1 = require("./element");
const template_element_1 = require("./template-element");
const qualified_template_1 = require("./qualified-template");
class Template extends element_1.Element {
    constructor(number, element) {
        super(number);
        this.element = element;
        this.element = element;
        this._seqID = Template.BERID;
    }
    static get BERID() {
        return ber_1.APPLICATION(24);
    }
    get description() {
        return this._description;
    }
    set description(description) {
        this._description = description;
    }
    static decode(ber) {
        const template = new Template(0);
        ber = ber.getSequence(Template.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                template.setNumber(seq.readInt());
            }
            else {
                template_element_1.TemplateElement.decodeContent(template, tag, seq);
            }
        }
        return template;
    }
    encode(ber) {
        ber.startSequence(Template.BERID);
        this.encodeNumber(ber);
        template_element_1.TemplateElement.encodeContent(this, ber);
        ber.endSequence();
    }
    isTemplate() {
        return true;
    }
    toQualified() {
        const qp = new qualified_template_1.QualifiedTemplate(this.getPath());
        qp.update(this.element);
        return qp;
    }
    update(other) {
        this.element = other.element;
        return true;
    }
}
exports.Template = Template;
//# sourceMappingURL=template.js.map