import { ServerLogs } from '../server/ember-server.logs';

export const enum LogLevel {
    critical = 1,
    error,
    warn,
    info,
    debug
}

export interface LogEventConstructor {
    logLevel: LogLevel;
    createLog: (...args: any[]) => LoggingEvent;
}

export interface LoggingEventInterface {
    logLevel: LogLevel;
    type: string;
    arguments: any[];
    error: Error;
    timestamp: number;
    isError: () => boolean;
    toString: () => string;
}

export class LoggingEvent implements LoggingEventInterface {

    get timestamp(): number {
        return this._timestamp;
    }

    get arguments(): any[] {
        return this.args;
    }

    get error(): Error {
        if (this.isError()) {
            return (this.message as Error);
        } else {
            return new Error((this.message as string));
        }
    }
    private _timestamp: number;
    private args: any[];

    constructor(private message: string | Error, readonly logLevel: LogLevel, readonly type: string, ...args: any[]) {
        this.args = args;
        this._timestamp = Date.now();
    }

    isError(): boolean {
        return this.message instanceof Error;
    }
    toString(): string {
        if (this.isError()) {
            return (this.message as Error).message;
        }
        return (this.message as string);
    }
}

export class LoggingService {
    constructor(private logLevel: LogLevel = LogLevel.info) {
        this.log = this.log.bind(this);
    }
    _log(msg: string|Error, ...args: any[]): void {
        console.log(msg, ...args);
    }
    critic(msg: string, ...args: any[]): void {
        if (this.logLevel >= LogLevel.critical) {
            this._log(`${Date.now()} - CRITIC - ${msg}`, ...args);
        }
    }
    debug(msg: string, ...args: any[]): void {
        if (this.logLevel >= LogLevel.debug) {
            this._log(`${Date.now()} - DEBUG - ${msg}`, ...args);
        }
    }
    error(msg: string|Error, ...args: any[]): void {
        if (this.logLevel >= LogLevel.error) {
            if (msg instanceof Error) {
                this._log(`${Date.now()} - ERROR - ${msg.message}`, msg, ...args);
            } else {
                this._log(`${Date.now()} - ERROR - ${msg}`, ...args);
            }
        }
    }
    info(msg: string, ...args: any[]): void {
        if (this.logLevel >= LogLevel.info) {
            this._log(`${Date.now()} - INFO - ${msg}`, ...args);
        }
    }
    warn(msg: string|Error, ...args: any[]): void {
        if (this.logLevel >= LogLevel.warn) {
            if (msg instanceof Error) {
                this._log(`${Date.now()} - WARN - ${msg.message}`, msg, ...args);
            } else {
                this._log(`${Date.now()} - WARN - ${msg}`, ...args);
            }
        }
    }
    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    log(logEvent: LogEventConstructor): void {
        if (this.logLevel < logEvent.logLevel) {
            return;
        }
        const msg = logEvent.createLog();
        switch (msg.logLevel) {
            case LogLevel.debug:
                this.debug(msg.type, msg.toString(), ...msg.arguments);
                break;
            case LogLevel.error:
            case LogLevel.critical:
                this.error(msg.type, msg.error, ...msg.arguments);
                break;
            case LogLevel.warn:
                if (msg.isError()) {
                    this.warn(msg.type, msg.error, ...msg.arguments);
                } else {
                    this.warn(msg.type, msg.toString(), ...msg.arguments);
                }
                break;
            default:
                this.info(msg.type, msg.toString(), ...msg.arguments);
                break;
        }
    }
}
