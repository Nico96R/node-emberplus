import { EventEmitter } from 'events';
import { ExtendedReader, ExtendedWriter } from '../ber';
import { S101Codec, S101CodecEvent } from './s101.codec';
import { Socket } from 'net';
import { TreeNode } from '../common/tree-node';
import { rootDecode } from '../common/common';
import { SmartBuffer } from 'smart-buffer';
import { PacketStats, PacketStatsInterface } from './s101.packet-stats.socket';
import { StatsCollector, RateStats } from './stats-collector';
import { InvalidEmberNodeError, S101SocketError } from '../error/errors';

export type S101SocketStatus = 'connected' | 'disconnected';
const MAX_keepAlive_MISS = 3;

export enum S101SocketEvent {
    EMBER_TREE = 'emberTree',
    EMBER_PACKET = 'emberPacket',
    ERROR = 'error',
    DISCONNECTED = 'disconnected',
    KEEP_ALIVE_RESPONSE = 'keepAlive-response',
    KEEP_ALIVE_REQUEST = 'keepAlive-request',
    DEAD = 'dead'
}

export enum SocketEvent {
    TIMEOUT = 'timeout',
    ERROR = 'error',
    DATA = 'data',
    CLOSE = 'close',
    END = 'end'
}

export interface SocketStatsInterface {
    keepAliveRequests: PacketStatsInterface;
    keepAliveResponses: PacketStatsInterface;
    s101Messages: RateStats;
}

type RequestType = () => void;

export class S101Socket extends EventEmitter {

    get socket(): Socket {
        return this._socket;
    }

    set socket(value: Socket) {
        this._socket = value;
    }

    get status(): string {
        const status = this._status;
        return status;
    }

    get remoteAddress(): string {
        return this._remoteAddress;
    }
    static readonly DEFAULT_KEEP_ALIVE_INTERVAL = 10;

    public keepAliveIntervalSec: number;
    public deadTimeout: number;
    public codec: S101Codec;
    public rateStats: StatsCollector;
    protected _remoteAddress: string;
    protected _status: S101SocketStatus;
    protected deadTimer: NodeJS.Timeout;
    private keepAliveIntervalTimer: NodeJS.Timeout;
    private pendingRequests: RequestType[];
    private activeRequest: RequestType;
    private keepAliveRequestStats: PacketStats;
    private keepAliveResponseStats: PacketStats;
    private s101MessageStats: PacketStats;
    private statsTimer: NodeJS.Timeout;

    constructor(private _socket?: Socket) {
        super();
        this.handleKeepAliveResponse = this.handleKeepAliveResponse.bind(this);
        this.handleKeepAliveRequest = this.handleKeepAliveRequest.bind(this);
        this.handleEmberPacket = this.handleEmberPacket.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDeadTimeout = this.handleDeadTimeout.bind(this);
        this.disconnectAsync = this.disconnectAsync.bind(this);
        this.collectStat = this.collectStat.bind(this);

        this.keepAliveIntervalSec = S101Socket.DEFAULT_KEEP_ALIVE_INTERVAL;

        this.keepAliveResponseStats = new PacketStats();
        this.keepAliveRequestStats = new PacketStats();
        this.s101MessageStats = new PacketStats();
        this.rateStats = new StatsCollector();
        this.deadTimeout = this.keepAliveIntervalSec * MAX_keepAlive_MISS;

        this.keepAliveIntervalTimer = null;
        this.deadTimer = null;
        this.pendingRequests = [];
        this.activeRequest = null;
        this._status = this.isConnected() ? 'connected' : 'disconnected';

        this.codec = new S101Codec();
        this.codec.on(S101CodecEvent.KEEP_ALIVE_REQUEST, this.handleKeepAliveRequest);
        this.codec.on(S101CodecEvent.KEEP_ALIVE_RESPONSE, this.handleKeepAliveResponse);
        this.codec.on(S101CodecEvent.EMBER_PACKET, this.handleEmberPacket);

        this.initSocket();
    }

    isConnected(): boolean {
        return (this._socket != null);
    }

    queueMessage(node: TreeNode): void {
        this.addRequest(() => this.sendBERNode(node));
    }

