import { ExtendedWriter as Writer, CONTEXT } from '../ber';
import { TreeNode } from './tree-node';

export class Element extends TreeNode {
    constructor(number: number) {
        super();
        this.setNumber(number);
    }

    encode(ber: Writer): void {
        ber.startSequence(this._seqID);

        this.encodeNumber(ber);

        if (this.contents != null) {
            ber.startSequence(CONTEXT(1));
            this.contents.encode(ber);
            ber.endSequence(); // CONTEXT(1)
        }

        this.encodeChildren(ber);

        ber.endSequence(); // APPLICATION(3)
    }
}
