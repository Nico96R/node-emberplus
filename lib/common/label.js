"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const errors_1 = require("../error/errors");
class Label {
    constructor(basePath, description) {
        this.basePath = basePath;
        this.description = description;
    }
    static get BERID() {
        return ber_1.APPLICATION(18);
    }
    static decode(ber) {
        const l = { basePath: '', description: '' };
        ber = ber.getSequence(Label.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                l.basePath = seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID);
            }
            else if (tag === ber_1.CONTEXT(1)) {
                l.description = seq.readString(ber_1.EMBER_STRING);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return new Label(l.basePath, l.description);
    }
    encode(ber) {
        ber.startSequence(Label.BERID);
        if (this.basePath == null) {
            throw new errors_1.InvalidEmberNodeError('', 'Missing label base path');
        }
        ber.startSequence(ber_1.CONTEXT(0));
        ber.writeRelativeOID(this.basePath, ber_1.EMBER_RELATIVE_OID);
        ber.endSequence();
        if (this.description == null) {
            throw new errors_1.InvalidEmberNodeError('', 'Missing label description');
        }
        ber.startSequence(ber_1.CONTEXT(1));
        ber.writeString(this.description, ber_1.EMBER_STRING);
        ber.endSequence();
        ber.endSequence();
    }
    toJSON() {
        return {
            basePath: this.basePath,
            description: this.description
        };
    }
}
exports.Label = Label;
//# sourceMappingURL=label.js.map