"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const errors_1 = require("../../error/errors");
class MatrixConnection {
    constructor(target) {
        this.target = target;
        if (target == null) {
            this.target = 0;
        }
        this._locked = false;
    }
    static decode(ber) {
        const c = new MatrixConnection();
        ber = ber.getSequence(MatrixConnection.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                c.target = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(1)) {
                const sources = seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID);
                if (sources === '') {
                    c.sources = [];
                }
                else {
                    c.sources = sources.split('.').map(i => Number(i));
                }
            }
            else if (tag === ber_1.CONTEXT(2)) {
                c.operation = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(3)) {
                c.disposition = seq.readInt();
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return c;
    }
    connectSources(sources) {
        this.sources = this.validateSources(sources);
    }
    disconnectSources(sources) {
        if (sources == null) {
            return;
        }
        const s = new Set(this.sources);
        for (const item of sources) {
            s.delete(item);
        }
        this.sources = [...s].sort();
    }
    encode(ber) {
        ber.startSequence(MatrixConnection.BERID);
        ber.startSequence(ber_1.CONTEXT(0));
        ber.writeInt(this.target);
        ber.endSequence();
        if (this.sources != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            ber.writeRelativeOID(this.sources.join('.'), ber_1.EMBER_RELATIVE_OID);
            ber.endSequence();
        }
        if (this.operation != null) {
            ber.startSequence(ber_1.CONTEXT(2));
            ber.writeInt(this.operation);
            ber.endSequence();
        }
        if (this.disposition != null) {
            ber.startSequence(ber_1.CONTEXT(3));
            ber.writeInt(this.disposition);
            ber.endSequence();
        }
        ber.endSequence();
    }
    isDifferent(sources) {
        const newSources = this.validateSources(sources);
        if (this.sources == null && newSources == null) {
            return false;
        }
        if ((this.sources == null && newSources != null) ||
            (this.sources != null && newSources == null) ||
            (this.sources.length !== newSources.length)) {
            return true;
        }
        for (let i = 0; i < this.sources.length; i++) {
            if (this.sources[i] !== newSources[i]) {
                return true;
            }
        }
        return false;
    }
    isLocked() {
        return this._locked;
    }
    lock() {
        this._locked = true;
    }
    setSources(sources) {
        if (sources == null) {
            delete this.sources;
            return;
        }
        this.sources = this.validateSources(sources);
    }
    validateSources(sources) {
        if (sources == null) {
            return null;
        }
        const s = new Set(sources.map(i => Number(i)));
        return [...s].sort();
    }
    unlock() {
        this._locked = false;
    }
    static get BERID() {
        return ber_1.APPLICATION(16);
    }
}
exports.MatrixConnection = MatrixConnection;
//# sourceMappingURL=matrix-connection.js.map