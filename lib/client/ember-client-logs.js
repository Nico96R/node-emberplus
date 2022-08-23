"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logging_service_1 = require("../logging/logging.service");
exports.ClientLogs = {
    CONNECTING: (address) => {
        return {
            logLevel: 5,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Connection to ${address}`, 5, 'CONNECTING');
            }
        };
    },
    CONNECTED: (address) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Connected to ${address}`, 4, 'CONNECTED');
            }
        };
    },
    CONNECTION_FAILED: (address, error) => {
        return {
            logLevel: 4,
            createLog: () => {
                return new logging_service_1.LoggingEvent(`Failed to connect to ${address}`, 4, 'CONNECTION_FAILED', error);
            }
        };
    },
    DISCONNECTING: (address) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent(`Disconnecting from ${address}`, 5, 'DISCONNECTING');
            } };
    },
    EXPANDING_NODE: (node) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Expanding node ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 5, 'EXPANDING_NODE');
            } };
    },
    EXPAND_WITH_NO_CHILD: (node) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`No more children for node ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 5, 'EXPAND_WITH_NO_CHILD');
            } };
    },
    EXPAND_NODE_COMPLETE: (node) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Expand node ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()} completed`, 5, 'EXPAND_NODE_COMPLETE');
            } };
    },
    EXPAND_NODE_ERROR: (node, error) => {
        return { logLevel: 2, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Expand node ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()} error`, 2, 'EXPAND_NODE_ERROR', error);
            } };
    },
    GETDIRECTORY_ERROR: (error) => {
        return { logLevel: 2, createLog: () => {
                return new logging_service_1.LoggingEvent(error, 2, 'GETDIRECTORY_ERROR');
            } };
    },
    GETDIRECTORY_UNEXPECTED_RESPONSE: (nodeReq, nodeRes) => {
        return { logLevel: 3, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Unexpected response to GetDirectory on ${(_a = nodeReq) === null || _a === void 0 ? void 0 : _a.getPath()}`, 3, 'GETDIRECTORY_UNEXPECTED_RESPONSE', nodeReq, nodeRes);
            } };
    },
    GETDIRECTORY_RESPONSE: (node) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent('getDirectory response', 5, 'GETDIRECTORY_RESPONSE', node);
            } };
    },
    GETDIRECTORY_SENDING_QUERY: (node) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Sending GetDirectory query ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 5, 'GETDIRECTORY_SENDING_QUERY');
            } };
    },
    INVOCATION_SENDING_QUERY: (node) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Sending Invocation query ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 5, 'INVOCATION_SENDING_QUERY', node);
            } };
    },
    INVOCATION_RESULT_RECEIVED: (result) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent('Invocation result received', 5, 'INVOCATION_RESULT_RECEIVED', result);
            } };
    },
    INVOCATION_ERROR: (error) => {
        return { logLevel: 2, createLog: () => {
                return new logging_service_1.LoggingEvent(error, 2, 'INVOCATION_ERROR');
            } };
    },
    GET_ELEMENT_REQUEST: (path) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent(`Request for element ${path}`, 5, 'GET_ELEMENT_REQUEST');
            } };
    },
    GET_ELEMENT_RESPONSE: (path, node) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent(`Response to get element ${path}`, 5, 'GET_ELEMENT_RESPONSE', node);
            } };
    },
    MATRIX_CONNECTION_REQUEST: (matrix, target, sources) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent(`Matrix ${matrix.getPath()} connect request for target ${target} to sources ${sources}`, 5, 'MATRIX_CONNECTION_REQUEST');
            } };
    },
    MATRIX_DISCONNECTION_REQUEST: (matrix, target, sources) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent(`Matrix ${matrix.getPath()} disconnect request for target ${target} to sources ${sources}`, 5, 'MATRIX_DISCONNECTION_REQUEST');
            } };
    },
    MATRIX_ABSOLUTE_CONNECTION_REQUEST: (matrix, target, sources) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent(`Matrix ${matrix.getPath()} set connection request for target ${target} to sources ${sources}`, 5, 'MATRIX_ABSOLUTE_CONNECTION_REQUEST');
            } };
    },
    MATRIX_OPERATION_ERROR: (matrix, target, sources) => {
        return { logLevel: 2, createLog: () => {
                return new logging_service_1.LoggingEvent(`Matrix ${matrix.getPath()} operation failure on target ${target} with sources ${sources}`, 2, 'MATRIX_OPERATION_ERROR');
            } };
    },
    MATRIX_OPERATION_UNEXPECTED_ANSWER: (matrix, target, sources) => {
        return { logLevel: 3, createLog: () => {
                return new logging_service_1.LoggingEvent(`Matrix ${matrix.getPath()} operation on target ${target} with sources ${sources}.  Unexpected answer.`, 3, 'MATRIX_OPERATION_UNEXPECTED_ANSWER');
            } };
    },
    SETVALUE_REQUEST: (node, value) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Request on element ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()} to set value to ${value}`, 5, 'SETVALUE_REQUEST');
            } };
    },
    SETVALUE_REQUEST_SUCCESS: (node, value) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Value set to ${value} for element ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 5, 'SETVALUE_REQUEST_SUCCESS');
            } };
    },
    SETVALUE_REQUEST_ERROR: (node, value) => {
        return { logLevel: 2, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Request on element ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()} to set value to ${value} failed`, 2, 'SETVALUE_REQUEST_ERROR');
            } };
    },
    SUBSCRIBE_REQUEST: (node) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Subscribe request on element ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 5, 'INVALID_SUBSCRIBE_REQUEST');
            } };
    },
    INVALID_SUBSCRIBE_REQUEST: (node) => {
        return { logLevel: 2, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Invalid Subscribe request on element ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 2, 'INVALID_SUBSCRIBE_REQUEST');
            } };
    },
    UNSUBSCRIBE_REQUEST: (node) => {
        return { logLevel: 5, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`UnSubscribe request on element ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 5, 'UNSUBSCRIBE_REQUEST');
            } };
    },
    INVALID_UNSUBSCRIBE_REQUEST: (node) => {
        return { logLevel: 2, createLog: () => {
                var _a;
                return new logging_service_1.LoggingEvent(`Invalid UnSubscribe request on element ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()}`, 2, 'INVALID_UNSUBSCRIBE_REQUEST');
            } };
    },
    EMBER_MESSAGE_RECEIVED: () => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent('Received Ember Message', 5, 'EMBER_MESSAGE_RECEIVED');
            } };
    },
    INVALID_EMBER_MESSAGE_RECEIVED: (error) => {
        return { logLevel: 2, createLog: () => {
                return new logging_service_1.LoggingEvent(error, 2, 'INVALID_EMBER_MESSAGE_RECEIVED');
            } };
    },
    REQUEST_FAILURE: (error) => {
        return { logLevel: 2, createLog: () => {
                return new logging_service_1.LoggingEvent(error, 2, 'REQUEST_FAILURE');
            } };
    },
    MAKING_REQUEST: () => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent('Making new request', 5, 'MAKING_REQUEST');
            } };
    },
    UNKOWN_ELEMENT_RECEIVED: (path) => {
        return { logLevel: 3, createLog: () => {
                return new logging_service_1.LoggingEvent(`Unknown element at path ${path}`, 3, 'UNKOWN_ELEMENT_RECEIVED');
            } };
    },
    UNKOWN_STREAM_RECEIVED: (identifier) => {
        return { logLevel: 3, createLog: () => {
                return new logging_service_1.LoggingEvent(`Unknown stream identifier ${identifier}`, 3, 'UNKOWN_STREAM_RECEIVED');
            } };
    },
    DUPLICATE_STREAM_IDENTIFIER: (identifier, path1, path2) => {
        return { logLevel: 3, createLog: () => {
                return new logging_service_1.LoggingEvent(`Duplicate stream identifier ${identifier} on path ${path1} and ${path2}`, 3, 'DUPLICATE_STREAM_IDENTIFIER');
            } };
    },
    ADDING_STREAM_IDENTIFIER: (identifier, path1) => {
        return { logLevel: 5, createLog: () => {
                return new logging_service_1.LoggingEvent(`Adding stream identifier ${identifier} on path ${path1}`, 5, 'ADDING_STREAM_IDENTIFIER');
            } };
    }
};
//# sourceMappingURL=ember-client-logs.js.map