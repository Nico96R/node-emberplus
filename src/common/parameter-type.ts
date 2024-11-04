import {
    EMBER_INTEGER, EMBER_REAL,
    EMBER_STRING, EMBER_OCTETSTRING, EMBER_BOOLEAN, EMBER_ENUMERATED
} from '../ber';
import { InvalidEmberNodeError, InvalidBERFormatError } from '../error/errors';

export const ParameterTypeToBERTAG = (type: ParameterType): number => {
    switch (type) {
        case ParameterType.integer: return EMBER_INTEGER;
        case ParameterType.real: return EMBER_REAL;
        case ParameterType.string: return EMBER_STRING;
        case ParameterType.boolean: return EMBER_BOOLEAN;
        case ParameterType.octets: return EMBER_OCTETSTRING;
        case ParameterType.enum: return EMBER_INTEGER;
        default:
            throw new InvalidEmberNodeError('', `Unhandled ParameterType ${type}`);
    }
};

export const ParameterTypeFromBERTAG = (tag: number): number => {
    switch (tag) {
        case EMBER_INTEGER: return ParameterType.integer;
        case EMBER_REAL: return ParameterType.real;
        case EMBER_STRING: return ParameterType.string;
        case EMBER_BOOLEAN: return ParameterType.boolean;
        case EMBER_OCTETSTRING: return ParameterType.octets;
        case EMBER_ENUMERATED: return ParameterType.enum;
        default:
            throw new InvalidBERFormatError(`Unhandled BER TAB ${tag}`);
    }
};

type ParameterTypeStrings = keyof typeof ParameterType;
export function parameterTypeFromString(s: ParameterTypeStrings): ParameterType {
    if (typeof(s) !== 'string') {
        throw new Error(`parameterTypeFromString: Invalid string ${s}`);
    }
    return ParameterType[s];
}

export function parameterTypeToString(t: ParameterType): string {
    const num = Number(t);
    if (isNaN(num) || num < ParameterType.integer || num > ParameterType.octets) {
        throw new Error(`parameterTypeToString: Invalid parameter type ${t}`);
    }
    return ParameterType[num];
}

/*
BER VAlue
Value ::=
 CHOICE {
 integer Integer64,
 real REAL,
 string EmberString,
 boolean BOOLEAN,
 octets OCTET STRING,
 null NULL
 }*/

 export enum ParameterType {
    integer = 1,
    real,
    string,
    boolean,
    trigger,
    enum,
    octets
}
