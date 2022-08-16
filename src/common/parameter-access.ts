
export enum ParameterAccess {
    none = 0,
    read,
    write,
    readWrite
}

type ParameterAccessStrings = keyof typeof ParameterAccess;
export function parameterAccessFromString(s: ParameterAccessStrings): ParameterAccess {
    if (typeof(s) !== 'string') {
        throw new Error(`parameterAccessFromString: Invalid string ${s}`);
    }
    return ParameterAccess[s];
}

export function parameterAccessToString(a: ParameterAccess): string {
    const num = Number(a);
    if (isNaN(num) || num < ParameterAccess.none || num > ParameterAccess.readWrite) {
        throw new Error(`parameterAccessToString: Invalid parameter type ${a}`);
    }
    return ParameterAccess[num];
}
