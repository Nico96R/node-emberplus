import {ExtendedReader as Reader, CONTEXT, APPLICATION, EMBER_RELATIVE_OID } from '../ber';
import { QualifiedElement } from './qualified-element';
import { NodeContents } from './node-contents';
import { UnimplementedEmberTypeError } from '../error/errors';
import { Node } from './node';

export class QualifiedNode extends QualifiedElement {

    static get BERID(): number {
        return APPLICATION(10);
    }

    get contents(): NodeContents {
        return this._contents as NodeContents;
    }

    get isOnline(): boolean|null {
        return this.contents?.isOnline;
    }
    set isOnline(isOnline: boolean) {
        this.contents.isOnline = isOnline;
    }

    get schemaIdentifiers(): string|null {
        return this.contents?.schemaIdentifiers;
    }

    set schemaIdentifiers(schemaIdentifiers: string) {
        this.contents.schemaIdentifiers = schemaIdentifiers;
    }

    constructor (path: string, identifier?: string) {
        super(path);
        this._seqID = QualifiedNode.BERID;
        if (identifier != null) {
            this.setContents(new NodeContents(identifier));
        }
    }

    static decode(ber: Reader): QualifiedNode {
        const qn = new QualifiedNode('');
        ber = ber.getSequence(QualifiedNode.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                qn._path = seq.readRelativeOID(EMBER_RELATIVE_OID);
            } else if (tag === CONTEXT(1)) {
                qn.setContents(NodeContents.decode(seq));
            } else if (tag === CONTEXT(2)) {
                qn.decodeChildren(seq);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return qn;
    }

    isNode(): boolean {
        return true;
    }

    toElement(): Node {
        const element = new Node(this.getNumber());
        element.update(this);
        return element;
    }
}
