import { APPLICATION, ExtendedReader, ExtendedWriter, CONTEXT } from '../../ber';
import { UnimplementedEmberTypeError } from '../../error/errors';

export interface StreamEntryInterface {
    identifier: number;
    value: string|number|boolean|Buffer;
}

export class StreamEntry implements StreamEntryInterface {

    constructor(public identifier: number, public value: string|number|boolean|Buffer) {
    }

    static decode(ber: ExtendedReader): StreamEntry {
        const entry: StreamEntryInterface = {identifier: 0, value: ''};
        const seq = ber.getSequence(this.BERID);
        while (seq.remain > 0) {
            const tag = seq.peek();
            const data = seq.getSequence(tag);
            if (tag === CONTEXT(0)) {
                entry.identifier = data.readInt();
            } else if (tag === CONTEXT(1)) {
                entry.value = data.readValue();
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return new StreamEntry(entry.identifier, entry.value);
    }

    encode(ber: ExtendedWriter): void {
        ber.startSequence(StreamEntry.BERID);
        ber.startSequence(CONTEXT(0));
        ber.writeInt(this.identifier);
        ber.endSequence();
        ber.startSequence(CONTEXT(1));
        ber.writeValue(this.value);
        ber.endSequence();
        ber.endSequence();
    }

    toJSON(): StreamEntryInterface {
        return {
            identifier: this.identifier,
            value: this.value
        };
    }

    static get BERID(): number {
        return APPLICATION(5);
    }
}
