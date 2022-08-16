
export enum MatrixType {
    oneToN = 0,
    oneToOne,
    nToN
}

type MatrixTypeStrings = keyof typeof MatrixType;
export function matrixTypeFromString(s: MatrixTypeStrings): MatrixType {
    if (typeof(s) !== 'string') {
        throw new Error(`matrixTypeFromString: Invalid string ${s}`);
    }
    return MatrixType[s];
}

export function matrixTypeToString(t: MatrixType): string {
    const num = Number(t);
    if (isNaN(num) || num < MatrixType.oneToN || num > MatrixType.nToN) {
        throw new Error(`parameterTypeToString: Invalid parameter type ${t}`);
    }
    return MatrixType[num];
}
