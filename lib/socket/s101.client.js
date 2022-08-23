"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const s101_socket_1 = require("./s101.socket");
const net = require("net");
var S101ClientEvent;
(function (S101ClientEvent) {
    S101ClientEvent["CONNECTING"] = "connecting";
    S101ClientEvent["CONNECTED"] = "connected";
    S101ClientEvent["DISCONNECTED"] = "disconnected";
    S101ClientEvent["ERROR"] = "error";
    S101ClientEvent["EMBER_TREE"] = "emberTree";
})(S101ClientEvent = exports.S101ClientEvent || (exports.S101ClientEvent = {}));
class S101Client extends s101_socket_1.S101Socket {
    constructor(_address, _port) {
        super();
        this._address = _address;
        this._port = _port;
    }
    get address() {
        return this._address;
    }
    get port() {
        return this._port;
    }
    connect(timeoutMsec = S101Client.DEFAULT_CONNECT_TIMEOUT) {
        if (this.status !== 'disconnected') {
            return;
        }
        this.emit(S101ClientEvent.CONNECTING);
        const connectTimeoutListener = () => {
            var _a;
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.destroy();
            this.socket = undefined;
            this.emit(S101ClientEvent.ERROR, new Error(`Could not connect to ${this.address}:${this.port} after a timeout of ${timeoutMsec} milliseconds`));
        };
        const opts = {
            port: this.port,
            host: this.address,
            timeout: 1000 * timeoutMsec
        };
        this.socket = net.createConnection(opts, () => {
            this.socket.removeListener(s101_socket_1.SocketEvent.TIMEOUT, connectTimeoutListener);
            this.socket.setTimeout(0);
            this.startKeepAlive();
            this.emit(S101ClientEvent.CONNECTED);
        })
            .once(s101_socket_1.SocketEvent.TIMEOUT, connectTimeoutListener);
        this.initSocket();
    }
}
exports.S101Client = S101Client;
S101Client.DEFAULT_CONNECT_TIMEOUT = 2;
//# sourceMappingURL=s101.client.js.map