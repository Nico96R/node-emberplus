import { S101Socket } from '../socket/s101.socket';
import { LogLevel, LoggingEventInterface, LoggingEvent, LogEventConstructor } from '../logging/logging.service';
import { MatrixConnection } from '../common/matrix/matrix-connection';
import { Matrix } from '../common/matrix/matrix';
import { Parameter } from '../common/parameter';
import { InvalidEmberNodeError } from '../error/errors';
import { TreeNode } from '../common/tree-node';
import { QualifiedParameter } from '../common/qualified-parameter';

export const ServerLogs: {[index: string]: (...args: any[]) => LogEventConstructor} = {

    UPDATE_SUBSCRIBERS_WARN: (client: S101Socket, path: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.warn,
            createLog: () => {
                return new LoggingEvent(`Client ${client.remoteAddress} not connected - clean up subscription to ${path}`,
                LogLevel.warn, 'UPDATE_SUBSCRIBERS_WARN');
            }
        };
    },

    MATRIX_CONNECT: (path: string, target: number, sources: number[]): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => {
                return new LoggingEvent(`Handling matrix connect for path: ${path} target: ${target} sources: ${sources.toString()}`,
                LogLevel.debug, 'MATRIX_CONNECT');
            }
        };
    },

    MATRIX_DISCONNECT: (path: string, target: number, sources: number[]): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => {
                return new LoggingEvent(
                    `Handling matrix disconnect for path: ${path} target: ${target} sources: ${sources.toString()}`,
                    LogLevel.debug, 'MATRIX_DISCONNECT');
            }
        };
    },

    MATRIX_SET: (path: string, target: number, sources: number[]): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => {
                return new LoggingEvent(
                    `Handling matrix disconnect for path: ${path} target: ${target} sources: ${sources.toString()}`,
                    LogLevel.debug, 'MATRIX_SET');
        }};
    },

    PRE_MATRIX_CONNECT: (matrix: Matrix, connection: MatrixConnection): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`preMatrixConnect for path: ${matrix.getPath()} target: ${connection.target}` +
            `sources: ${connection.sources == null ? 'empty' : connection.sources.toString()}`,
            LogLevel.debug, 'PRE_MATRIX_CONNECT');
        }};
    },

    APPLY_MATRIX_CONNECT: (matrix: Matrix, connection: MatrixConnection, emitType: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`Apply connect for matrix path ${matrix.getPath()} target: ${connection.target}`,
                LogLevel.debug, 'APPLY_MATRIX_CONNECT', `result: ${emitType}`);
        }};
    },

    DISCONNECT_MATRIX_TARGET: (matrix: Matrix, target: number, sources?: number[]): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`Apply connect for matrix path ${matrix.getPath()} target: ${target}` +
            `sources: ${sources == null ? 'empty' : sources.toString()}`,
            LogLevel.debug, 'DISCONNECT_MATRIX_TARGET');
        }};
    },

    DISCONNECT_SOURCES: (matrix: Matrix, target: number, sources?: number[]): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`Apply disconnect for matrix path ${matrix.getPath()} target: ${target}` +
            `sources: ${sources == null ? 'empty' : sources.toString()}`,
            LogLevel.debug, 'DISCONNECT_SOURCES');
        }};
    },

    APPLY_ONETOONE_DISCONNECT: (matrix: Matrix, connection: MatrixConnection, conResult: MatrixConnection): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`Apply 1to1 disconnect for matrix path ${matrix.getPath()} target: ${connection.target}`,
            LogLevel.debug, 'APPLY_ONETOONE_DISCONNECT', `result: ${conResult.disposition}`);
        }};
    },

    REPLACE_ELEMENT: (path: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent(`replace element requested for ${path}`,
            LogLevel.info, 'REPLACE_ELEMENT');
        }};
    },

    SET_VALUE: (element: Parameter | QualifiedParameter, value: string | number | boolean | Buffer): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent(`New value ${value} for parameter ${element.getPath()}/${element.identifier}`,
                LogLevel.info, 'SET_VALUE');
        }};
    },

    SET_VALUE_UNCHANGED: (element: Parameter | QualifiedParameter, value: string | number | boolean | Buffer): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent(`SetValue ignore as unchanged for parameter ${element.getPath()}/${element.identifier} and value ${value}`,
                LogLevel.info, 'SET_VALUE_UNCHANGED');
        }};
    },

    INVALID_EMBER_NODE: (element: TreeNode): LogEventConstructor => {
        return {
            logLevel: LogLevel.warn,
            createLog: () => { return new LoggingEvent(new InvalidEmberNodeError(element.getPath(), 'no contents'),
            LogLevel.warn, 'INVALID_EMBER_NODE');
        }};
    },

    SUBSCRIBE: (client: S101Socket, path: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent(`Client ${client.remoteAddress} subscribed to ${path}`,
            LogLevel.info, 'SUBSCRIBE');
        }};
    },

    UNSUBSCRIBE: (client: S101Socket, path: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent(`Client ${client.remoteAddress} unsubscribed to ${path}`,
            LogLevel.info, 'UNSUBSCRIBE');
        }};
    },

    UPDATE_SUBSCRIBERS: (client: S101Socket, path: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.warn,
            createLog: () => { return new LoggingEvent(`Client ${client.remoteAddress} update sent for ${path}`,
            LogLevel.warn, 'UPDATE_SUBSCRIBERS');
        }};
    },

    LISTENING: (): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent('Server listening',
            LogLevel.info, 'LISTENING');
        }};
    },

    CONNECTION: (client: S101Socket): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent(`New connection from ${client.remoteAddress}`,
            LogLevel.info, 'CONNECTION');
        }};
    },

    EMBER_REQUEST: (client: S101Socket): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`New request from ${client.remoteAddress}`,
            LogLevel.debug, 'EMBER_REQUEST');
        }};
    },

    EMBER_REQUEST_ERROR: (client: S101Socket, error: Error): LogEventConstructor => {
        return {
            logLevel: LogLevel.error,
            createLog: () => { return new LoggingEvent(`Request error from ${client.remoteAddress}`,
            LogLevel.error, 'EMBER_REQUEST_ERROR', error);
        }};
    },

    DISCONNECT: (client: S101Socket): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent(`Disconnect from ${client.remoteAddress}`,
            LogLevel.info, 'DISCONNECT');
        }};
    },

    CLIENT_ERROR: (client: S101Socket, error: Error): LogEventConstructor => {
        return {
            logLevel: LogLevel.error,
            createLog: () => { return new LoggingEvent(`Error from ${client.remoteAddress}`,
            LogLevel.error, 'CLIENT_ERROR', error);
        }};
    },

    SERVER_DISCONNECT: (): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent('Server Disconnected',
            LogLevel.info, 'SERVER_DISCONNECT');
        }};
    },

    SERVER_ERROR: (error: Error): LogEventConstructor => {
        return {
            logLevel: LogLevel.error,
            createLog: () => { return new LoggingEvent(error,
            LogLevel.error, 'SERVER_ERROR');
        }};
    },

    SERVER_CLOSING: (): LogEventConstructor => {
        return {
            logLevel: LogLevel.info,
            createLog: () => { return new LoggingEvent('Server closing',
            LogLevel.info, 'SERVER_CLOSING');
        }};
    },

    ERROR_HANDLING: (error: Error): LogEventConstructor => {
        return {
            logLevel: LogLevel.error,
            createLog: () => { return new LoggingEvent(error,
            LogLevel.error, 'ERROR_HANDLING');
        }};
    },

    GETDIRECTORY: (element: TreeNode): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`Sent getDirectory response for ${element.getPath()}`,
            LogLevel.debug, 'GETDIRECTORY');
        }};
    },

    HANDLE_MATRIX_CONNECTIONS: (): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent('Handling matrix connections',
            LogLevel.debug, 'HANDLE_MATRIX_CONNECTIONS');
        }};
    },

    EMPTY_REQUEST: (): LogEventConstructor => {
        return {
            logLevel: LogLevel.warn,
            createLog: () => { return new LoggingEvent('Received emtpy request',
            LogLevel.warn, 'EMPTY_REQUEST');
        }};
    },

    HANDLE_QUALIFIED_NODE: (path: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`Handling qualified node ${path}`,
            LogLevel.debug, 'HANDLE_QUALIFIED_NODE');
        }};
    },

    UNEXPECTED: (msg: string): LogEventConstructor => {
        return {
            logLevel: LogLevel.warn,
            createLog: () => { return new LoggingEvent(msg,
            LogLevel.warn, 'UNEXPECTED');
        }};
    },

    HANDLE_NODE: (number: number): LogEventConstructor => {
        return {
            logLevel: LogLevel.debug,
            createLog: () => { return new LoggingEvent(`Handling node ${number}`,
            LogLevel.debug, 'HANDLE_NODE');
        }};
    },

    FUNCTION_ERROR: (error: Error): LogEventConstructor => {
        return {
            logLevel: LogLevel.warn,
            createLog: () => { return new LoggingEvent('Function failed',
            LogLevel.warn, 'FUNCTION_ERROR', error);
        }};
    }
};
