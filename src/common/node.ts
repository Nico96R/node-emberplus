import { ExtendedReader as Reader, CONTEXT, APPLICATION } from '../ber';
import { Element } from './element';
import { NodeContents } from './node-contents';
import { QualifiedNode } from './qualified-node';
import { UnimplementedEmberTypeError } from '../error/errors';

export interface JNode {
    number: number;
    path: string;
    children: object[];
    identifier?: string;
    description?: string;
    isRoot?: boolean;
    isOnline?: boolean;
    schemaIdentifiers?: string;
    templateReference?: string;
}

export class Node extends Element {

    static get BERID(): number {
        return APPLICATION(3);
    }

    get contents(): NodeContents {
        return this._contents as NodeContents;
    }

    get isOnline(): boolean|null {
        return this.contents?.isOnline;
    }
    set isOnline(isOnline: boolean) {
        this.setContent('isOnline', isOnline);
    }

    get schemaIdentifiers(): string|null {
        return this.contents?.schemaIdentifiers;
    }

    set schemaIdentifiers(schemaIdentifiers: string) {
        this.setContent('schemaIdentifiers', schemaIdentifiers);
    }

    constructor(number: number, identifier?: string) {
        super(number);
        this._seqID = Node.BERID;
        if (identifier != null) {
            this.setContents(new NodeContents(identifier));
        }
    }

    static decode(ber: Reader): Node {
        const n = new Node(0);
        ber = ber.getSequence(Node.BERID);

        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                n.setNumber(seq.readInt());
            } else if (tag === CONTEXT(1)) {
                n.setContents(NodeContents.decode(seq));
            } else if (tag === CONTEXT(2)) {
                n.decodeChildren(seq);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return n;
    }

    isNode(): boolean {
        return true;
    }

    toQualified(): QualifiedNode {
        const qn = new QualifiedNode(this.getPath());
        qn.update(this);
        return qn;
    }
}
