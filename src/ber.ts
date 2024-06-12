/****************************************************************************
 * This file extends node-asn1's functionality in two main ways.
 *
 * The first is through getSequence on the reader.  This consumes the next
 * item entirely, returning a new Reader with its contents.  This makes it
 * much easier to read containers with an unknown count of items, without
 * the application having to keep track of how much it's consumed and how
 * long the original container was.
 *
 * The second is through the addition of readReal/writeReal methods.  These
 * are a little bit scary to do in JavaScript, which doesn't have real
 * integer types.  Unfortunately, most of the implementations of BER out
 * there are for doing PKI stuff, so I've been able to find few real-world
 * examples of real value encoding/decoding for BER.  These routines are
 * inspired heavily by libember, which works with the bits of an IEEE
 * double.  Note that this is *not* a complete implementation of X.690,
 * but only the subset required by EmBER (only base 2 for the exponent, and
 * only binary encoding).
 *
 * There are a few other methods thrown in to simplify many of the
 * structures encountered in EmBER.
 ***************************************************************************/

import BER from 'gdnet-asn1';
import errors = require('./error/errors');
import Long = require('long');

export const APPLICATION = (x: number) => x | 0x60;
export const CONTEXT = (x: number) => x | 0xa0;
export const UNIVERSAL = (x: number) => x;

export const EMBER_BOOLEAN             = 1;
export const EMBER_INTEGER             = 2;
export const EMBER_BITSTRING           = 3;
export const EMBER_OCTETSTRING         = 4;
export const EMBER_NULL                = 5;
export const EMBER_OBJECTIDENTIFIER    = 6;
export const EMBER_OBJECTDESCRIPTOR    = 7;
export const EMBER_EXTERNAL            = 8;
export const EMBER_REAL                = 9;
export const EMBER_ENUMERATED          = 10;
export const EMBER_EMBEDDED            = 11;
export const EMBER_STRING              = 12;
export const EMBER_RELATIVE_OID        = 13;

export const EMBER_SEQUENCE            = 0x20 | 16;
export const EMBER_SET                 = 0x20 | 17;

export class ExtendedReader extends BER.Reader {
    /**
     *
     * @param data
     */
    constructor(data: Buffer) {
        super(data);
    }

    /**
     *
     * @param tag
     */
    getSequence(tag: number): ExtendedReader {
        const buf = this.readString(tag, true);
        return new ExtendedReader(buf);
    }

    readValue(): any {
        /**
            Value ::=
            CHOICE {
            integer Integer64,
            real REAL,
            string EmberString,
            boolean BOOLEAN,
            octets OCTET STRING,
            null NULL
            }
        */
        const tag = this.peek();

        if (tag === EMBER_STRING) {
            return this.readString(EMBER_STRING);
        } else if (tag === EMBER_INTEGER) {
            return this.readInt();
        } else if (tag === EMBER_REAL) {
            return this.readReal();
        } else if (tag === EMBER_BOOLEAN) {
            return this.readBoolean();
        } else if (tag === EMBER_OCTETSTRING) {
            return this.readString(UNIVERSAL(4), true);
        } else if (tag === EMBER_RELATIVE_OID) {
            return this.readOID(EMBER_RELATIVE_OID);
        } else {
            throw new errors.UnimplementedEmberTypeError(tag);
        }
    }

    readReal(tag?: number): number {
        if (tag != null) {
            tag = UNIVERSAL(9);
        }

        const b = this.peek();
        if (b == null) {
            return null;
        }

        const buf = this.readString(b, true);

        if (buf.length === 0) {
            return 0;
        }

        // console.log(buf);

        const preamble = buf.readUInt8(0);
        let o = 1;

        if (buf.length === 1 && preamble === 0x40) {
            return Infinity;
        } else if (buf.length === 1 && preamble === 0x41) {
            return -Infinity;
        } else if (buf.length === 1 && preamble === 0x42) {
            return NaN;
        }

        const sign = (preamble & 0x40) ? -1 : 1;
        const exponentLength = 1 + (preamble & 3);
        const significandShift = (preamble >> 2) & 3;

        let exponent = 0;
        if (buf.readUInt8(o) & 0x80) {
            exponent = -1;
        }

        if (buf.length - o < exponentLength) {
            throw new errors.ASN1Error('Invalid ASN.1; not enough length to contain exponent');
        }

        for (let i = 0; i < exponentLength; i++) {
            exponent = (exponent << 8) | buf.readUInt8(o++);
        }

        let significand = new Long(0, 0, true);
        while (o < buf.length) {
            significand = significand.shl(8).or(buf.readUInt8(o++));
        }

        significand = significand.shl(significandShift);

        let mask = Long.fromBits(0x00000000, 0x7FFFF000, true);
        while (significand.and(mask).eq(0)) {
            significand = significand.shl(8);
        }

        mask = Long.fromBits(0x00000000, 0x7FF00000, true);
        while (significand.and(mask).eq(0)) {
            significand = significand.shl(1);
        }

        significand = significand.and(Long.fromBits(0xFFFFFFFF, 0x000FFFFF, true));

        const longExponent = Long.fromNumber(exponent);
        let bits = longExponent.add(1023).shl(52).or(significand);
        if (sign < 0) {
            bits = bits.or(Long.fromBits(0x00000000, 0x80000000, true));
        }

        const fbuf = Buffer.alloc(8);
        fbuf.writeUInt32LE(bits.getLowBitsUnsigned(), 0);
        fbuf.writeUInt32LE(bits.getHighBitsUnsigned(), 4);

        return fbuf.readDoubleLE(0);
    }

}

