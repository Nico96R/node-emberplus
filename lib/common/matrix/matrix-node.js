"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const matrix_contents_1 = require("./matrix-contents");
const matrix_1 = require("./matrix");
const qualified_matrix_1 = require("./qualified-matrix");
const errors_1 = require("../../error/errors");
const matrix_type_1 = require("./matrix-type");
const matrix_mode_1 = require("./matrix-mode");
class MatrixNode extends matrix_1.Matrix {
    constructor(number, identifier = null, type = matrix_type_1.MatrixType.oneToN, mode = matrix_mode_1.MatrixMode.linear) {
        super(identifier, type, mode);
        this._number = number;
    }
    static decode(ber) {
        const m = new MatrixNode(0);
        ber = ber.getSequence(MatrixNode.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                m.setNumber(seq.readInt());
            }
            else if (tag === ber_1.CONTEXT(1)) {
                m.setContents(matrix_contents_1.MatrixContents.decode(seq));
            }
            else if (tag === ber_1.CONTEXT(2)) {
                m.decodeChildren(seq);
            }
            else if (tag === ber_1.CONTEXT(3)) {
                m.targets = matrix_1.Matrix.decodeTargets(seq);
            }
            else if (tag === ber_1.CONTEXT(4)) {
                m.sources = matrix_1.Matrix.decodeSources(seq);
            }
            else if (tag === ber_1.CONTEXT(5)) {
                m.connections = matrix_1.Matrix.decodeConnections(seq);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return m;
    }
    encode(ber) {
        ber.startSequence(MatrixNode.BERID);
        ber.startSequence(ber_1.CONTEXT(0));
        ber.writeInt(this.number);
        ber.endSequence();
        if (this.contents != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            this.contents.encode(ber);
            ber.endSequence();
        }
        this.encodeChildren(ber);
        this.encodeTargets(ber);
        this.encodeSources(ber);
        this.encodeConnections(ber);
        ber.endSequence();
    }
    getMinimal(complete = false) {
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
    toQualified() {
        const qm = new qualified_matrix_1.QualifiedMatrix(this.getPath());
        qm.update(this);
        return qm;
    }
    static get BERID() {
        return ber_1.APPLICATION(13);
    }
}
exports.MatrixNode = MatrixNode;
//# sourceMappingURL=matrix-node.js.map