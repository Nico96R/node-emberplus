import { EmberServer, EmberServerEvent, EmberServerOptions } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { S101Socket } from '../socket/s101.socket';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { EmberClient, EmberClientOptions } from '../client/ember-client';
import { MatrixType } from '../common/matrix/matrix-type';
import { Matrix } from '../common/matrix/matrix';
import { MatrixConnection } from '../common/matrix/matrix-connection';
import { MatrixOperation } from '../common/matrix/matrix-operation';
import { MatrixDisposition } from '../common/matrix/matrix-disposition';
import { ClientRequest } from './client-request';
import { MatrixNode } from '../common/matrix/matrix-node';
import { MatrixMode } from '../common/matrix/matrix-mode';
import { Parameter } from '../common/parameter';
import { ParameterType } from '../common/parameter-type';
import { Node } from '../common/node';
import { Socket } from 'net';

const LOCALHOST = '127.0.0.1';
const PORT = 9009;
const MATRIX_PATH = '0.1.0';
const options: EmberClientOptions = {host: LOCALHOST, port: PORT};

function myWriter(str: string | Uint8Array, encoding?: string, cb?: (err?: Error) => void): boolean;
function myWriter(buffer: string | Uint8Array, cb?: (err?: Error) => void): boolean;
function myWriter(x: Uint8Array): boolean {
    return true;
}
const tcpSocket = new Socket();
tcpSocket.write = myWriter;

