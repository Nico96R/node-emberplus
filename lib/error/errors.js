"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UnimplementedEmberTypeError extends Error {
    constructor(tag) {
        super();
        const identifier = (tag & 0xC0) >> 6;
        const value = tag == null ? null : (tag & 0x1F).toString();
        let tagStr = tag == null ? null : tag.toString();
        if (identifier === 0) {
            tagStr = `[UNIVERSAL ${value} ]`;
        }
        else if (identifier === 1) {
            tagStr = `[APPLICATION ${value} ]`;
        }
        else if (identifier === 2) {
            tagStr = `[CONTEXT ${value} ]`;
        }
        else {
            tagStr = `[PRIVATE ${value} ]`;
        }
        this.message = `Unimplemented EmBER type ${tagStr}`;
        this.name = UnimplementedEmberTypeError.name;
    }
}
exports.UnimplementedEmberTypeError = UnimplementedEmberTypeError;
class S101SocketError extends Error {
    constructor(message) {
        super(message);
        this.name = S101SocketError.name;
    }
}
exports.S101SocketError = S101SocketError;
class ASN1Error extends Error {
    constructor(message) {
        super(message);
        this.name = ASN1Error.name;
    }
}
exports.ASN1Error = ASN1Error;
class InvalidEmberResponseError extends Error {
    constructor(req) {
        super(`Invalid Ember Response to ${req}`);
        this.name = InvalidEmberResponseError.name;
    }
}
exports.InvalidEmberResponseError = InvalidEmberResponseError;
class EmberTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = EmberTimeoutError.name;
    }
}
exports.EmberTimeoutError = EmberTimeoutError;
class InvalidCommandError extends Error {
    constructor(number) {
        super(`Invalid command ${number}`);
        this.name = InvalidCommandError.name;
    }
}
exports.InvalidCommandError = InvalidCommandError;
class MissingElementNumberError extends Error {
    constructor() {
        super('Missing element number');
        this.name = MissingElementNumberError.name;
    }
}
exports.MissingElementNumberError = MissingElementNumberError;
class MissingElementContentsError extends Error {
    constructor(path) {
        super(`Missing element contents at ${path}`);
        this.name = MissingElementContentsError.name;
    }
}
exports.MissingElementContentsError = MissingElementContentsError;
class UnknownElementError extends Error {
    constructor(path) {
        super(`No element at path ${path}`);
        this.name = UnknownElementError.name;
    }
}
exports.UnknownElementError = UnknownElementError;
class InvalidRequestError extends Error {
    constructor() {
        super('Invalid Request');
        this.name = InvalidRequestError.name;
    }
}
exports.InvalidRequestError = InvalidRequestError;
class InvalidRequestFormatError extends Error {
    constructor(path) {
        super(`Invalid Request Format with path ${path}`);
        this.name = InvalidRequestFormatError.name;
    }
}
exports.InvalidRequestFormatError = InvalidRequestFormatError;
class InvalidEmberNodeError extends Error {
    constructor(path = 'unknown', info = '') {
        super(`Invalid Ember Node at ${path}: ${info}`);
        this.name = InvalidEmberNodeError.name;
    }
}
exports.InvalidEmberNodeError = InvalidEmberNodeError;
class PathDiscoveryFailureError extends Error {
    constructor(path) {
        super(PathDiscoveryFailureError.getMessage(path));
        this.name = PathDiscoveryFailureError.name;
    }
    static getMessage(path) {
        return `Failed path discovery at ${path}`;
    }
    setPath(path) {
        this.message = PathDiscoveryFailureError.getMessage(path);
    }
}
exports.PathDiscoveryFailureError = PathDiscoveryFailureError;
class InvalidBERFormatError extends Error {
    constructor(info = '') {
        super(`Invalid BER format: ${info}`);
        this.name = InvalidBERFormatError.name;
    }
}
exports.InvalidBERFormatError = InvalidBERFormatError;
class InvalidMatrixSignalError extends Error {
    constructor(value, info) {
        super(`Invalid Matrix Signal: ${value}: ${info}`);
        this.name = InvalidMatrixSignalError.name;
    }
}
exports.InvalidMatrixSignalError = InvalidMatrixSignalError;
class ErrorMultipleError extends Error {
    constructor(errors) {
        super('Multiple Errors');
        this.errors = errors;
        this.name = ErrorMultipleError.name;
    }
}
exports.ErrorMultipleError = ErrorMultipleError;
class InvalidFunctionCallError extends Error {
    constructor(msg) {
        super(msg);
    }
}
exports.InvalidFunctionCallError = InvalidFunctionCallError;
class UnsupportedValueError extends Error {
    constructor(value) {
        super(`Value ${value} of type ${typeof value} is not supported`);
    }
}
exports.UnsupportedValueError = UnsupportedValueError;
//# sourceMappingURL=errors.js.map