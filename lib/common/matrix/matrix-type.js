"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MatrixType;
(function (MatrixType) {
    MatrixType[MatrixType["oneToN"] = 0] = "oneToN";
    MatrixType[MatrixType["oneToOne"] = 1] = "oneToOne";
    MatrixType[MatrixType["nToN"] = 2] = "nToN";
})(MatrixType = exports.MatrixType || (exports.MatrixType = {}));
function matrixTypeFromString(s) {
    if (typeof (s) !== 'string') {
        throw new Error(`matrixTypeFromString: Invalid string ${s}`);
    }
    return MatrixType[s];
}
exports.matrixTypeFromString = matrixTypeFromString;
function matrixTypeToString(t) {
    const num = Number(t);
    if (isNaN(num) || num < MatrixType.oneToN || num > MatrixType.nToN) {
        throw new Error(`parameterTypeToString: Invalid parameter type ${t}`);
    }
    return MatrixType[num];
}
exports.matrixTypeToString = matrixTypeToString;
//# sourceMappingURL=matrix-type.js.map