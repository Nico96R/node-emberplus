"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const tree_node_1 = require("./tree-node");
class Element extends tree_node_1.TreeNode {
    constructor(number) {
        super();
        this.setNumber(number);
    }
    encode(ber) {
        ber.startSequence(this._seqID);
        this.encodeNumber(ber);
        if (this.contents != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            this.contents.encode(ber);
            ber.endSequence();
        }
        this.encodeChildren(ber);
        ber.endSequence();
    }
}
exports.Element = Element;
//# sourceMappingURL=element.js.map