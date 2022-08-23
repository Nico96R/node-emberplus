"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const errors_1 = require("../error/errors");
exports.ParameterTypeToBERTAG = (type) => {
    switch (type) {
        case ParameterType.integer: return ber_1.EMBER_INTEGER;
        case ParameterType.real: return ber_1.EMBER_REAL;
        case ParameterType.string: return ber_1.EMBER_STRING;
        case ParameterType.boolean: return ber_1.EMBER_BOOLEAN;
        case ParameterType.octets: return ber_1.EMBER_OCTETSTRING;
        case ParameterType.enum: return ber_1.EMBER_ENUMERATED;
        default:
            throw new errors_1.InvalidEmberNodeError('', `Unhandled ParameterType ${type}`);
    }
};
exports.ParameterTypeFromBERTAG = (tag) => {
    switch (tag) {
        case ber_1.EMBER_INTEGER: return ParameterType.integer;
        case ber_1.EMBER_REAL: return ParameterType.real;
        case ber_1.EMBER_STRING: return ParameterType.string;
        case ber_1.EMBER_BOOLEAN: return ParameterType.boolean;
        case ber_1.EMBER_OCTETSTRING: return ParameterType.octets;
        case ber_1.EMBER_ENUMERATED: return ParameterType.enum;
        default:
            throw new errors_1.InvalidBERFormatError(`Unhandled BER TAB ${tag}`);
    }
};
function parameterTypeFromString(s) {
    if (typeof (s) !== 'string') {
        throw new Error(`parameterTypeFromString: Invalid string ${s}`);
    }
    return ParameterType[s];
}
exports.parameterTypeFromString = parameterTypeFromString;
function parameterTypeToString(t) {
    const num = Number(t);
    if (isNaN(num) || num < ParameterType.integer || num > ParameterType.octets) {
        throw new Error(`parameterTypeToString: Invalid parameter type ${t}`);
    }
    return ParameterType[num];
}
exports.parameterTypeToString = parameterTypeToString;
var ParameterType;
(function (ParameterType) {
    ParameterType[ParameterType["integer"] = 1] = "integer";
    ParameterType[ParameterType["real"] = 2] = "real";
    ParameterType[ParameterType["string"] = 3] = "string";
    ParameterType[ParameterType["boolean"] = 4] = "boolean";
    ParameterType[ParameterType["trigger"] = 5] = "trigger";
    ParameterType[ParameterType["enum"] = 6] = "enum";
    ParameterType[ParameterType["octets"] = 7] = "octets";
})(ParameterType = exports.ParameterType || (exports.ParameterType = {}));
//# sourceMappingURL=parameter-type.js.map