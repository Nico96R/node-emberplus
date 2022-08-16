import { EmberServer, EmberServerEvent, EmberServerOptions } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { S101Socket, S101SocketEvent } from '../socket/s101.socket';
import { LogLevel, LogEventConstructor, LoggingService } from '../logging/logging.service';
import { S101ServerEvent } from '../socket/s101.server';
import {  ServerLogs } from './ember-server.logs';
import { MatrixConnection } from '../common/matrix/matrix-connection';
import { MatrixNode } from '../common/matrix/matrix-node';
import { Parameter } from '../common/parameter';
import { TreeNode } from '../common/tree-node';

const LOCALHOST = '127.0.0.1';
const PORT = 9009;

describe('server', () => {

    describe('Events', () => {
        let mockedServer: {[index: string]: any};
        it('should let possibility to change the LogLevel', () => {
            const serverOptions = new EmberServerOptions(
                LOCALHOST, PORT , new TreeNode(), new LoggingService(LogLevel.critical)
            );
            const server = new EmberServer(serverOptions);
            mockedServer = server;
            server.setLogLevel(LogLevel.error);
            expect(mockedServer.logger.logLevel).toBe(LogLevel.error);
            server.setLogLevel(LogLevel.debug);
            expect(mockedServer.logger.logLevel).toBe(LogLevel.debug);

        });
        it('should catch error emitted by internal tcp server', () => {
            const jsonTree = jsonRoot();
            const root = EmberServer.createTreeFromJSON(jsonTree);
            const ERROR_MESSAGE = 'SSome internal error';
            const serverOptions = new EmberServerOptions(
                LOCALHOST, PORT, root
            );
            const server = new EmberServer(serverOptions);
            let error: Error;
            server.on(EmberServerEvent.ERROR, e => { error = e; });
            mockedServer = server;
            mockedServer.server.emit(S101ServerEvent.ERROR, new Error(ERROR_MESSAGE));
            expect(error).toBeDefined();
            expect(error.message).toBe(ERROR_MESSAGE);
        });

        it('should catch tcp server disconnected message, and clean up clients', async () => {
            const jsonTree = jsonRoot();
            const root = EmberServer.createTreeFromJSON(jsonTree);
            const serverOptions = new EmberServerOptions(
                LOCALHOST, PORT, root
            );
            const server = new EmberServer(serverOptions);
            const client = new S101Socket();
            mockedServer = server;
            mockedServer.server.emit(EmberServerEvent.CONNECTION, client);
            let count = 0;
            server.on(EmberServerEvent.DISCONNECTED, () => { count++; });
            mockedServer.server.emit(S101ServerEvent.DISCONNECTED);
            expect(count).toBe(1);
            expect(server.connectedClientsCount).toBe(0);
            return await client.disconnectAsync();
        });

        it('should catch error from connection to clients', async () => {
            const jsonTree = jsonRoot();
            const root = EmberServer.createTreeFromJSON(jsonTree);
            const ERROR_MESSAGE = 'Some internal error';
            const serverOptions = new EmberServerOptions(
                LOCALHOST, PORT, root
            );
            const server = new EmberServer(serverOptions);
            const client = new S101Socket();
            jest.spyOn(client, 'remoteAddress', 'get').mockReturnValue('address');
            let info: { error: Error };
            server.on('clientError', data => { info = data; });
            // Attach client to server
            mockedServer = server;
            mockedServer.server.emit(S101ServerEvent.CONNECTION, client);
            client.emit(S101SocketEvent.ERROR, new Error(ERROR_MESSAGE));
            await expect(info).toBeDefined();
            await expect(info.error.message).toBe(ERROR_MESSAGE);
            return await client.disconnectAsync();
        });
    });
    describe('logs', () => {
        const testLogMessage = (ctor: LogEventConstructor) => {
            expect(ctor).toBeDefined();
            const msg = ctor.createLog();
            expect(msg).toBeDefined();
            expect(msg.logLevel).toBe(ctor.logLevel);
        };
        it('should have working log messages', () => {
            testLogMessage(ServerLogs.UPDATE_SUBSCRIBERS(new S101Socket(), ''));
            testLogMessage(ServerLogs.MATRIX_CONNECT('', 1, [0]));
            testLogMessage(ServerLogs.MATRIX_DISCONNECT('', 1, [0]));
            testLogMessage(ServerLogs.MATRIX_SET('', 1, [0]));
            testLogMessage(ServerLogs.PRE_MATRIX_CONNECT(new MatrixNode(0), new MatrixConnection(0)));
            testLogMessage(ServerLogs.APPLY_MATRIX_CONNECT(new MatrixNode(0), new MatrixConnection(0), 'test'));
            testLogMessage(ServerLogs.DISCONNECT_MATRIX_TARGET(new MatrixNode(0), 0, [0]));
            testLogMessage(ServerLogs.DISCONNECT_MATRIX_TARGET(new MatrixNode(0), 0));
            testLogMessage(ServerLogs.DISCONNECT_SOURCES(new MatrixNode(0), 0, [0]));
            testLogMessage(ServerLogs.DISCONNECT_SOURCES(new MatrixNode(0), 0));
            testLogMessage(ServerLogs.APPLY_ONETOONE_DISCONNECT(new MatrixNode(0), new MatrixConnection(0), new MatrixConnection(0)));
            testLogMessage(ServerLogs.REPLACE_ELEMENT(''));
            testLogMessage(ServerLogs.SET_VALUE(new Parameter(0), 1));
            testLogMessage(ServerLogs.INVALID_EMBER_NODE(new Parameter(0)));
            testLogMessage(ServerLogs.SUBSCRIBE(new S101Socket(), ''));
            testLogMessage(ServerLogs.UNSUBSCRIBE(new S101Socket(), ''));
            testLogMessage(ServerLogs.UPDATE_SUBSCRIBERS_WARN(new S101Socket(), ''));
            testLogMessage(ServerLogs.LISTENING());
            testLogMessage(ServerLogs.CONNECTION(new S101Socket()));
            testLogMessage(ServerLogs.EMBER_REQUEST(new S101Socket()));
            testLogMessage(ServerLogs.EMBER_REQUEST_ERROR(new S101Socket(), new Error()));
            testLogMessage(ServerLogs.DISCONNECT(new S101Socket()));
            testLogMessage(ServerLogs.CLIENT_ERROR(new S101Socket(), new Error()));
            testLogMessage(ServerLogs.SERVER_DISCONNECT());
            testLogMessage(ServerLogs.SERVER_ERROR(new Error()));
            testLogMessage(ServerLogs.SERVER_CLOSING());
            testLogMessage(ServerLogs.ERROR_HANDLING(new Error()));
            testLogMessage(ServerLogs.GETDIRECTORY(new Parameter(0)));
            testLogMessage(ServerLogs.HANDLE_MATRIX_CONNECTIONS());
            testLogMessage(ServerLogs.EMPTY_REQUEST());
            testLogMessage(ServerLogs.HANDLE_NODE(0));
            testLogMessage(ServerLogs.HANDLE_QUALIFIED_NODE('0'));
            testLogMessage(ServerLogs.FUNCTION_ERROR(new Error()));
            testLogMessage(ServerLogs.UNEXPECTED(''));
        });
    });
});
