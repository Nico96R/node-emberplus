import { S101Server, SocketServerEvent } from './s101.server';
import net = require('net');
import { S101SocketError } from '../error/errors';

const interalError = new Error('internal error');
let sendError = true;
let callback: (e: Error) => void;
jest.mock('net', () => {
    const myNet = {
        createServer:  () => {
            return myNet;
        },
        listen: () => {
            if (sendError) {
                callback(interalError);
            }
        },
        destroy: () => myNet,
        on: (event: string, cb: () => void ): any => {
            if (event === SocketServerEvent.ERROR) {
                callback = cb;
            }
            return myNet;
        }
    };
    return myNet;
});

describe('S101Server', () => {
    describe('listen', () => {
        it('should catch error', () => {
            const server = new S101Server('127.0.0.1', 9000);
            const mockedServer: {[index: string]: any} = server as {[index: string]: any};
            let count = 0;
            mockedServer.emit = () => {
                count++;
            };
            let error: Error;
            return server.listen()
            .catch((e: Error) => { error = e; })
            .then(() => {
                expect(error).toBeDefined();
                expect(error).toBe(interalError);
                expect(count).toBe(1);
            });
        });
        it('should timeout', () => {
            const server = new S101Server('127.0.0.1', 9000);
            const mockedServer: {[index: string]: any} = server as {[index: string]: any};
            let count = 0;
            mockedServer.emit = () => {
                count++;
            };
            let error: Error;
            sendError = false;
            return server.listen(0.001)
            .catch((e: Error) => { error = e; })
            .then(() => {
                expect(error).toBeDefined();
                expect(error instanceof S101SocketError).toBeTruthy();
                expect(count).toBe(1);
            });
        });

        it('should reject if not in disconnected state', () => {
            const server = new S101Server('127.0.0.1', 9000);
            const mockedServer: {[index: string]: any} = server as {[index: string]: any};
            mockedServer._status = 'connected';
            let count = 0;
            mockedServer.emit = () => {
                count++;
            };
            let error: Error;
            sendError = false;
            return server.listen()
            .catch((e: Error) => { error = e; })
            .then(() => {
                expect(error).toBeDefined();
                expect(error instanceof S101SocketError).toBeTruthy();
                expect(count).toBe(0);
            });
        });
    });
});
