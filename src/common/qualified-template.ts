import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION, EMBER_RELATIVE_OID } from '../ber';
import { QualifiedElement } from './qualified-element';
import { TemplateElement } from './template-element';
import { Element } from './element';
import { Template } from './template';

export class QualifiedTemplate extends QualifiedElement {

    static get BERID(): number {
        return APPLICATION(25);
    }
    get description(): string|null {
        return this._description;
    }
    set description(description: string) {
        this._description = description;
    }

    protected _description?: string;

    constructor(path: string, public element?: Element) {
        super(path);
        this.element = element;
        this._seqID = QualifiedTemplate.BERID;
    }

    static decode(ber: Reader): QualifiedTemplate {
        const qt = new QualifiedTemplate('');
        ber = ber.getSequence(QualifiedTemplate.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                qt.setPath(seq.readRelativeOID(EMBER_RELATIVE_OID));
            } else {
                TemplateElement.decodeContent(qt, tag, seq);
            }
        }
        return qt;
    }

    isTemplate(): boolean {
        return true;
    }

    encode(ber: Writer): void {
        ber.startSequence(QualifiedTemplate.BERID);

        this.encodePath(ber);

        TemplateElement.encodeContent(this, ber);

        ber.endSequence();
    }

    toElement(): Template {
        const element: Template = new Template(this.getNumber());
        element.update(this);
        return element;
    }

    update(element: Element): boolean {
        this.element = element;
        return true;
    }
}
