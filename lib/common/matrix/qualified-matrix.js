"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const matrix_1 = require("./matrix");
const matrix_connection_1 = require("./matrix-connection");
const matrix_contents_1 = require("./matrix-contents");
const errors_1 = require("../../error/errors");
const matrix_type_1 = require("./matrix-type");
const matrix_mode_1 = require("./matrix-mode");
const matrix_node_1 = require("./matrix-node");
class QualifiedMatrix extends matrix_1.Matrix {
    static get BERID() {
        return ber_1.APPLICATION(17);
    }
    constructor(path = null, identifier = null, type = matrix_type_1.MatrixType.oneToN, mode = matrix_mode_1.MatrixMode.linear) {
        super(identifier, type, mode);
        this._path = path;
    }
    static decode(ber) {
        const qm = new QualifiedMatrix();
        ber = ber.getSequence(QualifiedMatrix.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            let seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                qm.setPath(seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID));
            }
            else if (tag === ber_1.CONTEXT(1)) {
                qm.setContents(matrix_contents_1.MatrixContents.decode(seq));
            }
            else if (tag === ber_1.CONTEXT(2)) {
                qm.decodeChildren(seq);
            }
            else if (tag === ber_1.CONTEXT(3)) {
                qm.targets = matrix_1.Matrix.decodeTargets(seq);
            }
            else if (tag === ber_1.CONTEXT(4)) {
                qm.sources = matrix_1.Matrix.decodeSources(seq);
            }
            else if (tag === ber_1.CONTEXT(5)) {
                qm.connections = {};
                seq = seq.getSequence(ber_1.EMBER_SEQUENCE);
                while (seq.remain > 0) {
                    const conSeq = seq.getSequence(ber_1.CONTEXT(0));
                    const con = matrix_connection_1.MatrixConnection.decode(conSeq);
                    if (con.target != null) {
                        qm.connections[con.target] = con;
                    }
                }
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return qm;
    }
    isQualified() {
        return true;
    }
    getCommand(cmd) {
        const r = this.getNewTree();
        const qn = new this.constructor();
        qn.setPath(this.getPath());
        r.addElement(qn);
        qn.addChild(cmd);
        return r;
    }
    connect(connections) {
        const r = this.getNewTree();
        const qn = new QualifiedMatrix();
        qn._path = this.path;
        r.addElement(qn);
        qn.connections = connections;
        return r;
    }
    encode(ber) {
        ber.startSequence(QualifiedMatrix.BERID);
        this.encodePath(ber);
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
    toElement() {
        const element = new matrix_node_1.MatrixNode(this.getNumber());
        element.update(this);
        return element;
    }
}
exports.QualifiedMatrix = QualifiedMatrix;
//# sourceMappingURL=qualified-matrix.js.map