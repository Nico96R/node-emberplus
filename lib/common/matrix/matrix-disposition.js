"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MatrixDisposition;
(function (MatrixDisposition) {
    MatrixDisposition[MatrixDisposition["tally"] = 0] = "tally";
    MatrixDisposition[MatrixDisposition["modified"] = 1] = "modified";
    MatrixDisposition[MatrixDisposition["pending"] = 2] = "pending";
    MatrixDisposition[MatrixDisposition["locked"] = 3] = "locked";
})(MatrixDisposition = exports.MatrixDisposition || (exports.MatrixDisposition = {}));
function matrixDispositionFromString(s) {
    return MatrixDisposition[s];
}
exports.matrixDispositionFromString = matrixDispositionFromString;
//# sourceMappingURL=matrix-disposition.js.map