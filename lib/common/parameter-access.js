"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ParameterAccess;
(function (ParameterAccess) {
    ParameterAccess[ParameterAccess["none"] = 0] = "none";
    ParameterAccess[ParameterAccess["read"] = 1] = "read";
    ParameterAccess[ParameterAccess["write"] = 2] = "write";
    ParameterAccess[ParameterAccess["readWrite"] = 3] = "readWrite";
})(ParameterAccess = exports.ParameterAccess || (exports.ParameterAccess = {}));
function parameterAccessFromString(s) {
    if (typeof (s) !== 'string') {
        throw new Error(`parameterAccessFromString: Invalid string ${s}`);
    }
    return ParameterAccess[s];
}
exports.parameterAccessFromString = parameterAccessFromString;
function parameterAccessToString(a) {
    const num = Number(a);
    if (isNaN(num) || num < ParameterAccess.none || num > ParameterAccess.readWrite) {
        throw new Error(`parameterAccessToString: Invalid parameter type ${a}`);
    }
    return ParameterAccess[num];
}
exports.parameterAccessToString = parameterAccessToString;
//# sourceMappingURL=parameter-access.js.map