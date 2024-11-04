'use strict';

import { ParameterType, ParameterTypeToBERTAG, parameterTypeToString } from './parameter-type';
import { ParameterAccess, parameterAccessToString } from './parameter-access';
import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, EMBER_SET, EMBER_STRING, EMBER_RELATIVE_OID } from '../ber';
import { StringIntegerCollection } from './string-integer-collection';
import { StreamDescription } from './stream/stream-description';
import { UnimplementedEmberTypeError, UnsupportedValueError, InvalidEmberNodeError } from '../error/errors';

export interface JParameterContents {
    identifier: string;
    description?: string;
    value?: string|number|boolean|Buffer;
    minimum?: string|number|boolean|Buffer;
    maximum?: string|number|boolean|Buffer;
    access?: string;
    format?: string;
    enumeration?: string;
    factor?: number;
    isOnline?: boolean;
    formula?: string;
    step?: number;
    default?: string|number|boolean|Buffer;
    type?: string;
    streamIdentifier?: number;
    enumMap?: object;
    streamDescriptor?: object;
    schemaIdentifiers?: string;
    templateReference?: string;
}

export class ParameterContents {
    public identifier?: string;
    public description?: string;
    public minimum?: string | number | boolean | Buffer;
    public maximum?: string | number | boolean | Buffer;
    public access?: ParameterAccess;
    public format?: string;
    public enumeration?: string;
    public factor?: number;
    public isOnline?: boolean;
    public formula?: string;
    public step?: number;
    public default?: string | number | boolean | Buffer;
    public streamIdentifier?: number;
    public enumMap?: StringIntegerCollection;
    public streamDescriptor?: StreamDescription;
    public schemaIdentifiers?: string;
    public templateReference?: string;

    constructor(public type?: ParameterType, public value?: string | number | boolean | Buffer) {
        if (type != null && isNaN(Number(type))) {
            throw new InvalidEmberNodeError(`Invalid parameter type ${type}`);
        }
    }

    static createParameterContent(value: number|string|boolean|Buffer, type?: ParameterType): ParameterContents {
        if (type != null) {
            return new ParameterContents(type, value);
        } else if (typeof value === 'string') {
            return new ParameterContents(ParameterType.string, value);
        } else if (typeof value === 'boolean') {
            return new ParameterContents(ParameterType.boolean, value);
        } else if (typeof value === 'number') {
            if (Math.round(value) === value) {
                return new ParameterContents(ParameterType.integer, value);
            } else {
                return new ParameterContents(ParameterType.real, value);
            }
        } else if (value instanceof Buffer) {
            return new ParameterContents(ParameterType.octets, value);
        }
        throw new UnsupportedValueError(value);
    }

