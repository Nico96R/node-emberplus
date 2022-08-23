"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const errors_1 = require("../error/errors");
class NodeContents {
    constructor(identifier, description) {
        this.identifier = identifier;
        this.description = description;
        this.isOnline = true;
    }
    static decode(ber) {
        const nc = new NodeContents();
        ber = ber.getSequence(ber_1.EMBER_SET);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                nc.identifier = seq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(1)) {
                nc.description = seq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(2)) {
                nc.isRoot = seq.readBoolean();
            }
            else if (tag === ber_1.CONTEXT(3)) {
                nc.isOnline = seq.readBoolean();
            }
            else if (tag === ber_1.CONTEXT(4)) {
                nc.schemaIdentifiers = seq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(5)) {
                nc.templateReference = seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return nc;
    }
    encode(ber) {
        ber.startSequence(ber_1.EMBER_SET);
        if (this.identifier != null) {
            ber.startSequence(ber_1.CONTEXT(0));
            ber.writeString(this.identifier, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        if (this.description != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            ber.writeString(this.description, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        if (this.isRoot != null) {
            ber.startSequence(ber_1.CONTEXT(2));
            ber.writeBoolean(this.isRoot);
            ber.endSequence();
        }
        if (this.isOnline != null) {
            ber.startSequence(ber_1.CONTEXT(3));
            ber.writeBoolean(this.isOnline);
            ber.endSequence();
        }
        if (this.schemaIdentifiers != null) {
            ber.startSequence(ber_1.CONTEXT(4));
            ber.writeString(this.schemaIdentifiers, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        if (this.templateReference != null) {
            ber.startSequence(ber_1.CONTEXT(5));
            ber.writeRelativeOID(this.templateReference, ber_1.EMBER_RELATIVE_OID);
            ber.endSequence();
        }
        ber.endSequence();
    }
    toJSON(res) {
        const response = res || {};
        response.identifier = this.identifier,
            response.description = this.description,
            response.isRoot = this.isRoot,
            response.isOnline = this.isOnline,
            response.schemaIdentifiers = this.schemaIdentifiers,
            response.templateReference = this.templateReference;
        return response;
    }
}
exports.NodeContents = NodeContents;
//# sourceMappingURL=node-contents.js.map