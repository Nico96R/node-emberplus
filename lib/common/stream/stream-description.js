"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const errors_1 = require("../../error/errors");
class StreamDescription {
    constructor(format, offset) {
        this.format = format;
        this.offset = offset;
    }
    static decode(ber) {
        const sd = { format: null, offset: 0 };
        ber = ber.getSequence(StreamDescription.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                sd.format = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(1)) {
                sd.offset = seq.readInt();
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return new StreamDescription(sd.format, sd.offset);
    }
    encode(ber) {
        ber.startSequence(StreamDescription.BERID);
        ber.writeIfDefined(this.format, ber.writeInt, 0);
        ber.writeIfDefined(this.offset, ber.writeInt, 1);
        ber.endSequence();
    }
    toJSON() {
        return {
            format: this.format,
            offset: this.offset
        };
    }
    static get BERID() {
        return ber_1.APPLICATION(12);
    }
}
exports.StreamDescription = StreamDescription;
//# sourceMappingURL=stream-description.js.map