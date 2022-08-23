"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MatrixOperation;
(function (MatrixOperation) {
    MatrixOperation[MatrixOperation["absolute"] = 0] = "absolute";
    MatrixOperation[MatrixOperation["connect"] = 1] = "connect";
    MatrixOperation[MatrixOperation["disconnect"] = 2] = "disconnect";
})(MatrixOperation = exports.MatrixOperation || (exports.MatrixOperation = {}));
function matrixOperationFromString(s) {
    return MatrixOperation[s];
}
exports.matrixOperationFromString = matrixOperationFromString;
//# sourceMappingURL=matrix-operation.js.map