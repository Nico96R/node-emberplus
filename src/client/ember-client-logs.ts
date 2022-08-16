import { LoggingEvent, LogLevel, LogEventConstructor } from '../logging/logging.service';
import { TreeNode } from '../common/tree-node';
import { InvocationResult } from '../common/invocation-result';
import { Matrix } from '../common/matrix/matrix';

export  const ClientLogs: {[index: string]: (...args: any[]) => LogEventConstructor} = {
    CONNECTING: (address: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: (): LoggingEvent => {
                return new LoggingEvent(`Connection to ${address}`, LogLevel.debug, 'CONNECTING');
            }
        };
    },

    CONNECTED: (address: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: (): LoggingEvent => {
                return new LoggingEvent(`Connected to ${address}`, LogLevel.info, 'CONNECTED');
            }
        };
    },

    CONNECTION_FAILED: (address: string, error: Error): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: (): LoggingEvent => {
                return new LoggingEvent(`Failed to connect to ${address}`,
                LogLevel.info, 'CONNECTION_FAILED', error);
            }
        };
    },

    DISCONNECTING: (address: string): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Disconnecting from ${address}`,
            LogLevel.debug, 'DISCONNECTING');
    }}; },

    EXPANDING_NODE: (node?: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Expanding node ${node?.getPath()}`,
            LogLevel.debug, 'EXPANDING_NODE');
    }}; },

    EXPAND_WITH_NO_CHILD: (node: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`No more children for node ${node?.getPath()}`,
            LogLevel.debug, 'EXPAND_WITH_NO_CHILD');
    }}; },

    EXPAND_NODE_COMPLETE: (node: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Expand node ${node?.getPath()} completed`,
            LogLevel.debug, 'EXPAND_NODE_COMPLETE');
    }}; },

    EXPAND_NODE_ERROR: (node: TreeNode|null, error: Error): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Expand node ${node?.getPath()} error`,
            LogLevel.error, 'EXPAND_NODE_ERROR', error);
    }}; },

    GETDIRECTORY_ERROR: (error: Error): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(error,
            LogLevel.error, 'GETDIRECTORY_ERROR');
    }}; },

    GETDIRECTORY_UNEXPECTED_RESPONSE: (nodeReq: TreeNode, nodeRes: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.warn, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Unexpected response to GetDirectory on ${nodeReq?.getPath()}`,
            LogLevel.warn, 'GETDIRECTORY_UNEXPECTED_RESPONSE', nodeReq, nodeRes);
    }}; },

    GETDIRECTORY_RESPONSE: (node: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent('getDirectory response',
            LogLevel.debug, 'GETDIRECTORY_RESPONSE', node);
    }}; },

    GETDIRECTORY_SENDING_QUERY: (node: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Sending GetDirectory query ${node?.getPath()}`,
            LogLevel.debug, 'GETDIRECTORY_SENDING_QUERY');
    }}; },

    INVOCATION_SENDING_QUERY: (node: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Sending Invocation query ${node?.getPath()}`,
            LogLevel.debug, 'INVOCATION_SENDING_QUERY', node);
    }}; },

    INVOCATION_RESULT_RECEIVED: (result: InvocationResult): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent('Invocation result received',
            LogLevel.debug, 'INVOCATION_RESULT_RECEIVED', result);
    }}; },

    INVOCATION_ERROR:  (error: Error): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(error,
            LogLevel.error, 'INVOCATION_ERROR');
    }}; },

    GET_ELEMENT_REQUEST:  (path: string): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Request for element ${path}`,
            LogLevel.debug, 'GET_ELEMENT_REQUEST');
    }}; },

    GET_ELEMENT_RESPONSE: (path: string, node: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Response to get element ${path}`,
            LogLevel.debug, 'GET_ELEMENT_RESPONSE', node);
    }}; },

    MATRIX_CONNECTION_REQUEST: (matrix: Matrix, target: number, sources: number[]): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Matrix ${matrix.getPath()} connect request for target ${target} to sources ${sources}`,
            LogLevel.debug, 'MATRIX_CONNECTION_REQUEST');
    }}; },

    MATRIX_DISCONNECTION_REQUEST: (matrix: Matrix, target: number, sources: number[]): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Matrix ${matrix.getPath()} disconnect request for target ${target} to sources ${sources}`,
            LogLevel.debug, 'MATRIX_DISCONNECTION_REQUEST');
    }}; },

    MATRIX_ABSOLUTE_CONNECTION_REQUEST: (matrix: Matrix, target: number, sources: number[]): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Matrix ${matrix.getPath()} set connection request for target ${target} to sources ${sources}`,
            LogLevel.debug, 'MATRIX_ABSOLUTE_CONNECTION_REQUEST');
    }}; },

    MATRIX_OPERATION_ERROR: (matrix: Matrix, target: number, sources: number[]): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Matrix ${matrix.getPath()} operation failure on target ${target} with sources ${sources}`,
            LogLevel.error, 'MATRIX_OPERATION_ERROR');
    }}; },

    MATRIX_OPERATION_UNEXPECTED_ANSWER: (matrix: Matrix, target: number, sources: number[]): LogEventConstructor => {
        return {logLevel: LogLevel.warn, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Matrix ${matrix.getPath()} operation on target ${target} with sources ${sources}.  Unexpected answer.`,
            LogLevel.warn, 'MATRIX_OPERATION_UNEXPECTED_ANSWER');
    }}; },

    SETVALUE_REQUEST: (node: TreeNode, value: string | number | boolean | Buffer): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Request on element ${node?.getPath()} to set value to ${value}`,
            LogLevel.debug, 'SETVALUE_REQUEST');
    }}; },

    SETVALUE_REQUEST_SUCCESS: (node: TreeNode, value: string | number | boolean | Buffer): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Value set to ${value} for element ${node?.getPath()}`,
            LogLevel.debug, 'SETVALUE_REQUEST_SUCCESS');
    }}; },

    SETVALUE_REQUEST_ERROR: (node: TreeNode, value: string | number | boolean | Buffer): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Request on element ${node?.getPath()} to set value to ${value} failed`,
            LogLevel.error, 'SETVALUE_REQUEST_ERROR');
    }}; },

    SUBSCRIBE_REQUEST: (node?: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Subscribe request on element ${node?.getPath()}`,
            LogLevel.debug, 'INVALID_SUBSCRIBE_REQUEST');
    }}; },

    INVALID_SUBSCRIBE_REQUEST: (node?: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Invalid Subscribe request on element ${node?.getPath()}`,
            LogLevel.error, 'INVALID_SUBSCRIBE_REQUEST');
    }}; },

    UNSUBSCRIBE_REQUEST: (node?: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`UnSubscribe request on element ${node?.getPath()}`,
            LogLevel.debug, 'UNSUBSCRIBE_REQUEST');
    }}; },

    INVALID_UNSUBSCRIBE_REQUEST: (node?: TreeNode): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Invalid UnSubscribe request on element ${node?.getPath()}`,
            LogLevel.error, 'INVALID_UNSUBSCRIBE_REQUEST');
    }}; },

    EMBER_MESSAGE_RECEIVED: (): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent('Received Ember Message',
            LogLevel.debug, 'EMBER_MESSAGE_RECEIVED');
    }}; },

    INVALID_EMBER_MESSAGE_RECEIVED: (error: Error): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(error,
            LogLevel.error, 'INVALID_EMBER_MESSAGE_RECEIVED');
    }}; },

    REQUEST_FAILURE: (error: Error): LogEventConstructor => {
        return {logLevel: LogLevel.error, createLog: (): LoggingEvent => {
        return new LoggingEvent(error,
            LogLevel.error, 'REQUEST_FAILURE');
    }}; },

    MAKING_REQUEST: (): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent('Making new request',
            LogLevel.debug, 'MAKING_REQUEST');
    }}; },

    UNKOWN_ELEMENT_RECEIVED: (path: string): LogEventConstructor => {
        return {logLevel: LogLevel.warn, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Unknown element at path ${path}`,
            LogLevel.warn, 'UNKOWN_ELEMENT_RECEIVED');
    }}; },

    UNKOWN_STREAM_RECEIVED: (identifier: number): LogEventConstructor => {
        return {logLevel: LogLevel.warn, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Unknown stream identifier ${identifier}`,
            LogLevel.warn, 'UNKOWN_STREAM_RECEIVED');
    }}; },

    DUPLICATE_STREAM_IDENTIFIER: (identifier: number, path1: string, path2: string): LogEventConstructor => {
        return {logLevel: LogLevel.warn, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Duplicate stream identifier ${identifier} on path ${path1} and ${path2}`,
            LogLevel.warn, 'DUPLICATE_STREAM_IDENTIFIER');
    }}; },

    ADDING_STREAM_IDENTIFIER: (identifier: number, path1: string): LogEventConstructor => {
        return {logLevel: LogLevel.debug, createLog: (): LoggingEvent => {
        return new LoggingEvent(`Adding stream identifier ${identifier} on path ${path1}`,
            LogLevel.debug, 'ADDING_STREAM_IDENTIFIER');
    }}; }
};