    disconnectAsync(timeout: number = 2): Promise<void> {
        this._clearTimers();
        if (!this.isConnected()) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            if (this.keepAliveIntervalTimer != null) {
                clearInterval(this.keepAliveIntervalTimer);
                this.keepAliveIntervalTimer = null;
            }
            let done  = false;
            const cb = () => {
                if (done) { return; }
                done = true;
                if (timer != null) {
                    clearTimeout(timer);
                    timer = null;
                }
                this.socket = null;
                return resolve();
            };
            let timer: NodeJS.Timeout;
            if (timeout != null && (!isNaN(timeout)) && timeout > 0) {
                timer = setTimeout(cb, 100 * timeout);
            }
            this.socket.end(cb);
            this._status = 'disconnected';
        });
    }

    sendBERNode(node: TreeNode): void {
        if (node == null) {
            throw new InvalidEmberNodeError('', 'null node');
        }
        const writer = new ExtendedWriter();
        try {
            node.encode(writer);
        } catch (error) {
            error.message += `. Encoding failure path ${node?.getPath()} ${JSON.stringify(node.toJSON())}`;
            throw error;
        }
        this.sendBER(writer.buffer);
    }

    getStats(): SocketStatsInterface {
        return {
            keepAliveRequests: this.keepAliveRequestStats.toJSON(),
            keepAliveResponses: this.keepAliveResponseStats.toJSON(),
            s101Messages: this.rateStats.getStats()
        };
    }

    startDeadTimer(): void {
        if (this.deadTimer == null) {
            const deadTimeout = 1000 * this.deadTimeout;
            this.deadTimer = setTimeout(this.handleDeadTimeout, deadTimeout);
        }
    }

    startKeepAlive(): void {
        this.keepAliveIntervalTimer = setInterval(() => {
            try {
                this.sendKeepAliveRequest();
            } catch (e) {
                this.emit(S101SocketEvent.ERROR, e);
            }
        }, 1000 * this.keepAliveIntervalSec);
    }

    setKeepAliveInterval(value: number): void {
        this.keepAliveIntervalSec = value;
        this.deadTimeout = MAX_keepAlive_MISS * value;
    }

    stopKeepAlive(): void {
        clearInterval(this.keepAliveIntervalTimer);
    }

    // @TODO: is public jst for unit tests
    protected _clearTimers(): void {
        clearInterval(this.keepAliveIntervalTimer);
        clearTimeout(this.deadTimer);
        this.deadTimer = null;
        clearTimeout(this.deadTimer);
        clearInterval(this.statsTimer);
    }

    protected initSocket(): void {
        if (this._socket != null) {
            // We have a socket, so we can collect stats.
            this._remoteAddress = `${this._socket?.remoteAddress}:${this._socket?.remotePort}`;
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
        } else {
            this._remoteAddress = 'not connected';
        }
    }

    protected handleClose(): void {
        this._socket = null;
        this._clearTimers();
        if (this._status !== 'disconnected') {
            this._status = 'disconnected';
            this.emit(S101SocketEvent.DISCONNECTED);
        }
    }

    private handleKeepAliveResponse(frame: SmartBuffer): void {
        this.clearDeadTimer();
        this.keepAliveResponseStats.rxPackets++;
        this.keepAliveResponseStats.rxBytes = frame.length;
        this.emit(S101SocketEvent.KEEP_ALIVE_RESPONSE);
    }

    private handleKeepAliveRequest(frame: SmartBuffer): void {
        this.clearDeadTimer();
        this.sendKeepAliveResponse();
        this.keepAliveRequestStats.rxPackets++;
        this.keepAliveRequestStats.rxBytes = frame.length;
        this.emit(S101SocketEvent.KEEP_ALIVE_REQUEST);
    }

    private handleEmberPacket(packet: Buffer): void {
        this.clearDeadTimer();
        this.emit(S101SocketEvent.EMBER_PACKET, packet);
        const ber = new ExtendedReader(packet);
        try {
            const root = rootDecode(ber);
            this.emit(S101SocketEvent.EMBER_TREE, root);
        } catch (e) {
            this.emit(S101SocketEvent.ERROR, e);
            this.emit(S101SocketEvent.ERROR, new Error(`Failed to decode ${packet.toString('hex')}`));
        }
    }

    private collectStat(): void {
        this.rateStats.add(this.s101MessageStats.getNewPacketStats());
    }

    private addRequest(cb: RequestType): void {
        this.pendingRequests.push(cb);
        this.makeRequest();
    }

    private clearDeadTimer(): void {
        if (this.deadTimer != null) {
            clearTimeout(this.deadTimer);
            this.deadTimer = null;
            // restart the timer
            this.startDeadTimer();
        }
    }

    private handleDeadTimeout(): void {
        this.emit(S101SocketEvent.DEAD);
        this.disconnectAsync().then(() => this.handleClose());
    }

    private makeRequest(): void {
        if (this.activeRequest == null && this.pendingRequests.length > 0) {
            this.activeRequest = this.pendingRequests.shift();
            this.activeRequest();
            this.activeRequest = null;
        }
    }

    private sendBER(data: Buffer): void {
        if (!this.isConnected()) {
            throw new S101SocketError('Not connected');
        }
        try {
            const frames = this.codec.encodeBER(data);
            for (let i = 0; i < frames.length; i++) {
                this._socket.write(frames[i]);
                this.s101MessageStats.txPackets++;
                this.s101MessageStats.txBytes += frames[i].length;
            }
        } catch (e) {
            this.s101MessageStats.txFailures++;
            this.handleClose();
        }
    }

    private sendKeepAliveRequest(): void {
        if (this.isConnected()) {
            try {
                const kalBuffer = this.codec.keepAliveRequest();
                this.socket.write(kalBuffer);
                this.keepAliveRequestStats.txPackets++;
                this.keepAliveRequestStats.txBytes += kalBuffer.length;
                this.startDeadTimer();
            } catch (e) {
                this.keepAliveRequestStats.txFailures++;
                this.handleClose();
            }
        }
    }

    private sendKeepAliveResponse(): void {
        if (this.isConnected()) {
            try {
                const kalBuffer = this.codec.keepAliveResponse();
                this.socket.write(kalBuffer);
                this.keepAliveResponseStats.txPackets++;
                this.keepAliveResponseStats.txBytes += kalBuffer.length;
                this.startDeadTimer();
            } catch (e) {
                this.keepAliveResponseStats.txFailures++; this.handleClose();
            }
        }
    }
}
