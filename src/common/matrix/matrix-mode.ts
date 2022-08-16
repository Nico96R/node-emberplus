
export enum MatrixMode {
    linear = 0,
    nonLinear
}

type MatrixModeStrings = keyof typeof MatrixMode;
export function matrixModeFromString(s: MatrixModeStrings): MatrixMode {
    if (typeof(s) !== 'string') {
        throw new Error(`matrixModeFromString: Invalid string ${s}`);
    }
    return MatrixMode[s];
}

export function matrixModeToString(m: MatrixMode): string {
    const num = Number(m);
    if (isNaN(num) || num < MatrixMode.linear || num > MatrixMode.nonLinear) {
        throw new Error(`matrixModeToString: Invalid parameter type ${m}`);
    }
    return MatrixMode[num];
}