export class ExtendedWriter extends BER.Writer {
    constructor(options?: BER.WriterOptions) {
        super(options);
    }

    static _shorten(value: number): {size: number, value: number} {
        let size = 4;
        while ((((value & 0xff800000) === 0) || ((value & 0xff800000) === 0xff800000 >> 0)) &&
                 (size > 1)) {
            size--;
            value <<= 8;
        }

        return {size, value};
    }

    static _shortenLong(value: Long): {size: number, value: Long} {
        const mask = Long.fromBits(0x00000000, 0xff800000, true);
        value = value.toUnsigned();

        let size = 8;
        while (value.and(mask).eq(0) || (value.and(mask).eq(mask) && (size > 1))) {
            size--;
            value = value.shl(8);
        }

        return {size, value};
    }

    writeIfDefined(property: any, writer: (b: any, tag?: number) => void, outer: number, inner?: number): void {
        if (property != null) {
            this.startSequence(CONTEXT(outer));
            writer.call(this, property, inner);
            this.endSequence();
        }
    }

    writeIfDefinedEnum(property: any, type: any, writer: (value: any, tag: number) => void, outer: number, inner: number): void {
        if (property != null) {
            this.startSequence(CONTEXT(outer));
            if (property.value != null) {
                writer.call(this, property.value, inner);
            } else {
                writer.call(this, type.get(property), inner);
            }
            this.endSequence();
        }
    }

    writeReal(value: number, tag?: number): void {
        if (tag === undefined) {
            tag = UNIVERSAL(9);
        }

        this.writeByte(tag);
        if (value === 0) {
            this.writeLength(0);
            return;
        } else if (value === Infinity) {
            this.writeLength(1);
            this.writeByte(0x40);
            return;
        } else if (value === -Infinity) {
            this.writeLength(1);
            this.writeByte(0x41);
            return;
        } else if (isNaN(value)) {
            this.writeLength(1);
            this.writeByte(0x42);
            return;
        }

        const fbuf = Buffer.alloc(8);
        fbuf.writeDoubleLE(value, 0);

        const bits = Long.fromBits(fbuf.readUInt32LE(0), fbuf.readUInt32LE(4), true);
        let significand = bits.and(Long.fromBits(0xFFFFFFFF, 0x000FFFFF, true)).or(
            Long.fromBits(0x00000000, 0x00100000, true));
        const exponent = bits.and(Long.fromBits(0x00000000, 0x7FF00000, true)).shru(52)
            .sub(1023).toSigned();
        while (significand.and(0xFF) === Long.fromNumber(0)) {
            significand = significand.shru(8);
        }
        while (significand.and(0x01) === Long.fromNumber(0)) {
            significand = significand.shru(1);
        }

        const numExponent = ExtendedWriter._shorten(exponent.toNumber());
        const numSignificand = ExtendedWriter._shortenLong(significand);

        this.writeLength(1 + numExponent.size + numSignificand.size);
        let preamble = 0x80;
        if (value < 0) { preamble |= 0x40; }
        this.writeByte(preamble);

        for (let i = 0; i < numExponent.size; i++) {
            this.writeByte((numExponent.value & 0xFF000000) >> 24);
            numExponent.value <<= 8;
        }

        const mask = Long.fromBits(0x00000000, 0xFF000000, true);
        for (let i = 0; i < numSignificand.size; i++) {
            const b = numSignificand.value.and(mask);
            // console.log("masked:", b);
            this.writeByte(numSignificand.value.and(mask).shru(56).toNumber());
            numSignificand.value = numSignificand.value.shl(8);
        }
    }

    writeValue(value: any, tag?: number): void {
         if (tag === EMBER_INTEGER || (tag == null && Number.isInteger(value))) {
            this.writeInt(value, EMBER_INTEGER);
        } else if (tag === EMBER_BOOLEAN || (tag == null && typeof value === 'boolean')) {
            this.writeBoolean(value, EMBER_BOOLEAN);
        } else if (tag === EMBER_REAL || (tag == null && typeof value === 'number')) {
            this.writeReal(value, EMBER_REAL);
        } else if (tag === EMBER_OCTETSTRING || (tag == null && Buffer.isBuffer(value))) {
            this.writeBuffer(value, tag);
        } else {
            this.writeString(value.toString(), EMBER_STRING);
        }
    }
}
