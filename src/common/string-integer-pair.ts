import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION, EMBER_STRING } from '../ber';
import { UnimplementedEmberTypeError, InvalidEmberNodeError } from '../error/errors';

export interface StringIntegerPairInterface {
    key: string;
    value: number;
}

export class StringIntegerPair {

    static get BERID(): number {
        return APPLICATION(7);
    }

    get key(): string {
        return this._key;
    }

    set key(key: string) {
        if (typeof(key) !== 'string') {
            throw new InvalidEmberNodeError('', 'Invalid key');
        }
        this._key = key;
    }

    get value(): number {
        return this._value;
    }

    set value(value: number) {
        if (typeof(value) !== 'number') {
            throw new InvalidEmberNodeError('', 'Invalid value');
        }
        this._value = value;
    }

    constructor(private _key: string, private _value: number) {
    }

    static decode(ber: Reader): StringIntegerPair {
        const sp: StringIntegerPairInterface = {key: null, value: null};
        const seq = ber.getSequence(StringIntegerPair.BERID);
        while (seq.remain > 0) {
            const tag = seq.peek();
            const dataSeq = seq.getSequence(tag);
            if (tag === CONTEXT(0)) {
                sp.key = dataSeq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(1)) {
                sp.value = dataSeq.readInt();
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return new StringIntegerPair(sp.key, sp.value);
    }

    encode(ber: Writer): void {
        ber.startSequence(StringIntegerPair.BERID);
        ber.startSequence(CONTEXT(0));
        ber.writeString(this.key, EMBER_STRING);
        ber.endSequence();
        ber.startSequence(CONTEXT(1));
        ber.writeInt(this.value);
        ber.endSequence();
        ber.endSequence();
    }

    toJSON(): StringIntegerPairInterface {
        return {
            key: this.key,
            value: this.value
        };
    }
}
