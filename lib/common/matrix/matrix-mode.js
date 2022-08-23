"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MatrixMode;
(function (MatrixMode) {
    MatrixMode[MatrixMode["linear"] = 0] = "linear";
    MatrixMode[MatrixMode["nonLinear"] = 1] = "nonLinear";
})(MatrixMode = exports.MatrixMode || (exports.MatrixMode = {}));
function matrixModeFromString(s) {
    if (typeof (s) !== 'string') {
        throw new Error(`matrixModeFromString: Invalid string ${s}`);
    }
    return MatrixMode[s];
}
exports.matrixModeFromString = matrixModeFromString;
function matrixModeToString(m) {
    const num = Number(m);
    if (isNaN(num) || num < MatrixMode.linear || num > MatrixMode.nonLinear) {
        throw new Error(`matrixModeToString: Invalid parameter type ${m}`);
    }
    return MatrixMode[num];
}
exports.matrixModeToString = matrixModeToString;
//# sourceMappingURL=matrix-mode.js.map