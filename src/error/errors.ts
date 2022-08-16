
export class UnimplementedEmberTypeError extends Error {
    constructor(tag?: number) {
        super();
        const identifier = (tag & 0xC0) >> 6;
        const value = tag == null ? null : (tag & 0x1F).toString();
        let tagStr = tag == null ? null : tag.toString();
        if (identifier === 0) {
            tagStr = `[UNIVERSAL ${value} ]`;
        } else if (identifier === 1) {
            tagStr = `[APPLICATION ${value} ]`;
        } else if (identifier === 2) {
            tagStr = `[CONTEXT ${value} ]`;
        } else {
            tagStr = `[PRIVATE ${value} ]`;
        }
        this.message = `Unimplemented EmBER type ${tagStr}`;
        this.name = UnimplementedEmberTypeError.name;
    }
}

export class S101SocketError extends Error {
    constructor(message: string) {
        super(message);
        this.name = S101SocketError.name;
    }
}

export class ASN1Error extends Error {
    constructor(message: string) {
        super(message);
        this.name = ASN1Error.name;
    }
}

export class InvalidEmberResponseError extends Error {
    constructor(req: string) {
        super(`Invalid Ember Response to ${req}`);
        this.name = InvalidEmberResponseError.name;
    }
}

export class EmberTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = EmberTimeoutError.name;
    }
}

export class InvalidCommandError extends Error {
    constructor(number: number) {
        super(`Invalid command ${number}`);
        this.name = InvalidCommandError.name;
    }
}

export class MissingElementNumberError extends Error {
    constructor() {
        super('Missing element number');
        this.name = MissingElementNumberError.name;
    }
}

export class MissingElementContentsError extends Error {
    constructor(path: string) {
        super(`Missing element contents at ${path}`);
        this.name = MissingElementContentsError.name;
    }
}

export class UnknownElementError extends Error {
    constructor(path: string) {
        super(`No element at path ${path}`);
        this.name = UnknownElementError.name;
    }
}

export class InvalidRequestError extends Error {
    constructor() {
        super('Invalid Request');
        this.name = InvalidRequestError.name;
    }
}

export class InvalidRequestFormatError extends Error {
    constructor(path: string) {
        super(`Invalid Request Format with path ${path}`);
        this.name = InvalidRequestFormatError.name;
    }
}

export class InvalidEmberNodeError extends Error {
    constructor(path = 'unknown', info = '') {
        super(`Invalid Ember Node at ${path}: ${info}`);
        this.name = InvalidEmberNodeError.name;
    }
}

export class PathDiscoveryFailureError extends Error {
    constructor(path: string) {
        super(PathDiscoveryFailureError.getMessage(path));
        this.name = PathDiscoveryFailureError.name;
    }

    static getMessage(path: string): string {
        return `Failed path discovery at ${path}`;
    }

    setPath(path: string): void {
        this.message = PathDiscoveryFailureError.getMessage(path);
    }
}

export class InvalidBERFormatError extends Error {
    constructor(info = '') {
        super(`Invalid BER format: ${info}`);
        this.name = InvalidBERFormatError.name;
    }
}

export class InvalidMatrixSignalError extends Error {
    constructor(value: number, info: string) {
        super(`Invalid Matrix Signal: ${value}: ${info}`);
        this.name = InvalidMatrixSignalError.name;
    }
}

export class ErrorMultipleError extends Error {
    constructor(public errors: Error[]) {
        super('Multiple Errors');
        this.name = ErrorMultipleError.name;
    }
}

export class InvalidFunctionCallError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

export class UnsupportedValueError extends Error {
    constructor(value: any) {
        super(`Value ${value} of type ${typeof value} is not supported`);
    }
}
