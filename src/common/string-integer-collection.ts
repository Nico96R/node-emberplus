import { StringIntegerPair, StringIntegerPairInterface } from './string-integer-pair';
import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION } from '../ber';
import { UnimplementedEmberTypeError } from '../error/errors';

export class StringIntegerCollection {

    static get BERID(): number {
        return APPLICATION(8);
    }
    private _collection: Map<string, StringIntegerPair>;
    constructor() {
        this._collection = new Map();
    }

    static decode(ber: Reader): StringIntegerCollection {
        const sc = new StringIntegerCollection();
        const seq = ber.getSequence(StringIntegerCollection.BERID);
        while (seq.remain > 0) {
            const tag = seq.peek();
            if (tag !== CONTEXT(0)) {
                throw new UnimplementedEmberTypeError(tag);
            }
            const data = seq.getSequence(CONTEXT(0));
            const sp = StringIntegerPair.decode(data);
            sc.addEntry(sp.key, sp);
        }
        return sc;
    }

    addEntry(key: string, value: StringIntegerPair): void {
        this._collection.set(key, value);
    }

    get(key: string): StringIntegerPair {
        return this._collection.get(key);
    }

    encode(ber: Writer): void {
        ber.startSequence(StringIntegerCollection.BERID);
        for (const [, sp] of this._collection) {
            ber.startSequence(CONTEXT(0));
            sp.encode(ber);
            ber.endSequence();
        }
        ber.endSequence();
    }

    toJSON(): StringIntegerPairInterface[] {
        const collection: StringIntegerPairInterface[] = [];
        for (const [, sp] of this._collection) {
            collection.push(sp.toJSON());
        }
        return collection;
    }
}
