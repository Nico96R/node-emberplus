import { S101Client, S101ClientEvent } from './s101.client';
import net = require('net');

let callback: () => void;
jest.mock('net', () => {
    const myNet = {
        createConnection:  () => {
            return myNet;
        },
        destroy: () => myNet,
        on: () => myNet,
        once: (event: string, cb: () => void ): any => {
            callback = cb;
            return myNet;
        }
    };
    return myNet;
});

describe('S101Client', () => {
    describe('connect', () => {
        it('should not do anything if not in state disconnected', () => {
            const client = new S101Client('127.0.0.1', 9000);
            const mockedClient: {[index: string]: any} = client as {[index: string]: any};
            mockedClient._status = 'connected';
            let count = 0;
            mockedClient.emit = () => {
                count++;
            };
            client.connect();
            expect(count).toBe(0);
        });

        it('should timeout if no answer', () => {
            const client = new S101Client('127.0.0.1', 9000);
            const mockedClient: {[index: string]: any} = client as {[index: string]: any};
            let count = 0;
            mockedClient.emit = (type: string) => {
                if (type === S101ClientEvent.ERROR) {
                    count++;
                }
            };
            client.connect();
            callback();
            expect(count).toBe(1);
            clearInterval(mockedClient.statsTimer);
        });
    });
});
