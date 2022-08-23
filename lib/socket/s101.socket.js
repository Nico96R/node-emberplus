"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const ber_1 = require("../ber");
const s101_codec_1 = require("./s101.codec");
const common_1 = require("../common/common");
const s101_packet_stats_socket_1 = require("./s101.packet-stats.socket");
const stats_collector_1 = require("./stats-collector");
const errors_1 = require("../error/errors");
const MAX_keepAlive_MISS = 3;
var S101SocketEvent;
(function (S101SocketEvent) {
    S101SocketEvent["EMBER_TREE"] = "emberTree";
    S101SocketEvent["EMBER_PACKET"] = "emberPacket";
    S101SocketEvent["ERROR"] = "error";
    S101SocketEvent["DISCONNECTED"] = "disconnected";
    S101SocketEvent["KEEP_ALIVE_RESPONSE"] = "keepAlive-response";
    S101SocketEvent["KEEP_ALIVE_REQUEST"] = "keepAlive-request";
    S101SocketEvent["DEAD"] = "dead";
})(S101SocketEvent = exports.S101SocketEvent || (exports.S101SocketEvent = {}));
var SocketEvent;
(function (SocketEvent) {
    SocketEvent["TIMEOUT"] = "timeout";
    SocketEvent["ERROR"] = "error";
    SocketEvent["DATA"] = "data";
    SocketEvent["CLOSE"] = "close";
    SocketEvent["END"] = "end";
})(SocketEvent = exports.SocketEvent || (exports.SocketEvent = {}));
class S101Socket extends events_1.EventEmitter {
    constructor(_socket) {
        super();
        this._socket = _socket;
        this.handleKeepAliveResponse = this.handleKeepAliveResponse.bind(this);
        this.handleKeepAliveRequest = this.handleKeepAliveRequest.bind(this);
        this.handleEmberPacket = this.handleEmberPacket.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDeadTimeout = this.handleDeadTimeout.bind(this);
        this.disconnectAsync = this.disconnectAsync.bind(this);
        this.collectStat = this.collectStat.bind(this);
        this.keepAliveIntervalSec = S101Socket.DEFAULT_KEEP_ALIVE_INTERVAL;
        this.keepAliveResponseStats = new s101_packet_stats_socket_1.PacketStats();
        this.keepAliveRequestStats = new s101_packet_stats_socket_1.PacketStats();
        this.s101MessageStats = new s101_packet_stats_socket_1.PacketStats();
        this.rateStats = new stats_collector_1.StatsCollector();
        this.deadTimeout = this.keepAliveIntervalSec * MAX_keepAlive_MISS;
        this.keepAliveIntervalTimer = null;
        this.deadTimer = null;
        this.pendingRequests = [];
        this.activeRequest = null;
        this._status = this.isConnected() ? 'connected' : 'disconnected';
        this.codec = new s101_codec_1.S101Codec();
        this.codec.on(s101_codec_1.S101CodecEvent.KEEP_ALIVE_REQUEST, this.handleKeepAliveRequest);
        this.codec.on(s101_codec_1.S101CodecEvent.KEEP_ALIVE_RESPONSE, this.handleKeepAliveResponse);
        this.codec.on(s101_codec_1.S101CodecEvent.EMBER_PACKET, this.handleEmberPacket);
        this.initSocket();
    }
    get socket() {
        return this._socket;
    }
    set socket(value) {
        this._socket = value;
    }
    get status() {
        const status = this._status;
        return status;
    }
    get remoteAddress() {
        return this._remoteAddress;
    }
    isConnected() {
        return (this._socket != null);
    }
    queueMessage(node) {
        this.addRequest(() => this.sendBERNode(node));
    }
    disconnectAsync(timeout = 2) {
        this._clearTimers();
        if (!this.isConnected()) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            if (this.keepAliveIntervalTimer != null) {
                clearInterval(this.keepAliveIntervalTimer);
                this.keepAliveIntervalTimer = null;
            }
            let done = false;
            const cb = () => {
                if (done) {
                    return;
                }
                done = true;
                if (timer != null) {
                    clearTimeout(timer);
                    timer = null;
                }
                this.socket = null;
                return resolve();
            };
            let timer;
            if (timeout != null && (!isNaN(timeout)) && timeout > 0) {
                timer = setTimeout(cb, 100 * timeout);
            }
            this.socket.end(cb);
            this._status = 'disconnected';
        });
    }
    sendBERNode(node) {
        var _a;
        if (node == null) {
            throw new errors_1.InvalidEmberNodeError('', 'null node');
        }
        const writer = new ber_1.ExtendedWriter();
        try {
            node.encode(writer);
        }
        catch (error) {
            error.message += `. Encoding failure path ${(_a = node) === null || _a === void 0 ? void 0 : _a.getPath()} ${JSON.stringify(node.toJSON())}`;
            throw error;
        }
        this.sendBER(writer.buffer);
    }
    getStats() {
        return {
            keepAliveRequests: this.keepAliveRequestStats.toJSON(),
            keepAliveResponses: this.keepAliveResponseStats.toJSON(),
            s101Messages: this.rateStats.getStats()
        };
    }
    startDeadTimer() {
        if (this.deadTimer == null) {
            const deadTimeout = 1000 * this.deadTimeout;
            this.deadTimer = setTimeout(this.handleDeadTimeout, deadTimeout);
        }
    }
    startKeepAlive() {
        this.keepAliveIntervalTimer = setInterval(() => {
            try {
                this.sendKeepAliveRequest();
            }
            catch (e) {
                this.emit(S101SocketEvent.ERROR, e);
            }
        }, 1000 * this.keepAliveIntervalSec);
    }
    setKeepAliveInterval(value) {
        this.keepAliveIntervalSec = value;
        this.deadTimeout = MAX_keepAlive_MISS * value;
    }
    stopKeepAlive() {
        clearInterval(this.keepAliveIntervalTimer);
    }
    _clearTimers() {
        clearInterval(this.keepAliveIntervalTimer);
        clearTimeout(this.deadTimer);
        this.deadTimer = null;
        clearTimeout(this.deadTimer);
        clearInterval(this.statsTimer);
    }
    initSocket() {
        var _a, _b;
        if (this._socket != null) {
            this._remoteAddress = `${(_a = this._socket) === null || _a === void 0 ? void 0 : _a.remoteAddress}:${(_b = this._socket) === null || _b === void 0 ? void 0 : _b.remotePort}`;
            this.statsTimer = setInterval(this.collectStat, 1000);
            this.socket.on(SocketEvent.DATA, data => {
                this.s101MessageStats.rxPackets++;
                this.s101MessageStats.rxBytes += data.length;
                this.codec.dataIn(data);
            })
                .on('close', () => {
                if (this._status !== 'disconnected') {
                    this._status = 'disconnected';
                    this.emit(S101SocketEvent.DISCONNECTED);
                }
                this.socket = null;
            })
                .on('end', this.handleClose)
                .on('error', (e) => {
                this.emit(S101SocketEvent.ERROR, e);
            });
        }
        else {
            this._remoteAddress = 'not connected';
        }
    }
    handleClose() {
        this._socket = null;
        this._clearTimers();
        if (this._status !== 'disconnected') {
            this._status = 'disconnected';
            this.emit(S101SocketEvent.DISCONNECTED);
        }
    }
    handleKeepAliveResponse(frame) {
        this.clearDeadTimer();
        this.keepAliveResponseStats.rxPackets++;
        this.keepAliveResponseStats.rxBytes = frame.length;
        this.emit(S101SocketEvent.KEEP_ALIVE_RESPONSE);
    }
    handleKeepAliveRequest(frame) {
        this.clearDeadTimer();
        this.sendKeepAliveResponse();
        this.keepAliveRequestStats.rxPackets++;
        this.keepAliveRequestStats.rxBytes = frame.length;
        this.emit(S101SocketEvent.KEEP_ALIVE_REQUEST);
    }
    handleEmberPacket(packet) {
        this.clearDeadTimer();
        this.emit(S101SocketEvent.EMBER_PACKET, packet);
        const ber = new ber_1.ExtendedReader(packet);
        try {
            const root = common_1.rootDecode(ber);
            this.emit(S101SocketEvent.EMBER_TREE, root);
        }
        catch (e) {
            this.emit(S101SocketEvent.ERROR, e);
            this.emit(S101SocketEvent.ERROR, new Error(`Failed to decode ${packet.toString('hex')}`));
        }
    }
    collectStat() {
        this.rateStats.add(this.s101MessageStats.getNewPacketStats());
    }
    addRequest(cb) {
        this.pendingRequests.push(cb);
        this.makeRequest();
    }
    clearDeadTimer() {
        if (this.deadTimer != null) {
            clearTimeout(this.deadTimer);
            this.deadTimer = null;
            this.startDeadTimer();
        }
    }
    handleDeadTimeout() {
        this.emit(S101SocketEvent.DEAD);
        this.disconnectAsync().then(() => this.handleClose());
    }
    makeRequest() {
        if (this.activeRequest == null && this.pendingRequests.length > 0) {
            this.activeRequest = this.pendingRequests.shift();
            this.activeRequest();
            this.activeRequest = null;
        }
    }
    sendBER(data) {
        if (!this.isConnected()) {
            throw new errors_1.S101SocketError('Not connected');
        }
        try {
            const frames = this.codec.encodeBER(data);
            for (let i = 0; i < frames.length; i++) {
                this._socket.write(frames[i]);
                this.s101MessageStats.txPackets++;
                this.s101MessageStats.txBytes += frames[i].length;
            }
        }
        catch (e) {
            this.s101MessageStats.txFailures++;
            this.handleClose();
        }
    }
    sendKeepAliveRequest() {
        if (this.isConnected()) {
            try {
                const kalBuffer = this.codec.keepAliveRequest();
                this.socket.write(kalBuffer);
                this.keepAliveRequestStats.txPackets++;
                this.keepAliveRequestStats.txBytes += kalBuffer.length;
                this.startDeadTimer();
            }
            catch (e) {
                this.keepAliveRequestStats.txFailures++;
                this.handleClose();
            }
        }
    }
    sendKeepAliveResponse() {
        if (this.isConnected()) {
            try {
                const kalBuffer = this.codec.keepAliveResponse();
                this.socket.write(kalBuffer);
                this.keepAliveResponseStats.txPackets++;
                this.keepAliveResponseStats.txBytes += kalBuffer.length;
                this.startDeadTimer();
            }
            catch (e) {
                this.keepAliveResponseStats.txFailures++;
                this.handleClose();
            }
        }
    }
}
exports.S101Socket = S101Socket;
S101Socket.DEFAULT_KEEP_ALIVE_INTERVAL = 10;
//# sourceMappingURL=s101.socket.js.map