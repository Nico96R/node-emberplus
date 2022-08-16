import {ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION, EMBER_RELATIVE_OID } from '../../ber';
import {MatrixDisposition} from './matrix-disposition';
import {MatrixOperation} from './matrix-operation';
import { UnimplementedEmberTypeError } from '../../error/errors';

export interface JMatrixConnection {
    target: number;
    sources?: number[];
}

export class MatrixConnection {

    public sources?: number[];
    public operation: MatrixOperation;
    public disposition?: MatrixDisposition;
    private _locked: boolean;

    constructor(public target?: number) {
        if (target == null) {
            this.target = 0;
        }
        this._locked = false;
    }

    static decode(ber: Reader): MatrixConnection {
        const c = new MatrixConnection();
        ber = ber.getSequence(MatrixConnection.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                c.target = seq.readInt();
            } else if (tag === CONTEXT(1)) {
                const sources = seq.readRelativeOID(EMBER_RELATIVE_OID);
                if (sources === '') {
                   c .sources = [];
                } else {
                    c.sources = sources.split('.').map(i => Number(i));
                }
            } else if (tag === CONTEXT(2)) {
                c.operation = seq.readInt();

            } else if (tag === CONTEXT(3)) {
                c.disposition = seq.readInt();
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return c;
    }

    connectSources(sources: number[]): void {
        this.sources = this.validateSources(sources);
    }

    disconnectSources(sources: number[]): void {
        if (sources == null) {
            return;
        }
        const s = new Set(this.sources);
        for (const item of sources) {
            s.delete(item);
        }
        this.sources = [...s].sort();
    }

    encode(ber: Writer): void {
        ber.startSequence(MatrixConnection.BERID);

        ber.startSequence(CONTEXT(0));
        ber.writeInt(this.target);
        ber.endSequence();

        if (this.sources != null) {
            ber.startSequence(CONTEXT(1));
            ber.writeRelativeOID(this.sources.join('.'), EMBER_RELATIVE_OID);
            ber.endSequence();
        }
        if (this.operation != null) {
            ber.startSequence(CONTEXT(2));
            ber.writeInt(this.operation);
            ber.endSequence();
        }
        if (this.disposition != null) {
            ber.startSequence(CONTEXT(3));
            ber.writeInt(this.disposition);
            ber.endSequence();
        }
        ber.endSequence();
    }

    isDifferent(sources: number[]): boolean {
        const newSources = this.validateSources(sources);

        if (this.sources == null && newSources == null) {
            return false;
        }

        if ((this.sources == null && newSources != null) ||
            (this.sources != null && newSources == null) ||
            (this.sources.length !== newSources.length)) {
            return true;
        }
        // list are ordered, so we can simply parse 1 by 1.
        for (let i = 0; i < this.sources.length; i++) {
            if (this.sources[i] !== newSources[i]) {
                return true;
            }
        }
        return false;
    }

    isLocked(): boolean {
        return this._locked;
    }

    lock(): void {
        this._locked = true;
    }

    setSources(sources: number[]): void {
        if (sources == null) {
            delete this.sources;
            return;
        }
        this.sources = this.validateSources(sources);
    }

    validateSources(sources?: number[]): null|number[] {
        if (sources == null) {
            return null;
        }
        // eliminate duplicates
        const s = new Set(sources.map(i => Number(i)));
        return [...s].sort();
    }

    unlock(): void {
        this._locked = false;
    }

    static get BERID(): number {
        return APPLICATION(16);
    }

}
