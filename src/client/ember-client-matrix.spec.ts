
import { init as jsonRoot} from '../fixture/utils';
import { EmberClient, EmberClientOptions } from './ember-client';
import { EmberServer, EmberServerEvent, EmberServerOptions } from '../server/ember-server';
import { LoggingService, LogLevel, LogEventConstructor, LoggingEvent } from '../logging/logging.service';
import { TreeNode } from '../common/tree-node';
import { S101Client } from '../socket/s101.client';
import { MatrixNode } from '../common/matrix/matrix-node';
import { MatrixType } from '../common/matrix/matrix-type';
import { QualifiedMatrix } from '../common/matrix/qualified-matrix';
import { Node } from '../common/node';
import { EmberTimeoutError, InvalidMatrixSignalError } from '../error/errors';
import { ServerEvents } from '../server/ember-server.events';

const HOST = '127.0.0.1';
const PORT = 9011;
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

describe('Matrix', () => {
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
        server.on(EmberServerEvent.ERROR, e => {
            console.log('Server Error', e);
        });
        server.on(EmberServerEvent.CLIENT_ERROR, info => {
            console.log('clientError', info.error);
        });
        return server.listen();
    });

    afterEach(() => {
        if (server != null) {
            return server.closeAsync();
        }
    });
    it('should have a matrixConnect and matrixDisconnect', async () => {
        const client = new EmberClient(options);
        const PATH = '0.1.0';
        const serverMatrix: MatrixNode = server.tree.getElementByPath(PATH) as MatrixNode;
        // change type to nToN to allow disconnect
        serverMatrix.contents.type = MatrixType.nToN;
        await client.connectAsync();
        const matrix: QualifiedMatrix = await client.getElementByPathAsync(PATH) as QualifiedMatrix;
        await client.matrixConnectAsync(matrix, 0, [0]);
        let matrixNode: MatrixNode = client.root.getElementByPath(PATH) as MatrixNode;
        expect(matrixNode.connections[0].sources).toBeDefined();
        expect(matrixNode.connections[0].sources.length).toBe(1);
        expect(matrixNode.connections[0].sources[0]).toBe(0);
        await client.matrixDisconnectAsync(matrix, 0, [0]);
        matrixNode = client.root.getElementByPath(PATH) as MatrixNode;
        expect(matrix.connections[0].sources).not.toBeDefined();
        return client.disconnectAsync();
    });
    it('should handle socket error during matrix operation', async () => {
        const client = new EmberClient(options);
        client.on('error', () => {});
        const PATH = '0.1.0';
        let error: Error;
        const ERROR = new Error('socket error');
        await client.connectAsync();
        const matrix: QualifiedMatrix = await client.getElementByPathAsync(PATH) as QualifiedMatrix;
        // simulate error from socket
        socket.sendBERNode = (node: TreeNode) => {
            socket.emit('error', ERROR);
        };
        try {
            await client.matrixConnectAsync(matrix, 0, [0]);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error).toBe(ERROR);
        return client.disconnectAsync();
    });
    it('should ignore null response and invalid response and timeout during matrix operation', async () => {
        const client = new EmberClient(options);
        client.on('error', () => {});
        const PATH = '0.1.0';
        await client.connectAsync();
        const matrix: QualifiedMatrix = await client.getElementByPathAsync(PATH) as QualifiedMatrix;
        // simulate null response
        client.timeoutValue = 100;
        socket.sendBERNode = (node: TreeNode) => {
            socket.emit('emberTree', null);
            socket.emit('emberTree', new Node(0));
        };
        const p = client.matrixConnectAsync(matrix, 0, [0]);
        await expect(p).rejects.toThrowError(EmberTimeoutError);
        return client.disconnectAsync();
    });
    it('should throw an error if not valid connection', async () => {
        const client = new EmberClient(options);
        const PATH = '0.1.0';
        await client.connectAsync();
        const matrix: QualifiedMatrix = await client.getElementByPathAsync(PATH) as QualifiedMatrix;
        const p = client.matrixConnectAsync(matrix, 0, [99]);
        await expect(p).rejects.toThrowError(InvalidMatrixSignalError);
        return client.disconnectAsync();
    });
    it('should ignore null response on matrix operation', async () => {
        const o: EmberClientOptions = {host: HOST, port: PORT};

        o.logger = new LoggingService();
        const client = new EmberClient(o);
        const mockedClient: {[index: string]: any} = client;
        const root = new TreeNode();
        const matrix = new MatrixNode(0);
        matrix.targets = [0, 1, 2, 3];
        matrix.sources = [0, 1];
        root.addChild(matrix);
        let res: any;
        mockedClient.socket.sendBERNode = () => {
            // send a null response and record the response and log
            res = mockedClient._callback(null, null);
            // send an error to stop waiting for a response.
            mockedClient._callback(new Error('internal error'), null);
        };
        let log: LoggingEvent;
        mockedClient._logger.log = (logCtor: LogEventConstructor) => {
            const msg = logCtor.createLog();
            if (log == null || log.type !== 'MATRIX_OPERATION_UNEXPECTED_ANSWER') {
                log = msg;
            }
        };
        client.timeoutValue = 10000;
        try {
            await mockedClient.matrixOperationAsync(matrix, 0, [0]);
        } catch (e) {
            // ignore error
        }
        expect(log).toBeDefined();
        expect(log.type).toBe('MATRIX_OPERATION_UNEXPECTED_ANSWER');
        expect(res).not.toBeDefined();
    });
});
