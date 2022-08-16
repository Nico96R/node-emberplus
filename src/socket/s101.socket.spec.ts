import { Socket } from 'net';
import { S101Socket, S101SocketEvent } from './s101.socket';
import { TreeNode } from '../common/tree-node';
import { InvalidEmberNodeError } from '../error/errors';
import { S101CodecEvent } from './s101.codec';

const wait = (timeout: number): Promise<void> => new Promise(resolve => {
    setTimeout(() => {
        resolve();
    }, timeout);
});

const makeStatePromise = (promise: Promise<void>): { [index: string]: any } => {
    // Don't modify any promise that has been already modified.
    if ((promise as { [index: string]: any }).isResolved != null) { return promise; }

    // Set initial state
    let isPending = true;
    let isRejected = false;
    let isFulfilled = false;

    // Observe the promise, saving the fulfillment in a closure scope.
    const result = promise.then(
        function (v: any): any {
            isFulfilled = true;
            isPending = false;
            return v;
        },
        function (e: any): void {
            isRejected = true;
            isPending = false;
            throw e;
        }
    );

    (result as { [index: string]: any }).isFulfilled = () => isFulfilled;
    (result as { [index: string]: any }).isPending = () => isPending;
    (result as { [index: string]: any }).isRejected = () => isRejected;
    return result;
};

let byteSent = 0;
function myWriter(str: string | Uint8Array, encoding?: string, cb?: (err?: Error) => void): boolean;
function myWriter(buffer: string | Uint8Array, cb?: (err?: Error) => void): boolean;
function myWriter(x: Uint8Array): boolean {
    byteSent += x.length;
    return true;
}
function myFailedWriter(str: string | Uint8Array, encoding?: string, cb?: (err?: Error) => void): boolean;
function myFailedWriter(buffer: string | Uint8Array, cb?: (err?: Error) => void): boolean;
function myFailedWriter(x: Uint8Array): boolean {
    throw new Error('Failed to send');
}

const tcpSocket = new Socket();
tcpSocket.write = myWriter;

const failedTCPSocket = new Socket();
failedTCPSocket.write = myFailedWriter;

