import { EmberServer, EmberServerOptions } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { S101Socket } from '../socket/s101.socket';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { EmberClient, EmberClientOptions } from '../client/ember-client';
import { ServerEvents, Types } from './ember-server.events';
import { TreeNode } from '../common/tree-node';
import { Parameter } from '../common/parameter';
import { ParameterType } from '../common/parameter-type';
import { InvocationResult } from '../common/invocation-result';
import { Matrix } from '../common/matrix/matrix';
import { FunctionArgument } from '../common/function/function-argument';
import { Function } from '../common/function/function';
import { S101SocketError } from '../error/errors';

const LOCALHOST = '127.0.0.1';
const PORT = 9009;
const options = new EmberClientOptions(LOCALHOST, PORT);

describe('Server - Client communication', () => {
    let server: EmberServer;
    let jsonTree: { [index: string]: any }[];
    let client: EmberClient;
    let mockedServer: {[index: string]: any};
    beforeEach(() => {
        jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions = new EmberServerOptions(
            LOCALHOST, PORT, root
        );
        server = new EmberServer(serverOptions);
        mockedServer = server;
        server.on('error', e => {
            // ignore
        });
        server.on('clientError', e => {
            // ignore
        });
        server.on('listening', () => {
            // ignore
        });
        server.on('connection', _ => {
            // ignore
        });

        (<any>server)._debug = true;
        return server.listen();
    });

    afterEach(async () => {
        return await server.closeAsync();
    });

    it('should have a function to list all connected clients', async () => {
        const maxClient = 3;
        const clients: EmberClient[] = [];
        const connections = [];
        for (let i = 0; i < maxClient; i++) {
            clients[i] = new EmberClient(options);
            connections.push(clients[i].connectAsync());
        }
        await Promise.all(connections);
        let displayConnections = server.getConnectedClients();
        expect(displayConnections).toBeDefined();
        expect(displayConnections.length).toBe(connections.length);
        let _resolve: (value?: unknown) => void;
        let count = 0;
        const waitForServer = new Promise(resolve => {
            _resolve = resolve;
        });
        server.on('disconnect', () => {
            count++;
            if (count === maxClient) {
                _resolve();
            }
        });
        for (let i = 0; i < maxClient; i++) {
            expect(displayConnections[i].remoteAddress).toMatch(/\d+.\d+\.\d+\.\d+:\d+/);
            expect(displayConnections[i].stats).toBeDefined();
            clients[i].disconnectAsync();
        }
        await waitForServer;
        displayConnections = server.getConnectedClients();
        expect(displayConnections).toBeDefined();
        expect(displayConnections.length).toBe(0);
    });

    it('should disconnect client if not keepalive received', () => {
        client = new EmberClient(options);
        (<any>client).socket.setKeepAliveInterval(0.01); // Trick client socket is private
        let _resolve: (value?: unknown) => void;
        const waitDisconnect = new Promise(resolve => {
            _resolve = resolve;
        });
        server.on('disconnect', () => {
            _resolve();
        });
        return Promise.resolve()
            .then(() => client.connectAsync())
            .then(() => (<any>client).socket.stopKeepAlive()) // Trick client socket is private
            .then(() => (waitDisconnect));
    });

    it('should receive and decode the full tree', async () => {
        client = new EmberClient(options);
        await client.connectAsync();
        await client.getDirectoryAsync();
        expect(client.root).toBeDefined();
        expect(client.root.elements).toBeDefined();
        expect(client.root.elements.size).toBe(jsonTree.length);
        expect((client.root.getElementByNumber(0) as TreeNode).contents.identifier).toBe('scoreMaster');
        await client.getDirectoryAsync(client.root.getElementByNumber(0) as TreeNode);
        expect((client.root.getElementByNumber(0) as TreeNode).elements.size).toBe(jsonTree[0].children.length);
        await client.getDirectoryAsync(client.root.getElementByPath('0.0'));
        expect(client.root.getElementByPath('0.0').elements.size).toBe(jsonTree[0].children[0].children.length);
        expect(client.root.getElementByPath('0.0.3').contents.identifier).toBe('author');
        // Issue #33 EmberServer.handleGetDirectory does not subscribe to child parameters
        expect(mockedServer.subscribers['0.0.0']).toBeDefined();
        await client.disconnectAsync();
        expect(true).toBe(true);
    });

    it('should be able to modify a parameter', async () => {
        client = new EmberClient(options);
        await client.connectAsync();
        await client.getDirectoryAsync();
        await client.getElementByPathAsync('0.0.1');
        const parameter: Parameter = server.tree.getElementByPath('0.0.1') as Parameter;
        expect(parameter.contents.value).not.toBe('Some value');
        await client.setValueAsync(client.root.getElementByPath('0.0.1') as Parameter, 'Some value');
        expect(parameter.contents.value).toBe('Some value');
        return await client.disconnectAsync();
    });

    it('should be able to call a function with parameters', async () => {
        client = new EmberClient(options);
        await client.connectAsync();
        await client.getDirectoryAsync();
        await client.getElementByPathAsync('0.2');
        const func = client.root.getElementByPath('0.2') as Function;
        const result: InvocationResult = await client.invokeFunctionAsync(func, [
            new FunctionArgument(ParameterType.integer, 1),
            new FunctionArgument(ParameterType.integer, 7)
        ]);
        expect(result).toBeDefined();
        expect(result.result).toBeDefined();
        expect(result.result.length).toBe(1);
        expect(result.result[0].value).toBe(8);
        return client.disconnectAsync();
    });

    it('should be able to get child with client.getElement', async () => {
        client = new EmberClient(options);
        await client.connectAsync();
        await client.getDirectoryAsync();
        await client.getElementByPathAsync('scoreMaster/identity/product');
        await client.getElementByPathAsync('scoreMaster/router/labels/group 1');
        return client.disconnectAsync();
    });

    it('should be able to get child with getElementByPath', async () => {
        client = new EmberClient(options);
        await client.connectAsync();
        await client.getDirectoryAsync();
        await client.getElementByPathAsync('scoreMaster/identity/product');
        await client.getElementByPathAsync('scoreMaster/router/labels/group 1');
        return client.disconnectAsync();
    });

    it('should throw an error if getElementByPath for unknown path', async () => {
        client = new EmberClient(options);
        let error: Error;
        await client.connectAsync();
        await client.getDirectoryAsync();
        try {
            await client.getElementByPathAsync('scoreMaster/router/labels/group');
        } catch (e) {
            error = e;
        }
        expect(error.message).toMatch(/Failed path discovery/);
        return client.disconnectAsync();
    });

    it('should be able to make a matrix connection', async () => {
        client = new EmberClient(options);
        await client.connectAsync();
        await client.getDirectoryAsync();
        let matrix: Matrix = await client.getElementByPathAsync('0.1.0') as Matrix;
        matrix = await client.matrixConnectAsync(matrix, 0, [1]);
        matrix = await client.getElementByPathAsync(matrix.getPath()) as Matrix;
        expect(matrix.connections[0].sources).toBeDefined();
        expect(matrix.connections[0].sources.length).toBe(1);
        expect(matrix.connections[0].sources[0]).toBe(1);
        return client.disconnectAsync();
    });

    it('should generate events on command and matrix connection', async () => {
        client = new EmberClient(options);
        let count = 0;
        let receivedEvent: ServerEvents = null;
        const eventHandler = (event: ServerEvents) => {
            count++;
            receivedEvent = event;
        };
        await client.connectAsync();
        count = 0;
        server.on('event', eventHandler);
        await client.getDirectoryAsync();
        expect(count).toBe(1);
        expect(receivedEvent.type).toBe(Types.GETDIRECTORY);
        const matrix: Matrix = await client.getElementByPathAsync('0.1.0') as Matrix;
        expect(matrix).toBeDefined();
        count = 0;
        await client.matrixConnectAsync(matrix, 0, [1]);
        expect(count).toBe(1);
        expect(receivedEvent.type).toBe(Types.MATRIX_CONNECTION);
        count = 0;
        const func = client.root.getElementByPath('0.2') as Function;
        await client.invokeFunctionAsync(func, [
            new FunctionArgument(ParameterType.integer, 1),
            new FunctionArgument(ParameterType.integer, 7)
        ]);
        expect(count).toBe(1);
        expect(receivedEvent.type).toBe(Types.INVOKE);
        const parameter: Parameter = await client.getElementByPathAsync('0.0.2') as Parameter;
        const _subscribe = mockedServer.subscribe.bind(server);
        let _resolve: (value?: unknown) => void;
        // so that we wait for the server to process the subscribe
        const waitForServer = new Promise((resolve) => {
            _resolve = resolve;
        });
        const promiseSubscribe = (c: S101Socket, e: Parameter) => {
            _subscribe(c, e);
            _resolve();
        };
        mockedServer._handlers._server.subscribe = promiseSubscribe.bind(server);
        count = 0;
        await client.subscribeAsync(parameter);
        await waitForServer;
        expect(count).toBe(1);
        expect(receivedEvent.type).toBe(Types.SUBSCRIBE);
        server.off('event', eventHandler);
        return client.disconnectAsync();
    });
    it('should have properties host and port', () => {
        expect(server.host).toBe(LOCALHOST);
        expect(server.port).toBe(PORT);
    });
});

describe('closeAsync', () => {
    it('should catch error and reject it properly', async () => {
        const serverOptions = new EmberServerOptions(
            LOCALHOST, PORT + 1, new TreeNode()
        );
        const server = new EmberServer(serverOptions);
        const p = server.closeAsync();
        await expect(p).rejects.toThrowError(S101SocketError);
    });
});