    static decode(ber: Reader): ParameterContents {
        const pc = new ParameterContents();
        ber = ber.getSequence(EMBER_SET);

        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            switch (tag) {
                case CONTEXT(0):
                    pc.identifier = seq.readString(EMBER_STRING);
                    break;
                case CONTEXT(1):
                    pc.description = seq.readString(EMBER_STRING);
                    break;
                case CONTEXT(2):
                    pc.value = seq.readValue();
                    break;
                case CONTEXT(3):
                    pc.minimum = seq.readValue();
                    break;
                case CONTEXT(4):
                    pc.maximum = seq.readValue();
                    break;
                case CONTEXT(5):
                    pc.access = seq.readInt();
                    break;
                case CONTEXT(6):
                    pc.format = seq.readString(EMBER_STRING);
                    break;
                case CONTEXT(7):
                    pc.enumeration = seq.readString(EMBER_STRING);
                    break;
                case CONTEXT(8):
                    pc.factor = seq.readInt();
                    break;
                case CONTEXT(9):
                    pc.isOnline = seq.readBoolean();
                    break;
                case CONTEXT(10):
                    pc.formula = seq.readString(EMBER_STRING);
                    break;
                case CONTEXT(11):
                    pc.step = seq.readInt();
                    break;
                case CONTEXT(12):
                    pc.default = seq.readValue();
                    break;
                case CONTEXT(13):
                    pc.type = seq.readInt();
                    break;
                case CONTEXT(14):
                    pc.streamIdentifier = seq.readInt();
                    break;
                case CONTEXT(15):
                    pc.enumMap = StringIntegerCollection.decode(seq);
                    break;
                case CONTEXT(16):
                    pc.streamDescriptor = StreamDescription.decode(seq);
                    break;
                case CONTEXT(17):
                    pc.schemaIdentifiers = seq.readString(EMBER_STRING);
                    break;
                case CONTEXT(18):
                    pc.templateReference = seq.readRelativeOID(EMBER_RELATIVE_OID);
                    break;
                default:
                    throw new UnimplementedEmberTypeError(tag);
            }
        }
        return pc;
    }

    encode(ber: Writer): void {
        ber.startSequence(EMBER_SET);

        ber.writeIfDefined(this.identifier, ber.writeString, 0, EMBER_STRING);
        ber.writeIfDefined(this.description, ber.writeString, 1, EMBER_STRING);
        ber.writeIfDefined(this.value, ber.writeValue, 2, ParameterTypeToBERTAG(this.type));
        ber.writeIfDefined(this.minimum, ber.writeValue, 3, ParameterTypeToBERTAG(this.type));
        ber.writeIfDefined(this.maximum, ber.writeValue, 4, ParameterTypeToBERTAG(this.type));
        ber.writeIfDefined(this.access, ber.writeInt, 5);
        ber.writeIfDefined(this.format, ber.writeString, 6, EMBER_STRING);
        ber.writeIfDefined(this.enumeration, ber.writeString, 7, EMBER_STRING);
        ber.writeIfDefined(this.factor, ber.writeInt, 8);
        ber.writeIfDefined(this.isOnline, ber.writeBoolean, 9);
        ber.writeIfDefined(this.formula, ber.writeString, 10, EMBER_STRING);
        ber.writeIfDefined(this.step, ber.writeInt, 11);
        ber.writeIfDefined(this.default, ber.writeValue, 12, ParameterTypeToBERTAG(this.type));
        ber.writeIfDefined(this.type, ber.writeInt, 13);

        ber.writeIfDefined(this.streamIdentifier, ber.writeInt, 14);

        if (this.enumMap != null) {
            ber.startSequence(CONTEXT(15));
            this.enumMap.encode(ber);
            ber.endSequence();
        }

        if (this.streamDescriptor != null) {
            ber.startSequence(CONTEXT(16));
            this.streamDescriptor.encode(ber);
            ber.endSequence();
        }

        ber.writeIfDefined(this.schemaIdentifiers, ber.writeString, 17, EMBER_STRING);
        ber.writeIfDefined(this.templateReference, ber.writeRelativeOID, 18, EMBER_RELATIVE_OID);

        ber.endSequence();
    }

    toJSON(res?: {[index: string]:  any}): JParameterContents {
        const response: JParameterContents = (res || {}) as JParameterContents;
        response.identifier = this.identifier,
        response.description = this.description,
        response.value = this.value,
        response.minimum = this.minimum,
        response.maximum = this.maximum,
        response.access = parameterAccessToString(this.access == null ? ParameterAccess.none : this.access),
        response.format = this.format,
        response.enumeration = this.enumeration,
        response.factor = this.factor,
        response.isOnline = this.isOnline,
        response.formula = this.formula,
        response.step = this.step,
        response.default = this.default,
        response.type = parameterTypeToString(this.type ? this.type : ParameterType.string),
        response.streamIdentifier = this.streamIdentifier,
        response.enumMap = this.enumMap?.toJSON(),
        response.streamDescriptor = this.streamDescriptor?.toJSON(),
        response.schemaIdentifiers = this.schemaIdentifiers,
        response.templateReference = this.templateReference;
        return response;
    }
}
