"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const s101_socket_1 = require("./s101.socket");
const net = require("net");
const errors_1 = require("../error/errors");
var S101ServerEvent;
(function (S101ServerEvent) {
    S101ServerEvent["CONNECTION"] = "connection";
    S101ServerEvent["LISTENING"] = "listening";
    S101ServerEvent["ERROR"] = "error";
    S101ServerEvent["DISCONNECTED"] = "disconnected";
})(S101ServerEvent = exports.S101ServerEvent || (exports.S101ServerEvent = {}));
var SocketServerEvent;
(function (SocketServerEvent) {
    SocketServerEvent["LISTENING"] = "listening";
    SocketServerEvent["ERROR"] = "error";
})(SocketServerEvent = exports.SocketServerEvent || (exports.SocketServerEvent = {}));
class S101Server extends events_1.EventEmitter {
    constructor(_address, _port) {
        super();
        this._address = _address;
        this._port = _port;
        this._server = null;
        this._status = 'disconnected';
    }
    get address() {
        return this._address;
    }
    get server() {
        return this._server;
    }
    get port() {
        return this._port;
    }
    get status() {
        return this._status;
    }
    addClient(socket) {
        const client = new s101_socket_1.S101Socket(socket);
        this.emit(S101ServerEvent.CONNECTION, client);
    }
    close(cb) {
        if (this.server != null) {
            this.server.close(cb);
        }
        else if (cb != null) {
            cb(new errors_1.S101SocketError('Not connected'));
        }
    }
    listen(timeout = 5) {
        const timeoutError = new errors_1.S101SocketError('listen timeout');
        return new Promise((resolve, reject) => {
            if (this._status !== 'disconnected') {
                return reject(new errors_1.S101SocketError('Already listening'));
            }
            let timedOut = false;
            const timer = setTimeout(() => {
                timedOut = true;
                this._status = 'disconnected';
                this.emit(S101ServerEvent.ERROR, timeoutError);
                reject(timeoutError);
            }, timeout * 1000);
            this._server = net.createServer((socket) => {
                this.addClient(socket);
            }).on(SocketServerEvent.ERROR, (e) => {
                this.emit(S101ServerEvent.ERROR, e);
                if (this.status === 'disconnected') {
                    clearTimeout(timer);
                    this._status = 'disconnected';
                    return reject(e);
                }
            }).on(SocketServerEvent.LISTENING, () => {
                if (timedOut) {
                    return;
                }
                clearTimeout(timer);
                this.emit(S101ServerEvent.LISTENING);
                this._status = 'listening';
                resolve();
            });
            this._server.listen(this.port, this.address);
        });
    }
}
exports.S101Server = S101Server;
//# sourceMappingURL=s101.server.js.map