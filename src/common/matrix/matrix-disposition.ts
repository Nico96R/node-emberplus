
// ConnectionDisposition ::=
//     INTEGER {
//     tally (0), -- default
//     modified (1), -- sources contains new current state
//     pending (2), -- sources contains future state
//     locked (3) -- error: target locked. sources contains current state
//     -- more tbd.
// }
export enum MatrixDisposition {
    tally = 0,
    modified,
    pending,
    locked
}

type MatrixDispositionStrings = keyof typeof MatrixDisposition;
export function matrixDispositionFromString(s: MatrixDispositionStrings): MatrixDisposition {
    return MatrixDisposition[s];
}
