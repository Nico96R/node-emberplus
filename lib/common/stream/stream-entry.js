"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const errors_1 = require("../../error/errors");
class StreamEntry {
    constructor(identifier, value) {
        this.identifier = identifier;
        this.value = value;
    }
    static decode(ber) {
        const entry = { identifier: 0, value: '' };
        const seq = ber.getSequence(this.BERID);
        while (seq.remain > 0) {
            const tag = seq.peek();
            const data = seq.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                entry.identifier = data.readInt();
            }
            else if (tag === ber_1.CONTEXT(1)) {
                entry.value = data.readValue();
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return new StreamEntry(entry.identifier, entry.value);
    }
    encode(ber) {
        ber.startSequence(StreamEntry.BERID);
        ber.startSequence(ber_1.CONTEXT(0));
        ber.writeInt(this.identifier);
        ber.endSequence();
        ber.startSequence(ber_1.CONTEXT(1));
        ber.writeValue(this.value);
        ber.endSequence();
        ber.endSequence();
    }
    toJSON() {
        return {
            identifier: this.identifier,
            value: this.value
        };
    }
    static get BERID() {
        return ber_1.APPLICATION(5);
    }
}
exports.StreamEntry = StreamEntry;
//# sourceMappingURL=stream-entry.js.map