import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION, EMBER_STRING, EMBER_RELATIVE_OID } from '../ber';
import { UnimplementedEmberTypeError, InvalidEmberNodeError } from '../error/errors';

export interface LabelInterface {
    basePath: string;
    description: string;
}

export class Label {

    static get BERID(): number {
        return APPLICATION(18);
    }
    constructor(public basePath: string, public description: string) {
    }

    static decode(ber: Reader): Label {
        const l: LabelInterface = {basePath: '', description: ''};

        ber = ber.getSequence(Label.BERID);

        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                l.basePath = seq.readRelativeOID(EMBER_RELATIVE_OID);
            } else if (tag === CONTEXT(1)) {
                l.description = seq.readString(EMBER_STRING);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return new Label(l.basePath, l.description);
    }

    encode(ber: Writer): void {
        ber.startSequence(Label.BERID);
        if (this.basePath == null) {
            throw new InvalidEmberNodeError('', 'Missing label base path');
        }
        ber.startSequence(CONTEXT(0));
        ber.writeRelativeOID(this.basePath, EMBER_RELATIVE_OID);
        ber.endSequence();
        if (this.description == null) {
            throw new InvalidEmberNodeError('', 'Missing label description');
        }
        ber.startSequence(CONTEXT(1));
        ber.writeString(this.description, EMBER_STRING);
        ber.endSequence();
        ber.endSequence();
    }

    toJSON(): LabelInterface {
        return {
            basePath: this.basePath,
            description: this.description
        };
    }
}