describe('S101Socket', () => {
    describe('KeepAlive', () => {
        it('should not send anything if not connected', () => {
            const socket = new S101Socket();
            (<any>socket).sendKeepAliveRequest(); // Trick socket sendKeepAliveRequest is private
            (<any>socket).sendKeepAliveResponse(); // Trick socket sendKeepAliveResponse is private
            const stats = socket.getStats();
            expect(stats).toBeDefined();
            expect(stats.keepAliveRequests).toBeDefined();
            expect(stats.keepAliveRequests.txPackets).toBe(0);
            expect(stats.keepAliveResponses).toBeDefined();
            expect(stats.keepAliveResponses.txPackets).toBe(0);
        });

        it('should have startKeepAlive and send a KAL at configured frequency', () => {
            const socket = new S101Socket();
            const RUNTIME = 3;
            let count = 0;
            (<any>socket).sendKeepAliveRequest = () => {// Trick socket sendKeepAliveRequest is private
                count++;
            };

            // TODO: => use a setting options used in ctor injection
            // (<any>socket).keepAliveIntervalSec = 0.1; // Trick socket keepAliveIntervalSec is private
            // (<any>socket).startKeepAlive();  // Trick socket startKeepAlive is private
            (<any>socket).keepAliveIntervalSec = 0.1; // Trick socket keepAliveIntervalSec is private
            (<any>socket).startKeepAlive();  // Trick socket startKeepAlive is private
            return wait((RUNTIME * 100) + 30)
                .then(() => {
                    expect(count).toBe(RUNTIME);
                    (<any>socket).stopKeepAlive();
                });
        });

        it('should have startKeepAlive and catch error', () => {
            const socket = new S101Socket();
            let count = 0;
            (<any>socket).sendKeepAliveRequest = () => { // Trick socket sendKeepAliveRequest is private
                throw new Error('Failed to send');
            };
            socket.on('error', () => {
                count++;
            });
            // TODO: => use a setting options used in ctor injection
            (<any>socket).keepAliveIntervalSec = 0.1; // Trick socket keepAliveIntervalSec is private
            (<any>socket).startKeepAlive(); // Trick socket startKeepAlive is private
            return wait(130)
                .then(() => {
                    expect(count).toBe(1);
                    (<any>socket).stopKeepAlive(); // Trick socket stopKeepAlive is private
                });
        });

        it('should have startKeepAlive and count packet and bytes sent', () => {
            byteSent = 0;
            const socket = new S101Socket(tcpSocket);
            (socket as {[index: string]: any})._clearTimers();

            // TODO: => use a setting options used in ctor injection
            (<any>socket).keepAliveIntervalSec = 0.1; // Trick socket keepAliveIntervalSec is private

            (<any>socket).startKeepAlive(); // Trick socket startKeepAlive is private
            return wait(130)
                .then(() => {
                    (<any>socket).stopKeepAlive(); // Trick socket stopKeepAlive is private
                    const stats = socket.getStats();
                    expect(stats).toBeDefined();
                    expect(stats.keepAliveRequests).toBeDefined();
                    expect(stats.keepAliveRequests.txPackets).toBe(1);
                    expect(byteSent).not.toBe(0);
                    expect(stats.keepAliveRequests.txBytes).toBe(byteSent);
                });
        });

        it('should have sendKeepAliveRequest and count errors', () => {
            const socket = new S101Socket(failedTCPSocket);
            (socket as {[index: string]: any})._clearTimers();
            (<any>socket).sendKeepAliveRequest(); // Trick socket sendKeepAliveRequest is private
            const stats = socket.getStats();
            expect(stats).toBeDefined();
            expect(stats.keepAliveRequests).toBeDefined();
            expect(stats.keepAliveRequests.txFailures).toBe(1);
        });

        it('should have sendKeepAliveResponse and count packet and bytes sent', () => {
            byteSent = 0;
            const socket = new S101Socket(tcpSocket);
            (<any>socket).sendKeepAliveResponse(); // Trick socket sendKeepAliveResponse is private
            const stats = socket.getStats();
            expect(stats).toBeDefined();
            expect(stats.keepAliveResponses).toBeDefined();
            expect(stats.keepAliveResponses.txPackets).toBe(1);
            expect(byteSent).not.toBe(0);
            expect(stats.keepAliveResponses.txBytes).toBe(byteSent);
            (socket as {[index: string]: any})._clearTimers();
        });

        it('should have sendKeepAliveResponse and count errors', () => {
            const socket = new S101Socket(failedTCPSocket);
            (<any>socket).sendKeepAliveResponse(); // Trick socket sendKeepAliveResponse is private
            const stats = socket.getStats();
            expect(stats).toBeDefined();
            expect(stats.keepAliveResponses).toBeDefined();
            expect(stats.keepAliveResponses.txFailures).toBe(1);
            (socket as {[index: string]: any})._clearTimers();
        });
    });

    describe('Send functions', () => {
        it('should throw an error if trying to send a null node', () => {
            let error: Error = null;
            const socket = new S101Socket();
            try {
                socket.sendBERNode(null);
            } catch (e) {
                error = e;
            }
            expect(error instanceof InvalidEmberNodeError);
        });

        it('should catch error', () => {
            const socket = new S101Socket(failedTCPSocket);
            const mockedSocket: {[index: string]: any} = socket;
            mockedSocket._clearTimers();
            mockedSocket.sendBER(Buffer.alloc(2));
            mockedSocket.collectStat();
            const stats = mockedSocket.getStats();
            expect(stats).toBeDefined();
            expect(stats.s101Messages).toBeDefined();
            expect(stats.s101Messages.txFailures).toBe(1);
        });

        it('should count packet and bytes sent', () => {
            byteSent = 0;
            const socket = new S101Socket(tcpSocket);
            const mockedSocket: {[index: string]: any} = socket;
            mockedSocket._clearTimers();
            mockedSocket.sendBER(Buffer.alloc(byteSent));
            mockedSocket.collectStat();
            const stats = socket.getStats();
            expect(stats).toBeDefined();
            expect(stats.s101Messages).toBeDefined();
            expect(stats.s101Messages.txPackets).toBe(1);
            expect(stats.s101Messages.txBytes).toBe(byteSent);
        });

        it('should have message queueing', () => {
            const socket = new S101Socket(tcpSocket);
            const mockedSocket: {[index: string]: any} = socket;
            mockedSocket._clearTimers();
            byteSent = 0;
            socket.queueMessage(new TreeNode());
            mockedSocket.collectStat();
            const stats = socket.getStats();
            expect(stats).toBeDefined();
            expect(stats.s101Messages).toBeDefined();
            expect(stats.s101Messages.txPackets).toBe(1);
            expect(byteSent).not.toBe(0);
            expect(stats.s101Messages.txBytes).toBe(byteSent);
        });
    });

    describe('Stats', () => {
        it('should have function to collectStat', () => {
            byteSent = 0;
            const socket = new S101Socket(tcpSocket);
            (socket as {[index: string]: any})._clearTimers();
            socket.isConnected = (): boolean => (true);
            byteSent = 0;
            socket.sendBERNode(new TreeNode());
            (socket as {[index: string]: any}).collectStat();
            const stats = socket.rateStats.getStats();
            expect(stats).toBeDefined();
            expect(stats.txPackets).toBe(1);
            expect(byteSent).not.toBe(0);
            expect(stats.txBytes).toBe(byteSent);
        });
    });

    describe('Events', () => {
        it('should catch tcp socket errors and re-emit as error', () => {
            let count = 0;
            const tsoc = new Socket();
            const socket = new S101Socket(tsoc);
            (socket as {[index: string]: any})._clearTimers();
            socket.emit = (event: string | symbol, ...args: any[]): boolean => {
                if (event === 'error') {
                    count++;
                }
                return true;
            };
            tsoc.emit(S101SocketEvent.ERROR, new Error('error'));
            expect(count).toBe(1);
        });

        it('should catch invalid ember packet and emit two errors', () => {
            let count = 0;
            const socket = new S101Socket();
            (socket as {[index: string]: any})._clearTimers();
            socket.emit = (event: string | symbol, ...args: any[]): boolean => {
                if (event === 'error') {
                    count++;
                }
                return true;
            };
            socket.codec.emit(S101CodecEvent.EMBER_PACKET, Buffer.alloc(2));
            expect(count).toBe(2);
        });

        it('should catch valid ember packet and emit emberTree', () => {
            let count = 0;
            const socket = new S101Socket();
            (socket as {[index: string]: any})._clearTimers();
            socket.emit = (event: string | symbol, ...args: any[]): boolean => {
                if (event === 'error') {
                    count++;
                }
                return true;
            };
            socket.codec.emit(S101CodecEvent.EMBER_PACKET, Buffer.alloc(2));
            expect(count).toBe(2);
        });

        it('should catch keepAlive request, send a response and count bytes and packet received', () => {
            const KAL_LEN = 10;
            const socket = new S101Socket(tcpSocket);
            (socket as {[index: string]: any})._clearTimers();
            socket.codec.emit(S101CodecEvent.KEEP_ALIVE_REQUEST, Buffer.alloc(KAL_LEN));
            const stats = socket.getStats();
            expect(stats).toBeDefined();
            expect(stats.keepAliveResponses).toBeDefined();
            expect(stats.keepAliveResponses.txPackets).toBe(1);
            expect(stats.keepAliveRequests).toBeDefined();
            expect(stats.keepAliveRequests.rxPackets).toBe(1);
            expect(stats.keepAliveRequests).toBeDefined();
            expect(stats.keepAliveRequests.rxBytes).toBe(KAL_LEN);
            (socket as {[index: string]: any})._clearTimers();
        });

        it('should catch \' response and count bytes and packet received', () => {
            const KAL_LEN = 10;
            const socket = new S101Socket();
            socket.codec.emit(S101CodecEvent.KEEP_ALIVE_RESPONSE, Buffer.alloc(KAL_LEN));
            const stats = socket.getStats();
            expect(stats).toBeDefined();
            expect(stats.keepAliveResponses).toBeDefined();
            expect(stats.keepAliveResponses.rxPackets).toBe(1);
            expect(stats.keepAliveResponses.rxBytes).toBe(KAL_LEN);
        });
    });

    describe('Disconnect', () => {
        it('should wait for tcp socket end callback', () => {
            const localTcpSocket = new Socket();
            let disconnectCallback: () => void = null;
            function myEnd(cb?: () => void): void;
            function myEnd(buffer: string | Uint8Array, cb?: () => void): void;
            function myEnd(str: string | Uint8Array, encoding?: string, cb?: () => void): void;
            function myEnd(cb: (() => void) | string | Uint8Array, y?: string | (() => void), x?: () => void): void {
                disconnectCallback = cb as () => void;
                // if (cb != null) {
                //     (cb as () => void)();
                // }
            }

            localTcpSocket.end = myEnd;
            const socket = new S101Socket(localTcpSocket);
            socket.isConnected = (): boolean => (true);
            (socket as {[index: string]: any})._clearTimers();
            const endPromise = makeStatePromise(socket.disconnectAsync(1000));
            expect(endPromise.isFulfilled()).toBeFalsy();
            disconnectCallback();
            // calling it multiple time should have no impact
            disconnectCallback();
            disconnectCallback();
            return endPromise.then(() => {
                expect(endPromise.isFulfilled()).toBeTruthy();
            });
        });

        it('should wait for tcp socket end callback with limited time', () => {
            const localTcpSocket = new Socket();
            let disconnectCallback: () => void = null;
            function myEnd(cb?: () => void): void;
            function myEnd(buffer: string | Uint8Array, cb?: () => void): void;
            function myEnd(str: string | Uint8Array, encoding?: string, cb?: () => void): void;
            function myEnd(cb: (() => void) | string | Uint8Array, y?: string | (() => void), x?: () => void): void {
                disconnectCallback = cb as () => void;
                // if (cb != null) {
                //     (cb as () => void)();
                // }
            }

            localTcpSocket.end = myEnd;
            const socket = new S101Socket(localTcpSocket);
            socket.isConnected = (): boolean => (true);
            (socket as {[index: string]: any})._clearTimers();
            const endPromise = makeStatePromise(socket.disconnectAsync(0.1));
            expect(endPromise.isFulfilled()).toBeFalsy();
            return endPromise.then(() => {
                expect(endPromise.isFulfilled()).toBeTruthy();
            });
        });
    });
});
