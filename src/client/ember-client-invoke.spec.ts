import { init as jsonRoot} from '../fixture/utils';
import { EmberClient, EmberClientOptions } from './ember-client';
import { EmberServer, EmberServerOptions } from '../server/ember-server';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { TreeNode } from '../common/tree-node';
import { ParameterType } from '../common/parameter-type';
import { FunctionArgument } from '../common/function/function-argument';
import { S101Client } from '../socket/s101.client';
import { QualifiedFunction } from '../common/function/qualified-function';
import { Node } from '../common/node';

const HOST = '127.0.0.1';
const PORT = 9015;
const options: EmberClientOptions = {host: HOST, port: PORT};

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

describe('invokeFunction', () => {
    let server: EmberServer;
    let jsonTree: {[index: string]: any}[];
    beforeEach(() => {
        jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions: EmberServerOptions = {
            host: HOST, port: PORT, tree: root
        };
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
    it('should catch socket error', async () => {
        const client = new EmberClient(options);
        client.on('error', () => {});
        const PATH = '0.2';
        let error: Error;
        const ERROR = new Error('socket error');
        await client.connectAsync();
        const func: QualifiedFunction = await client.getElementByPathAsync(PATH) as QualifiedFunction;
        socket.sendBERNode = (node: TreeNode) => {
            socket.emit('error', ERROR);
        };
        try {
            await client.invokeFunctionAsync(func, [
                    new FunctionArgument(ParameterType.integer, 1),
                    new FunctionArgument(ParameterType.integer, 1)
                ]);
        } catch (e) {error = e; }
        expect(error).toBeDefined();
        expect(error).toBe(ERROR);
        return client.disconnectAsync();
    });
});
