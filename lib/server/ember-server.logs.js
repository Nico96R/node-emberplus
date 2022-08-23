"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logging_service_1 = require("../logging/logging.service");
const errors_1 = require("../error/errors");
exports.ServerLogs = {
    UPDATE_SUBSCRIBERS_WARN: (client, path) => {
        return {
            logLevel: 3,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Client ${client.remoteAddress} not connected - clean up subscription to ${path}`, 3, 'UPDATE_SUBSCRIBERS_WARN');
            }
        };
    },
    MATRIX_CONNECT: (path, target, sources) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Handling matrix connect for path: ${path} target: ${target} sources: ${sources.toString()}`, 5, 'MATRIX_CONNECT');
            }
        };
    },
    MATRIX_DISCONNECT: (path, target, sources) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Handling matrix disconnect for path: ${path} target: ${target} sources: ${sources.toString()}`, 5, 'MATRIX_DISCONNECT');
            }
        };
    },
    MATRIX_SET: (path, target, sources) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Handling matrix disconnect for path: ${path} target: ${target} sources: ${sources.toString()}`, 5, 'MATRIX_SET');
            }
        };
    },
    PRE_MATRIX_CONNECT: (matrix, connection) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`preMatrixConnect for path: ${matrix.getPath()} target: ${connection.target}` +
                    `sources: ${connection.sources == null ? 'empty' : connection.sources.toString()}`, 5, 'PRE_MATRIX_CONNECT');
            }
        };
    },
    APPLY_MATRIX_CONNECT: (matrix, connection, emitType) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Apply connect for matrix path ${matrix.getPath()} target: ${connection.target}`, 5, 'APPLY_MATRIX_CONNECT', `result: ${emitType}`);
            }
        };
    },
    DISCONNECT_MATRIX_TARGET: (matrix, target, sources) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Apply connect for matrix path ${matrix.getPath()} target: ${target}` +
                    `sources: ${sources == null ? 'empty' : sources.toString()}`, 5, 'DISCONNECT_MATRIX_TARGET');
            }
        };
    },
    DISCONNECT_SOURCES: (matrix, target, sources) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Apply disconnect for matrix path ${matrix.getPath()} target: ${target}` +
                    `sources: ${sources == null ? 'empty' : sources.toString()}`, 5, 'DISCONNECT_SOURCES');
            }
        };
    },
    APPLY_ONETOONE_DISCONNECT: (matrix, connection, conResult) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Apply 1to1 disconnect for matrix path ${matrix.getPath()} target: ${connection.target}`, 5, 'APPLY_ONETOONE_DISCONNECT', `result: ${conResult.disposition}`);
            }
        };
    },
    REPLACE_ELEMENT: (path) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`replace element requested for ${path}`, 4, 'REPLACE_ELEMENT');
            }
        };
    },
    SET_VALUE: (element, value) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`New value ${value} for parameter ${element.getPath()}/${element.identifier}`, 4, 'SET_VALUE');
            }
        };
    },
    SET_VALUE_UNCHANGED: (element, value) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`SetValue ignore as unchanged for parameter ${element.getPath()}/${element.identifier} and value ${value}`, 4, 'SET_VALUE_UNCHANGED');
            }
        };
    },
    INVALID_EMBER_NODE: (element) => {
        return {
            logLevel: 3,
            createLog: () => {
                return new logging_service_1.LoggingEvent(new errors_1.InvalidEmberNodeError(element.getPath(), 'no contents'), 3, 'INVALID_EMBER_NODE');
            }
        };
    },
    SUBSCRIBE: (client, path) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Client ${client.remoteAddress} subscribed to ${path}`, 4, 'SUBSCRIBE');
            }
        };
    },
    UNSUBSCRIBE: (client, path) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Client ${client.remoteAddress} unsubscribed to ${path}`, 4, 'UNSUBSCRIBE');
            }
        };
    },
    UPDATE_SUBSCRIBERS: (client, path) => {
        return {
            logLevel: 3,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Client ${client.remoteAddress} update sent for ${path}`, 3, 'UPDATE_SUBSCRIBERS');
            }
        };
    },
    LISTENING: () => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent('Server listening', 4, 'LISTENING');
            }
        };
    },
    CONNECTION: (client) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`New connection from ${client.remoteAddress}`, 4, 'CONNECTION');
            }
        };
    },
    EMBER_REQUEST: (client) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`New request from ${client.remoteAddress}`, 5, 'EMBER_REQUEST');
            }
        };
    },
    EMBER_REQUEST_ERROR: (client, error) => {
        return {
            logLevel: 2,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Request error from ${client.remoteAddress}`, 2, 'EMBER_REQUEST_ERROR', error);
            }
        };
    },
    DISCONNECT: (client) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Disconnect from ${client.remoteAddress}`, 4, 'DISCONNECT');
            }
        };
    },
    CLIENT_ERROR: (client, error) => {
        return {
            logLevel: 2,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Error from ${client.remoteAddress}`, 2, 'CLIENT_ERROR', error);
            }
        };
    },
    SERVER_DISCONNECT: () => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent('Server Disconnected', 4, 'SERVER_DISCONNECT');
            }
        };
    },
    SERVER_ERROR: (error) => {
        return {
            logLevel: 2,
            createLog: () => {
                return new logging_service_1.LoggingEvent(error, 2, 'SERVER_ERROR');
            }
        };
    },
    SERVER_CLOSING: () => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent('Server closing', 4, 'SERVER_CLOSING');
            }
        };
    },
    ERROR_HANDLING: (error) => {
        return {
            logLevel: 2,
            createLog: () => {
                return new logging_service_1.LoggingEvent(error, 2, 'ERROR_HANDLING');
            }
        };
    },
    GETDIRECTORY: (element) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Sent getDirectory response for ${element.getPath()}`, 5, 'GETDIRECTORY');
            }
        };
    },
    HANDLE_MATRIX_CONNECTIONS: () => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent('Handling matrix connections', 5, 'HANDLE_MATRIX_CONNECTIONS');
            }
        };
    },
    EMPTY_REQUEST: () => {
        return {
            logLevel: 3,
            createLog: () => {
                return new logging_service_1.LoggingEvent('Received emtpy request', 3, 'EMPTY_REQUEST');
            }
        };
    },
    HANDLE_QUALIFIED_NODE: (path) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Handling qualified node ${path}`, 5, 'HANDLE_QUALIFIED_NODE');
            }
        };
    },
    UNEXPECTED: (msg) => {
        return {
            logLevel: 3,
            createLog: () => {
                return new logging_service_1.LoggingEvent(msg, 3, 'UNEXPECTED');
            }
        };
    },
    HANDLE_NODE: (number) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Handling node ${number}`, 5, 'HANDLE_NODE');
            }
        };
    },
    FUNCTION_ERROR: (error) => {
        return {
            logLevel: 3,
            createLog: () => {
                return new logging_service_1.LoggingEvent('Function failed', 3, 'FUNCTION_ERROR', error);
            }
        };
    }
};
//# sourceMappingURL=ember-server.logs.js.map