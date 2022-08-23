"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const stream_entry_1 = require("./stream-entry");
class StreamCollection {
    constructor() {
        this.elements = new Map();
    }
    static get BERID() {
        return ber_1.APPLICATION(5);
    }
    static decode(ber) {
        const streamCollection = new StreamCollection();
        const seq = ber.getSequence(this.BERID);
        while (seq.remain > 0) {
            const rootReader = seq.getSequence(ber_1.CONTEXT(0));
            while (rootReader.remain > 0) {
                const entry = stream_entry_1.StreamEntry.decode(rootReader);
                streamCollection.addEntry(entry);
            }
        }
        return streamCollection;
    }
    addEntry(entry) {
        this.elements.set(entry.identifier, entry);
    }
    removeEntry(entry) {
        this.elements.delete(entry.identifier);
    }
    getEntry(identifier) {
        return this.elements.get(identifier);
    }
    size() {
        return this.elements.size;
    }
    encode(ber) {
        ber.startSequence(StreamCollection.BERID);
        for (const [, entry] of this.elements) {
            ber.startSequence(ber_1.CONTEXT(0));
            entry.encode(ber);
            ber.endSequence();
        }
        ber.endSequence();
    }
    [Symbol.iterator]() {
        return this.elements.values();
    }
    toJSON() {
        const js = [];
        for (const [, entry] of this.elements) {
            js.push(entry.toJSON());
        }
        return js;
    }
}
exports.StreamCollection = StreamCollection;
//# sourceMappingURL=stream-collection.js.map