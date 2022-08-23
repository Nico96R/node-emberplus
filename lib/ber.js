"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gdnet_asn1_1 = __importDefault(require("gdnet-asn1"));
const errors = require("./error/errors");
const Long = require("long");
exports.APPLICATION = (x) => x | 0x60;
exports.CONTEXT = (x) => x | 0xa0;
exports.UNIVERSAL = (x) => x;
exports.EMBER_BOOLEAN = 1;
exports.EMBER_INTEGER = 2;
exports.EMBER_BITSTRING = 3;
exports.EMBER_OCTETSTRING = 4;
exports.EMBER_NULL = 5;
exports.EMBER_OBJECTIDENTIFIER = 6;
exports.EMBER_OBJECTDESCRIPTOR = 7;
exports.EMBER_EXTERNAL = 8;
exports.EMBER_REAL = 9;
exports.EMBER_ENUMERATED = 10;
exports.EMBER_EMBEDDED = 11;
exports.EMBER_STRING = 12;
exports.EMBER_RELATIVE_OID = 13;
exports.EMBER_SEQUENCE = 0x20 | 16;
exports.EMBER_SET = 0x20 | 17;
class ExtendedReader extends gdnet_asn1_1.default.Reader {
    constructor(data) {
        super(data);
    }
    getSequence(tag) {
        const buf = this.readString(tag, true);
        return new ExtendedReader(buf);
    }
    readValue() {
        const tag = this.peek();
        if (tag === exports.EMBER_STRING) {
            return this.readString(exports.EMBER_STRING);
        }
        else if (tag === exports.EMBER_INTEGER) {
            return this.readInt();
        }
        else if (tag === exports.EMBER_REAL) {
            return this.readReal();
        }
        else if (tag === exports.EMBER_BOOLEAN) {
            return this.readBoolean();
        }
        else if (tag === exports.EMBER_OCTETSTRING) {
            return this.readString(exports.UNIVERSAL(4), true);
        }
        else if (tag === exports.EMBER_RELATIVE_OID) {
            return this.readOID(exports.EMBER_RELATIVE_OID);
        }
        else {
            throw new errors.UnimplementedEmberTypeError(tag);
        }
    }
    readReal(tag) {
        if (tag != null) {
            tag = exports.UNIVERSAL(9);
        }
        const b = this.peek();
        if (b == null) {
            return null;
        }
        const buf = this.readString(b, true);
        if (buf.length === 0) {
            return 0;
        }
        const preamble = buf.readUInt8(0);
        let o = 1;
        if (buf.length === 1 && preamble === 0x40) {
            return Infinity;
        }
        else if (buf.length === 1 && preamble === 0x41) {
            return -Infinity;
        }
        else if (buf.length === 1 && preamble === 0x42) {
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
exports.ExtendedReader = ExtendedReader;
class ExtendedWriter extends gdnet_asn1_1.default.Writer {
    constructor(options) {
        super(options);
    }
    static _shorten(value) {
        let size = 4;
        while ((((value & 0xff800000) === 0) || ((value & 0xff800000) === 0xff800000 >> 0)) &&
            (size > 1)) {
            size--;
            value <<= 8;
        }
        return { size, value };
    }
    static _shortenLong(value) {
        const mask = Long.fromBits(0x00000000, 0xff800000, true);
        value = value.toUnsigned();
        let size = 8;
        while (value.and(mask).eq(0) || (value.and(mask).eq(mask) && (size > 1))) {
            size--;
            value = value.shl(8);
        }
        return { size, value };
    }
    writeIfDefined(property, writer, outer, inner) {
        if (property != null) {
            this.startSequence(exports.CONTEXT(outer));
            writer.call(this, property, inner);
            this.endSequence();
        }
    }
    writeIfDefinedEnum(property, type, writer, outer, inner) {
        if (property != null) {
            this.startSequence(exports.CONTEXT(outer));
            if (property.value != null) {
                writer.call(this, property.value, inner);
            }
            else {
                writer.call(this, type.get(property), inner);
            }
            this.endSequence();
        }
    }
    writeReal(value, tag) {
        if (tag === undefined) {
            tag = exports.UNIVERSAL(9);
        }
        this.writeByte(tag);
        if (value === 0) {
            this.writeLength(0);
            return;
        }
        else if (value === Infinity) {
            this.writeLength(1);
            this.writeByte(0x40);
            return;
        }
        else if (value === -Infinity) {
            this.writeLength(1);
            this.writeByte(0x41);
            return;
        }
        else if (isNaN(value)) {
            this.writeLength(1);
            this.writeByte(0x42);
            return;
        }
        const fbuf = Buffer.alloc(8);
        fbuf.writeDoubleLE(value, 0);
        const bits = Long.fromBits(fbuf.readUInt32LE(0), fbuf.readUInt32LE(4), true);
        let significand = bits.and(Long.fromBits(0xFFFFFFFF, 0x000FFFFF, true)).or(Long.fromBits(0x00000000, 0x00100000, true));
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
        if (value < 0) {
            preamble |= 0x40;
        }
        this.writeByte(preamble);
        for (let i = 0; i < numExponent.size; i++) {
            this.writeByte((numExponent.value & 0xFF000000) >> 24);
            numExponent.value <<= 8;
        }
        const mask = Long.fromBits(0x00000000, 0xFF000000, true);
        for (let i = 0; i < numSignificand.size; i++) {
            const b = numSignificand.value.and(mask);
            this.writeByte(numSignificand.value.and(mask).shru(56).toNumber());
            numSignificand.value = numSignificand.value.shl(8);
        }
    }
    writeValue(value, tag) {
        if (Number.isInteger(value)) {
            if (tag === undefined) {
                tag = exports.EMBER_INTEGER;
            }
            this.writeInt(value, tag);
        }
        else if (typeof value === 'boolean') {
            if (tag === undefined) {
                tag = exports.EMBER_BOOLEAN;
            }
            this.writeBoolean(value, tag);
        }
        else if (typeof value === 'number') {
            if (tag === undefined) {
                tag = exports.EMBER_REAL;
            }
            this.writeReal(value, tag);
        }
        else if (Buffer.isBuffer(value)) {
            this.writeBuffer(value, tag);
        }
        else {
            if (tag === undefined) {
                tag = exports.EMBER_STRING;
            }
            this.writeString(value.toString(), tag);
        }
    }
}
exports.ExtendedWriter = ExtendedWriter;
//# sourceMappingURL=ber.js.map