import { EventEmitter } from 'events';
import { S101Socket } from './s101.socket';
import net = require('net');
import { S101SocketError } from '../error/errors';

export type S101ServerStatus = 'disconnected' | 'listening';

export enum S101ServerEvent {
    CONNECTION = 'connection',
    LISTENING = 'listening',
    ERROR = 'error',
    DISCONNECTED = 'disconnected'
}

export enum SocketServerEvent {
    LISTENING = 'listening',
    ERROR = 'error'
}

export class S101Server extends EventEmitter {
    private _server: net.Server;
    private _status: S101ServerStatus;

    constructor(private _address: string, private _port: number) {
        super();
        this._server = null;
        this._status = 'disconnected';
    }

    get address(): string {
        return this._address;
    }

    private get server(): net.Server {
        return this._server;
    }

    get port(): number {
        return this._port;
    }

    get status(): S101ServerStatus {
        return this._status;
    }

    addClient(socket: net.Socket): void {
        // Wrap the tcp socket into an S101Socket.
        const client = new S101Socket(socket);
        this.emit(S101ServerEvent.CONNECTION, client);
    }

    close(cb: (err?: Error) => void): void {
        if (this.server != null) {
            this.server.close(cb);
        } else if (cb != null) {
            cb(new S101SocketError('Not connected'));
        }
    }

    listen(timeout: number = 5): Promise<void> {
        const timeoutError = new S101SocketError('listen timeout');
        return new Promise((resolve, reject) => {
            if (this._status !== 'disconnected') {
                return reject(new S101SocketError('Already listening'));
            }
            let timedOut = false;
            const timer: NodeJS.Timeout = setTimeout(() => {
                timedOut = true;
                this._status = 'disconnected';
                this.emit(S101ServerEvent.ERROR, timeoutError);
                reject(timeoutError);
            }, timeout * 1000);
            this._server = net.createServer((socket) => {
                this.addClient(socket);
            }).on(SocketServerEvent.ERROR, (e: Error) => {
                this.emit(S101ServerEvent.ERROR, e);
                if (this.status === 'disconnected') {
                    clearTimeout(timer);
                    this._status = 'disconnected';
                    return reject(e);
                }
            }).on(SocketServerEvent.LISTENING, () => {
                if (timedOut) { return; }
                clearTimeout(timer);
                this.emit(S101ServerEvent.LISTENING);
                this._status = 'listening';
                resolve();
            });
            this._server.listen(this.port, this.address);
        });
    }
}
