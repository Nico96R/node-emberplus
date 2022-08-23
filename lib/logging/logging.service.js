"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LoggingEvent {
    constructor(message, logLevel, type, ...args) {
        this.message = message;
        this.logLevel = logLevel;
        this.type = type;
        this.args = args;
        this._timestamp = Date.now();
    }
    get timestamp() {
        return this._timestamp;
    }
    get arguments() {
        return this.args;
    }
    get error() {
        if (this.isError()) {
            return this.message;
        }
        else {
            return new Error(this.message);
        }
    }
    isError() {
        return this.message instanceof Error;
    }
    toString() {
        if (this.isError()) {
            return this.message.message;
        }
        return this.message;
    }
}
exports.LoggingEvent = LoggingEvent;
class LoggingService {
    constructor(logLevel = 4) {
        this.logLevel = logLevel;
        this.log = this.log.bind(this);
    }
    _log(msg, ...args) {
        console.log(msg, ...args);
    }
    critic(msg, ...args) {
        if (this.logLevel >= 1) {
            this._log(`${Date.now()} - CRITIC - ${msg}`, ...args);
        }
    }
    debug(msg, ...args) {
        if (this.logLevel >= 5) {
            this._log(`${Date.now()} - DEBUG - ${msg}`, ...args);
        }
    }
    error(msg, ...args) {
        if (this.logLevel >= 2) {
            if (msg instanceof Error) {
                this._log(`${Date.now()} - ERROR - ${msg.message}`, msg, ...args);
            }
            else {
                this._log(`${Date.now()} - ERROR - ${msg}`, ...args);
            }
        }
    }
    info(msg, ...args) {
        if (this.logLevel >= 4) {
            this._log(`${Date.now()} - INFO - ${msg}`, ...args);
        }
    }
    warn(msg, ...args) {
        if (this.logLevel >= 3) {
            if (msg instanceof Error) {
                this._log(`${Date.now()} - WARN - ${msg.message}`, msg, ...args);
            }
            else {
                this._log(`${Date.now()} - WARN - ${msg}`, ...args);
            }
        }
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    log(logEvent) {
        if (this.logLevel < logEvent.logLevel) {
            return;
        }
        const msg = logEvent.createLog();
        switch (msg.logLevel) {
            case 5:
                this.debug(msg.type, msg.toString(), ...msg.arguments);
                break;
            case 2:
            case 1:
                this.error(msg.type, msg.error, ...msg.arguments);
                break;
            case 3:
                if (msg.isError()) {
                    this.warn(msg.type, msg.error, ...msg.arguments);
                }
                else {
                    this.warn(msg.type, msg.toString(), ...msg.arguments);
                }
                break;
            default:
                this.info(msg.type, msg.toString(), ...msg.arguments);
                break;
        }
    }
}
exports.LoggingService = LoggingService;
//# sourceMappingURL=logging.service.js.map