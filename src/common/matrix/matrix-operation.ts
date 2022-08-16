
// ConnectionOperation ::=
//     INTEGER {
//     absolute (0), -- default. sources contains absolute information
//     connect (1), -- nToN only. sources contains sources to add to connection
//     disconnect (2) -- nToN only. sources contains sources to remove from
//     connection
// }

export enum MatrixOperation {
    absolute = 0,
    connect,
    disconnect
}

type MatrixOperationStrings = keyof typeof MatrixOperation;
export function matrixOperationFromString(s: MatrixOperationStrings): MatrixOperation {
    return MatrixOperation[s];
}
