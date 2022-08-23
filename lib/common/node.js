"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const element_1 = require("./element");
const node_contents_1 = require("./node-contents");
const qualified_node_1 = require("./qualified-node");
const errors_1 = require("../error/errors");
class Node extends element_1.Element {
    static get BERID() {
        return ber_1.APPLICATION(3);
    }
    get contents() {
        return this._contents;
    }
    get isOnline() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.isOnline;
    }
    set isOnline(isOnline) {
        this.setContent('isOnline', isOnline);
    }
    get schemaIdentifiers() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.schemaIdentifiers;
    }
    set schemaIdentifiers(schemaIdentifiers) {
        this.setContent('schemaIdentifiers', schemaIdentifiers);
    }
    constructor(number, identifier) {
        super(number);
        this._seqID = Node.BERID;
        if (identifier != null) {
            this.setContents(new node_contents_1.NodeContents(identifier));
        }
    }
    static decode(ber) {
        const n = new Node(0);
        ber = ber.getSequence(Node.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                n.setNumber(seq.readInt());
            }
            else if (tag === ber_1.CONTEXT(1)) {
                n.setContents(node_contents_1.NodeContents.decode(seq));
            }
            else if (tag === ber_1.CONTEXT(2)) {
                n.decodeChildren(seq);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return n;
    }
    isNode() {
        return true;
    }
    toQualified() {
        const qn = new qualified_node_1.QualifiedNode(this.getPath());
        qn.update(this);
        return qn;
    }
}
exports.Node = Node;
//# sourceMappingURL=node.js.map