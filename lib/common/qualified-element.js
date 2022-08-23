"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const tree_node_1 = require("./tree-node");
class QualifiedElement extends tree_node_1.TreeNode {
    constructor(path) {
        super();
        this.setPath(path);
    }
    isQualified() {
        return true;
    }
    encode(ber) {
        ber.startSequence(this._seqID);
        this.encodePath(ber);
        if (this.contents != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            this.contents.encode(ber);
            ber.endSequence();
        }
        this.encodeChildren(ber);
        ber.endSequence();
    }
    getCommand(cmd) {
        const r = this.getNewTree();
        const qn = new this.constructor(this.getPath());
        r.addElement(qn);
        qn.addChild(cmd);
        return r;
    }
    toQualified() {
        return this;
    }
}
exports.QualifiedElement = QualifiedElement;
//# sourceMappingURL=qualified-element.js.map