describe('Matrix Connect', () => {
    let server: EmberServer;
    let mockedServer: {[index: string]: any};
    let jsonTree: { [index: string]: any }[];
    beforeEach(() => {
        jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions: EmberServerOptions = {
            host: LOCALHOST, port: PORT, tree: root
        };
        server = new EmberServer(serverOptions);
        mockedServer = server;
    });
    afterEach(() => {
        return server.closeAsync().catch((e) => {
            // ignore error
        });
    });

    it('should verify if connection allowed in 1-to-N', () => {
        let disconnectCount = 0;
        const handleDisconnect = () => {
            disconnectCount++;
        };
        server.on('matrix-disconnect', handleDisconnect.bind(this));
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        let connection = new MatrixConnection(0);
        connection.setSources([1]);
        connection.operation = MatrixOperation.connect;
        let res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();
        matrix.setSources(0, [0]);
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeFalsy();
        connection.operation = MatrixOperation.absolute;
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();
        // We can't connect.  But server will disconnect existing source and connect new one.
        // const nodeHandlers = new NodeHandlers(server as EmberServerInterface, new LoggingService(LogLevel.info));
        const socket = new S101Socket(tcpSocket);
        (socket as {[index: string]: any})._clearTimers();
        mockedServer._handlers.handleMatrixConnections(new ClientRequest(socket, null), matrix, {0: connection});
        expect(matrix.connections[0].sources[0]).toBe(1);
        expect(disconnectCount).toBe(1);
        // But if connecting same source and dest this is a disconnect.  But not possible in 1toN.
        // instead connect with defaultSource or do nothing
        mockedServer._handlers.getDisconnectSource(matrix, 0);
        matrix.defaultSources[0].value = 222;
        mockedServer._handlers.handleMatrixConnections(new ClientRequest(socket, null), matrix, {0: connection});
        expect(disconnectCount).toBe(2);
        expect(matrix.connections[0].sources[0]).toBe(222);
        matrix.setSources(0, [0]);
        connection = new MatrixConnection(1);
        connection.operation = MatrixOperation.absolute;
        connection.setSources([1]);
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();
    });

    it('should verify if connection allowed in 1-to-1', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        let disconnectCount = 0;
        const handleDisconnect = () => {
            disconnectCount++;
        };
        server.on('matrix-disconnect', handleDisconnect.bind(this));
        matrix.type = MatrixType.oneToOne;
        const connection = new MatrixConnection(0);
        connection.setSources([1]);
        connection.operation = MatrixOperation.connect;
        let res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();
        matrix.setSources(0, [0]);
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeFalsy();
        // We can't connect but in 1-on-1 server should disconnect existing source and connect new one.
        const socket = new S101Socket(tcpSocket);
        (socket as {[index: string]: any})._clearTimers();
        mockedServer._handlers.handleMatrixConnections(new ClientRequest(socket, null), matrix, { 0: connection });
        expect(matrix.connections[0].sources[0]).toBe(1);
        expect(disconnectCount).toBe(1);
        // But if connecting same source and dest.  just disconnect and do not reconnect.
        mockedServer._handlers.handleMatrixConnections(new ClientRequest(socket, null), matrix, { 0: connection });
        expect(disconnectCount).toBe(2);
        connection.operation = MatrixOperation.absolute;
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();
        matrix.setSources(0, []);
        matrix.setSources(1, [1]);
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeFalsy();
        server.off('matrix-disconnect', handleDisconnect);
    });

    it('should disconnect if trying to connect same source and target in 1-to-1', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        let disconnectCount = 0;
        const handleDisconnect = () => {
            disconnectCount++;
        };
        server.on('matrix-disconnect', handleDisconnect.bind(this));
        matrix.type = MatrixType.oneToOne;
        matrix.setSources(0, [1]);
        const connection = new MatrixConnection(0);
        connection.setSources([1]);
        connection.operation = MatrixOperation.connect;
        const socket = new S101Socket(tcpSocket);
        (socket as {[index: string]: any})._clearTimers();
        mockedServer._handlers.handleMatrixConnections(new ClientRequest(socket, null), matrix, { 0: connection });
        expect(matrix.connections[0].sources.length).toBe(0);
        expect(disconnectCount).toBe(1);
    });

    it('should be able to lock a connection', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        let disconnectCount = 0;
        const handleDisconnect = () => {
            disconnectCount++;
        };
        server.on('matrix-disconnect', handleDisconnect.bind(this));
        matrix.type = MatrixType.oneToOne;
        matrix.setSources(0, [1]);
        matrix.connections[0].lock();
        const connection = new MatrixConnection(0);
        connection.setSources([0]);
        connection.operation = MatrixOperation.connect;
        const socket = new S101Socket(tcpSocket);
        (socket as {[index: string]: any})._clearTimers();
        mockedServer._handlers.handleMatrixConnections(new ClientRequest(socket, null), matrix, { 0: connection });
        expect(matrix.connections[0].sources.length).toBe(1);
        expect(matrix.connections[0].sources[0]).toBe(1);
        expect(disconnectCount).toBe(0);
    });
    it ('should ignore disconnect if no source specified', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        let disconnectCount = 0;
        const handleDisconnect = () => {
            disconnectCount++;
        };
        server.on('matrix-disconnect', handleDisconnect.bind(this));
        matrix.setSources(0, [1]);
        const connection = new MatrixConnection(0);
        connection.setSources([]);
        connection.operation = MatrixOperation.disconnect;
        const socket = new S101Socket(tcpSocket);
        (socket as {[index: string]: any})._clearTimers();
        mockedServer._handlers.handleMatrixConnections(new ClientRequest(socket, null), matrix, { 0: connection });
        expect(matrix.connections[0].sources.length).toBe(1);
        expect(matrix.connections[0].sources[0]).toBe(1);
        expect(disconnectCount).toBe(0);
    });
    it ('should disconnect if no source specified during connect', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        let disconnectCount = 0;
        const handleDisconnect = () => {
            disconnectCount++;
        };
        server.on('matrix-disconnect', handleDisconnect.bind(this));
        matrix.setSources(0, [1]);
        const connection = new MatrixConnection(0);
        connection.setSources([]);
        connection.operation = MatrixOperation.connect;
        mockedServer.preMatrixConnect = () => {};
        const socket = new S101Socket(tcpSocket);
        (socket as {[index: string]: any})._clearTimers();
        mockedServer._handlers.handleMatrixConnections(new ClientRequest(socket, null), matrix, { 0: connection });
        expect(matrix.connections[0].sources.length).toBe(0);
        expect(disconnectCount).toBe(1);
    });

    it('should verify if connection allowed in N-to-N', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        matrix.type = MatrixType.nToN;
        matrix.maximumTotalConnects = 2;
        matrix.setSources(0, [0, 1]);

        const connection = new MatrixConnection(0);
        connection.setSources([2]);
        connection.operation = MatrixOperation.connect;
        let res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeFalsy();

        matrix.setSources(2, [2]);
        matrix.setSources(1, [1]);
        matrix.setSources(0, []);
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeFalsy();

        matrix.setSources(1, []);
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();

        matrix.setSources(0, [1, 2]);
        matrix.setSources(1, []);
        connection.operation = MatrixOperation.absolute;
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();

        matrix.maximumTotalConnects = 20;
        matrix.maximumConnectsPerTarget = 1;

        matrix.setSources(2, [2]);
        matrix.setSources(1, [1]);
        matrix.setSources(0, [0]);
        connection.setSources([2]);
        connection.operation = MatrixOperation.connect;

        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeFalsy();

        matrix.setSources(0, []);
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();

        matrix.setSources(0, [0]);
        connection.operation = MatrixOperation.absolute;
        res = matrix.canConnect(connection.target, connection.sources, connection.operation);
        expect(res).toBeTruthy();

    });

    it('should return modified answer on absolute connect', () => {
        const client = new EmberClient(options);
        server.on('error', () => {
            // ignore
        });
        server.on('clientError', () => {
            // ignore
        });
        // server._debug = true;
        return server.listen()
            .then(() => client.connectAsync())
            .then(() => client.getDirectoryAsync())
            .then(() => client.getElementByPathAsync(MATRIX_PATH))
            .then((matrix: Matrix) => client.matrixSetConnection(matrix, 0, [1]))
            .then(result => {
                expect(result).toBeDefined();
                expect(result.connections).toBeDefined();
                expect(result.connections[0]).toBeDefined();
                expect(result.connections[0].disposition).toBe(MatrixDisposition.modified);
                return client.disconnectAsync();
            });
    });

    it('should have applyMatrixOneToNDisconnect and support disconnect sources', () => {
        const matrix = new MatrixNode(0, 'identifier', MatrixType.oneToN, MatrixMode.linear);
        matrix.targets = [0, 1, 2, 3, 4];
        matrix.sources = [0, 1];
        matrix.connections = {0: new MatrixConnection(0)};
        matrix.connections[0].sources = [0];
        const response = new MatrixNode(0, 'identifier', MatrixType.oneToN, MatrixMode.linear);
        response.connections = {0: new MatrixConnection(0)};
        mockedServer.applyMatrixOneToNDisconnect(
            matrix, matrix.connections[0],
            response, null, false);
        expect(response.connections[0].disposition).toBeDefined();
    });

    it('should have applyMatrixOneToNDisconnect and emit event if response required', () => {
        const matrix = new MatrixNode(0, 'identifier', MatrixType.oneToN, MatrixMode.linear);
        const defaultSource = new Parameter(0, ParameterType.integer, 1);
        matrix.defaultSources = [defaultSource, defaultSource, defaultSource, defaultSource, defaultSource, defaultSource];
        matrix.targets = [0, 1, 2, 3, 4];
        matrix.sources = [0, 1];
        matrix.connectSources(0, [0]);
        const response = new MatrixNode(0, 'identifier', MatrixType.oneToN, MatrixMode.linear);
        response.connections = {0: new MatrixConnection(0)};
        let event;
        let data;
        mockedServer.emit = (e: string, d: any) => {
            event = e;
            data = d;
        };
        mockedServer.applyMatrixOneToNDisconnect(
            matrix, matrix.connections[0],
            response, null, true);
        expect(event).toBeDefined();
        expect(event).toBe(EmberServerEvent.MATRIX_DISCONNECT);
        expect(data).toBeDefined();

        // If response is false, do not emit
        event = undefined;
        data = undefined;
        matrix.connectSources(0, [0]);
        mockedServer.applyMatrixOneToNDisconnect(
            matrix, matrix.connections[0],
            response, null, false);
        expect(event).not.toBeDefined();
        expect(data).not.toBeDefined();

        // If client socket is null, do not set client info
        event = undefined;
        data = undefined;
        matrix.connectSources(0, [0]);
        mockedServer.applyMatrixOneToNDisconnect(
            matrix, matrix.connections[0],
            response, new ClientRequest(null, null), true);
        expect(event).toBeDefined();
        expect(event).toBe(EmberServerEvent.MATRIX_DISCONNECT);
        expect(data).toBeDefined();

        // If client socket is not null, return client socket info
        event = undefined;
        data = {client: null};
        matrix.connectSources(0, [0]);
        const clientSocket = new S101Socket();
        mockedServer.applyMatrixOneToNDisconnect(
            matrix, matrix.connections[0],
            response, new ClientRequest(clientSocket, null), true);
        expect(event).toBeDefined();
        expect(event).toBe(EmberServerEvent.MATRIX_DISCONNECT);
        expect(data).toBeDefined();
        expect(data.client).toBe('not connected');

        // Should ignore disconnect if target and source not connected
        event = undefined;
        data = undefined;
        matrix.connectSources(0, [0]);
        const connection = new MatrixConnection(0);
        connection.sources = [1];
        mockedServer.applyMatrixOneToNDisconnect(
            matrix, connection,
            response, null, false);
        expect(event).not.toBeDefined();
        expect(data).not.toBeDefined();
    });

    it('should handle oneToOne matrix with default preMatrixConnect function', () => {
        const matrix = new MatrixNode(0, 'identifier', MatrixType.oneToOne, MatrixMode.linear);
        matrix.targets = [0, 1, 2, 3, 4];
        matrix.sources = [0, 1];
        matrix.connectSources(0, [0]);
        matrix.connectSources(1, [1]);
        const response = new MatrixNode(0, 'identifier', MatrixType.oneToOne, MatrixMode.linear);
        response.connections = {1: new MatrixConnection(1)};
        const connection = new MatrixConnection(1);
        connection.sources = [0];
        connection.operation = MatrixOperation.connect;
        mockedServer.preMatrixConnect(matrix, connection, response, null, false);
        expect(response.connections[0].disposition).toBe(MatrixDisposition.modified);
        // we should not modify the target here.  It is done in the next step.  Not part of preMatrixConnect
        expect(response.connections[1].disposition).not.toBeDefined();
    });

    it('should return tally if trying to connect already connected src/tgt in preMatrixConnect function', () => {
        const matrix = new MatrixNode(0, 'identifier', MatrixType.oneToN, MatrixMode.linear);
        matrix.targets = [0, 1, 2, 3, 4];
        matrix.sources = [0, 1];
        matrix.connectSources(0, [0]);
        const response = new MatrixNode(0, 'identifier', MatrixType.oneToOne, MatrixMode.linear);
        response.connections = {0: new MatrixConnection(0)};
        const connection = new MatrixConnection(0);
        connection.sources = [0];
        connection.operation = MatrixOperation.connect;
        mockedServer.preMatrixConnect(matrix, connection, response, null, false);

        expect(response.connections[0].disposition).toBe(MatrixDisposition.tally);
    });

    it('should emit message on source disconnect', () => {
        const matrix = new MatrixNode(0, 'identifier', MatrixType.oneToN, MatrixMode.linear);
        matrix.targets = [0, 1, 2, 3, 4];
        matrix.sources = [0, 1];
        matrix.connectSources(0, [0]);
        const response = new MatrixNode(0, 'identifier', MatrixType.oneToOne, MatrixMode.linear);
        response.connections = {0: new MatrixConnection(0)};
        const connection = new MatrixConnection(0);
        connection.sources = [0];
        connection.operation = MatrixOperation.connect;

        let event;
        let data;
        mockedServer.emit = (e: string, d: any) => {
            event = e;
            data = d;
        };
        mockedServer.disconnectSources(matrix, 0, [0], null, true);
        expect(event).toBe(EmberServerEvent.MATRIX_DISCONNECT);
        expect(data).toBeDefined();

        // same with client
        event = undefined;
        data = {client: null};
        const socket = new S101Socket(tcpSocket);
        (socket as {[index: string]: any})._clearTimers();
        mockedServer.disconnectSources(matrix, 0, [0], new ClientRequest(socket, null), true);
        expect(event).toBe(EmberServerEvent.MATRIX_DISCONNECT);
        expect(data).toBeDefined();
    });

    it('should applyMatrixConnect', () => {
        const matrix = new MatrixNode(0, 'identifier', MatrixType.oneToN, MatrixMode.linear);
        let target: number;
        let sources: number[];
        matrix.setSources = (t: number, s: number[]) => {
            target = t;
            sources = s;
        };
        const connection = new MatrixConnection(0);
        connection.sources = [0];
        connection.operation = MatrixOperation.absolute;
        const response = new MatrixConnection(0);
        mockedServer.applyMatrixConnect(matrix, connection, response, null, null);
        expect(target).toBe(0);
        expect(sources[0]).toBe(0);
    });

    it('should handle getDisconnectSource if not defined', () => {
        // Delete the defaultSources
        const node = server.tree.getElementByPath('0.1') as Node;
        node.elements.delete(1001);

        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        const res = mockedServer._handlers.getDisconnectSource(matrix, 0);
        expect(res).toBe(-1);
    });
});
