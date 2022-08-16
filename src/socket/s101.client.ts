import { S101Socket, SocketEvent } from './s101.socket';
import net = require('net');
import { NetConnectOpts } from 'net';

export enum S101ClientEvent {
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    ERROR = 'error',
    EMBER_TREE = 'emberTree'
}

export class S101Client extends S101Socket {

    static readonly DEFAULT_CONNECT_TIMEOUT = 2;

    constructor(private _address: string, private _port: number) {
        super();
    }

    get address(): string {
        return this._address;
    }

    get port(): number {
        return this._port;
    }

    connect(timeoutMsec = S101Client.DEFAULT_CONNECT_TIMEOUT): void {
        if (this.status !== 'disconnected') {
            return;
        }
        this.emit(S101ClientEvent.CONNECTING);
        const connectTimeoutListener = () => {
            this.socket?.destroy();
            this.socket = undefined;
            this.emit(
                S101ClientEvent.ERROR,
                new Error(`Could not connect to ${this.address}:${this.port} after a timeout of ${timeoutMsec} milliseconds`));
        };

        const opts: NetConnectOpts = {
            port: this.port,
            host: this.address,
            timeout: 1000 * timeoutMsec
        };
        this.socket = net.createConnection(opts,
            () => {
                // Disable connect timeout to hand-over to keepAlive mechanism
                this.socket.removeListener(SocketEvent.TIMEOUT, connectTimeoutListener);
                this.socket.setTimeout(0);
                this.startKeepAlive();
                this.emit(S101ClientEvent.CONNECTED);
            })
            .once(SocketEvent.TIMEOUT, connectTimeoutListener);
        this.initSocket();
    }
}
