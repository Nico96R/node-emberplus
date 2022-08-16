import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT } from '../ber';
import { Command } from './command';
import { TreeNode } from './tree-node';

export class QualifiedElement extends TreeNode {
    constructor(path: string) {
        super();
        this.setPath(path);
    }

    isQualified(): boolean {
        return true;
    }

    encode(ber: Writer): void {
        ber.startSequence(this._seqID);

        this.encodePath(ber);

        if (this.contents != null) {
            ber.startSequence(CONTEXT(1));
            this.contents.encode(ber);
            ber.endSequence(); // CONTEXT(1)
        }

        this.encodeChildren(ber);

        ber.endSequence(); // APPLICATION(3)
    }

    getCommand(cmd: Command): TreeNode {
        const r = this.getNewTree();
        const qn = new (<any>this.constructor)(this.getPath());
        r.addElement(qn);
        qn.addChild(cmd);
        return r;
    }

    toQualified(): QualifiedElement {
        return this;
    }
}
