import { ExtendedWriter as Writer, ExtendedReader as Reader, CONTEXT, APPLICATION } from '../../ber';
import { StreamFormat } from './stream-format';
import { UnimplementedEmberTypeError } from '../../error/errors';
import { Element } from '../element';

export interface StreamDescriptionInterface {
    format: StreamFormat;
    offset: number;
}

export class StreamDescription {
    constructor(public format: StreamFormat, public offset: number) {
    }

    static decode(ber: Reader): StreamDescription {
        const sd: StreamDescriptionInterface = {format: null, offset: 0};
        ber = ber.getSequence(StreamDescription.BERID);

        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                sd.format = seq.readInt();
            } else if (tag === CONTEXT(1)) {
                sd.offset = seq.readInt();
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return new StreamDescription(sd.format, sd.offset);
    }

    encode(ber: Writer): void {
        ber.startSequence(StreamDescription.BERID);

        ber.writeIfDefined(this.format, ber.writeInt, 0);
        ber.writeIfDefined(this.offset, ber.writeInt, 1);

        ber.endSequence();
    }

    toJSON(): StreamDescriptionInterface {
        return {
            format: this.format,
            offset: this.offset
        };
    }

    static get BERID(): number {
        return APPLICATION(12);
    }
}
