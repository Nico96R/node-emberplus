
import { init as jsonRoot} from '../fixture/utils';
import { EmberClient, EmberClientOptions } from './ember-client';
import { EmberServer, EmberServerOptions } from '../server/ember-server';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { TreeNode } from '../common/tree-node';
import { QualifiedParameter } from '../common/qualified-parameter';
import { S101Client } from '../socket/s101.client';
import { EmberTimeoutError, InvalidEmberNodeError } from '../error/errors';

const HOST = '127.0.0.1';
const PORT = 9012;
const options = new EmberClientOptions(HOST, PORT);

let socket: S101Client;
jest.mock('../socket/s101.client', () => {
    const OriginalS101Client = jest.requireActual('../socket/s101.client');
    return {
        S101Client: jest.fn().mockImplementation((h, p) => {
            // we need access to private socket.
            socket = new OriginalS101Client.S101Client(h, p);
            return socket;
        }),
        S101ClientEvent: OriginalS101Client.S101ClientEvent
    };
});

describe('setValue', () => {
    let server: EmberServer;
    let jsonTree: {[index: string]: any}[];
    beforeEach(() => {
        jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions = new EmberServerOptions(
            HOST, PORT, root
        );
        server = new EmberServer(serverOptions);
        // server._debug = true;
        server.on('error', e => {
            console.log('Server Error', e);
        });
        server.on('clientError', info => {
            console.log('clientError', info.error);
        });
        return server.listen();
    });

    afterEach(() => {
        if (server != null) {
            return server.closeAsync();
        }
    });
    it('should handle timeout and reject the promise',  async () => {
        const client = new EmberClient(options);
        const PATH = '0.0.0';
        await client.connectAsync();
        const param: QualifiedParameter = await client.getElementByPathAsync(PATH) as QualifiedParameter;
        socket.sendBERNode = (node: TreeNode) => {};
        // set low timeout
        client.timeoutValue = 5;
        const p = client.setValueAsync(param, 'test');
        await expect(p).rejects.toThrowError(EmberTimeoutError);
        return client.disconnectAsync();
    });
    it('should handle socket error and reject the promise', async () => {
        const client = new EmberClient(options);
        const PATH = '0.0.0';
        const ERROR = new Error('socket error');
        await client.connectAsync();
        const param: QualifiedParameter = await client.getElementByPathAsync(PATH) as QualifiedParameter;
        socket.sendBERNode = (node: TreeNode) => {
            socket.emit('error', ERROR);
        };
        const p = client.setValueAsync(param, 'test');
        await expect(p).rejects.toThrowError(ERROR);
        return client.disconnectAsync();
    });
    it('should throw an error if trying to call it with non Parameter', async () => {
        const client = new EmberClient(options);
        const PATH = '0.0';
        await client.connectAsync();
        const param: QualifiedParameter = await client.getElementByPathAsync(PATH) as QualifiedParameter;
        const p = client.setValueAsync(param, 'test');
        await expect(p).rejects.toThrowError(InvalidEmberNodeError);
        return client.disconnectAsync();
    });
});
