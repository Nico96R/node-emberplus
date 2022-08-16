import {
    ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT,
    APPLICATION, EMBER_RELATIVE_OID, EMBER_SEQUENCE
} from '../../ber';
import { Matrix, MatrixConnections } from './matrix';
import { MatrixConnection } from './matrix-connection';
import { TreeNode } from '../tree-node';
import { MatrixContents } from './matrix-contents';
import { UnimplementedEmberTypeError } from '../../error/errors';
import { Command } from '../command';
import { MatrixType } from './matrix-type';
import { MatrixMode } from './matrix-mode';
import { MatrixNode } from './matrix-node';

export class QualifiedMatrix extends Matrix {
    static get BERID(): number {
        return APPLICATION(17);
    }
    constructor(path: string = null, identifier: string = null, type: MatrixType = MatrixType.oneToN, mode: MatrixMode = MatrixMode.linear) {
        super(identifier, type, mode);
        this._path = path;
    }

    static decode(ber: Reader): QualifiedMatrix {
        const qm = new QualifiedMatrix();
        ber = ber.getSequence(QualifiedMatrix.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            let seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                qm.setPath(seq.readRelativeOID(EMBER_RELATIVE_OID));
            } else if (tag === CONTEXT(1)) {
                qm.setContents(MatrixContents.decode(seq));
            } else if (tag === CONTEXT(2)) {
                qm.decodeChildren(seq);
            } else if (tag === CONTEXT(3)) {
                qm.targets = Matrix.decodeTargets(seq);
            } else if (tag === CONTEXT(4)) {
                qm.sources = Matrix.decodeSources(seq);
            } else if (tag === CONTEXT(5)) {
                qm.connections = {};
                seq = seq.getSequence(EMBER_SEQUENCE);
                while (seq.remain > 0) {
                    const conSeq = seq.getSequence(CONTEXT(0));
                    const con = MatrixConnection.decode(conSeq);
                    if (con.target != null) {
                        qm.connections[con.target] = con;
                    }
                }
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return qm;
    }

    isQualified(): boolean {
        return true;
    }

        // !!! We need to add this getCommnand here again because
    // !!! QualifiedMatrix extends Matrix which extends Element.

    /**
     *
     * @param {Command} cmd
     * @returns {TreeNode}
     */
    getCommand(cmd:  Command): TreeNode {
        const r = this.getNewTree();
        const qn = new (<any>this.constructor)();
        qn.setPath(this.getPath());
        r.addElement(qn);
        qn.addChild(cmd);
        return r;
    }

    connect(connections: MatrixConnections): TreeNode {
        const r = this.getNewTree();
        const qn = new QualifiedMatrix();
        qn._path = this.path;
        r.addElement(qn);
        qn.connections = connections;
        return r;
    }

    encode(ber: Writer): void {
        ber.startSequence(QualifiedMatrix.BERID);

        this.encodePath(ber);

        if (this.contents != null) {
            ber.startSequence(CONTEXT(1));
            this.contents.encode(ber);
            ber.endSequence(); // CONTEXT(1)
        }

        this.encodeChildren(ber);
        this.encodeTargets(ber);
        this.encodeSources(ber);
        this.encodeConnections(ber);

        ber.endSequence(); // APPLICATION(3)
    }

    toElement(): MatrixNode {
        const element = new MatrixNode(this.getNumber());
        element.update(this);
        return element;
    }
}
