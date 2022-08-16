import { ExtendedReader, APPLICATION, CONTEXT, ExtendedWriter } from '../../ber';
import { StreamEntry } from './stream-entry';

export interface StreamCollectionInterface {
    identifier: number;
    value: string | number | boolean | Buffer;
}

export class StreamCollection {

    static get BERID(): number {
        return APPLICATION(5);
    }
    private elements: Map<number, StreamEntry>;

    constructor() {
        this.elements = new Map();
    }

    static decode(ber: ExtendedReader): StreamCollection {
        const streamCollection = new StreamCollection();
        const seq = ber.getSequence(this.BERID);
        while (seq.remain > 0) {
            const rootReader = seq.getSequence(CONTEXT(0));
            while (rootReader.remain > 0) {
                const entry = StreamEntry.decode(rootReader);
                streamCollection.addEntry(entry);
            }
        }
        return streamCollection;
    }

    addEntry(entry: StreamEntry): void {
        this.elements.set(entry.identifier, entry);
    }

    removeEntry(entry: StreamEntry): void {
        this.elements.delete(entry.identifier);
    }

    getEntry(identifier: number): StreamEntry {
        return this.elements.get(identifier);
    }

    size(): number {
        return this.elements.size;
    }

    encode(ber: ExtendedWriter): void {
        ber.startSequence(StreamCollection.BERID);
        for (const [, entry] of this.elements) {
            ber.startSequence(CONTEXT(0));
            entry.encode(ber);
            ber.endSequence();
        }
        ber.endSequence();
    }

    [Symbol.iterator](): any {
        return this.elements.values();
    }

    toJSON(): StreamCollectionInterface[] {
        const js: StreamCollectionInterface[] = [];
        for (const [, entry] of this.elements) {
            js.push(entry.toJSON());
        }
        return js;
    }
}
