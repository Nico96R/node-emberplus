import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION, EMBER_STRING, EMBER_RELATIVE_OID } from '../../ber';
import { MatrixContents } from './matrix-contents';
import { Matrix } from './matrix';
import { QualifiedMatrix } from './qualified-matrix';
import { UnimplementedEmberTypeError } from '../../error/errors';
import { MatrixType } from './matrix-type';
import { MatrixMode } from './matrix-mode';

export class MatrixNode extends Matrix {

    constructor(number: number, identifier: string = null, type: MatrixType = MatrixType.oneToN, mode: MatrixMode = MatrixMode.linear) {
        super(identifier, type, mode);
        this._number = number;
    }

    static decode(ber: Reader): MatrixNode {
        const m = new MatrixNode(0);
        ber = ber.getSequence(MatrixNode.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                m.setNumber(seq.readInt());
            } else if (tag === CONTEXT(1)) {
                m.setContents(MatrixContents.decode(seq));
            } else if (tag === CONTEXT(2)) {
                m.decodeChildren(seq);
            } else if (tag === CONTEXT(3)) {
                m.targets = Matrix.decodeTargets(seq);
            } else if (tag === CONTEXT(4)) {
                m.sources = Matrix.decodeSources(seq);
            } else if (tag === CONTEXT(5)) {
                m.connections = Matrix.decodeConnections(seq);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return m;
    }

    encode(ber: Writer): void {
        ber.startSequence(MatrixNode.BERID);

        ber.startSequence(CONTEXT(0));
        ber.writeInt(this.number);
        ber.endSequence(); // CONTEXT(0)

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

    getMinimal(complete = false): MatrixNode {
        const number = this.getNumber();
        const m = new MatrixNode(number);
        if (complete) {
            if (this.contents != null) {
                m.setContents(this.contents);
            }
            if (this.targets != null) {
                m.targets = this.targets;
            }
            if (this.sources != null) {
                m.sources = this.sources;
            }
            if (this.connections != null) {
                m.connections = this.connections;
            }
        }
        return m;
    }

    toQualified(): QualifiedMatrix {
        const qm = new QualifiedMatrix(this.getPath());
        qm.update(this);
        return qm;
    }

    static get BERID(): number {
        return APPLICATION(13);
    }
}
