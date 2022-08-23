"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const qualified_element_1 = require("./qualified-element");
const node_contents_1 = require("./node-contents");
const errors_1 = require("../error/errors");
const node_1 = require("./node");
class QualifiedNode extends qualified_element_1.QualifiedElement {
    static get BERID() {
        return ber_1.APPLICATION(10);
    }
    get contents() {
        return this._contents;
    }
    get isOnline() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.isOnline;
    }
    set isOnline(isOnline) {
        this.contents.isOnline = isOnline;
    }
    get schemaIdentifiers() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.schemaIdentifiers;
    }
    set schemaIdentifiers(schemaIdentifiers) {
        this.contents.schemaIdentifiers = schemaIdentifiers;
    }
    constructor(path, identifier) {
        super(path);
        this._seqID = QualifiedNode.BERID;
        if (identifier != null) {
            this.setContents(new node_contents_1.NodeContents(identifier));
        }
    }
    static decode(ber) {
        const qn = new QualifiedNode('');
        ber = ber.getSequence(QualifiedNode.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                qn._path = seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID);
            }
            else if (tag === ber_1.CONTEXT(1)) {
                qn.setContents(node_contents_1.NodeContents.decode(seq));
            }
            else if (tag === ber_1.CONTEXT(2)) {
                qn.decodeChildren(seq);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return qn;
    }
    isNode() {
        return true;
    }
    toElement() {
        const element = new node_1.Node(this.getNumber());
        element.update(this);
        return element;
    }
}
exports.QualifiedNode = QualifiedNode;
//# sourceMappingURL=qualified-node.js.map