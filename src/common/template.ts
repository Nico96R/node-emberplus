
import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION } from '../ber';
import { Element } from './element';
import { TemplateElement } from './template-element';
import { QualifiedTemplate } from './qualified-template';

export class Template extends Element {

    static get BERID(): number {
        return APPLICATION(24);
    }
    get description(): string|null {
        return this._description;
    }
    set description(description: string) {
        this._description = description;
    }

    protected _description?: string;
    constructor(number: number, public element?: Element) {
        super(number);
        this.element = element;
        this._seqID = Template.BERID;
    }

    static decode(ber: Reader): Template {
        const template = new Template(0);
        ber = ber.getSequence(Template.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                template.setNumber(seq.readInt());
            } else {
                TemplateElement.decodeContent(template, tag, seq);
            }
        }
        return template;
    }

    encode(ber: Writer): void {
        ber.startSequence(Template.BERID);
        this.encodeNumber(ber);
        TemplateElement.encodeContent(this, ber);
        ber.endSequence();
    }

    isTemplate(): boolean {
        return true;
    }

    toQualified(): QualifiedTemplate {
        const qp = new QualifiedTemplate(this.getPath());
        qp.update(this.element);
        return qp;
    }

    update(other: Template|QualifiedTemplate): boolean {
        this.element = other.element;
        return true;
    }
}
