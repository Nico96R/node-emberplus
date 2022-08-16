import { EmberServer, EmberServerOptions } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { S101Socket } from '../socket/s101.socket';
import { LoggingService, LogLevel, LoggingEvent, LogEventConstructor } from '../logging/logging.service';
import { EmberClient, EmberClientOptions } from '../client/ember-client';
import { TreeNode } from '../common/tree-node';
import { Parameter } from '../common/Parameter';
import { Matrix } from '../common/matrix/matrix';

const LOCALHOST = '127.0.0.1';
const PORT = 9009;
const options: EmberClientOptions = {host: LOCALHOST, port: PORT};

describe('Subscribers', () => {
    let jsonTree;
    let server: EmberServer;
    let mockedServer: {[index: string]: any};
    const PARAMETER_PATH = '0.0.1';
    const MATRIX_PATH = '0.1.0';
    /** @type {EmberServer} */
    beforeEach(() => {
        jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions: EmberServerOptions = {
            host: LOCALHOST, port: PORT, tree: root, logger: new LoggingService(LogLevel.critical)
        };
        server = new EmberServer(serverOptions);
        mockedServer = server;
        server.on('error', () => {
            // ignore
        });
        server.on('clientError', () => {
            // ignore
        });
        return server.listen();
    });
    afterEach(() => {
        if (server != null) {
            return server.closeAsync();
        }
    });

    it('should accept client to subscribe to parameter and update those who subscribed', () => {
        const client = new EmberClient(options);
        const VALUE = 'The new Value';
        return client.connectAsync()
            .then(() => client.getDirectoryAsync())
            .then(() => client.getElementByPathAsync(PARAMETER_PATH))
            .then(() => {
                // A get directory on non stream is auto subscribe
                expect(mockedServer.subscribers).toBeDefined();
                expect(mockedServer.subscribers[PARAMETER_PATH]).toBeDefined();
                expect(mockedServer.subscribers[PARAMETER_PATH].size).toBe(1);
                let res: TreeNode;
                for (const c of mockedServer.subscribers[PARAMETER_PATH]) {
                    c.queueMessage = (message: TreeNode) => {
                        res = message;
                    };
                }
                server.setValue(server.tree.getElementByPath(PARAMETER_PATH) as Parameter, VALUE, null);
                expect(res).toBeDefined();
                const resParam = res.getElementByPath(PARAMETER_PATH) as Parameter;
                expect(resParam).toBeDefined();
                expect(resParam.getPath()).toBe(PARAMETER_PATH);
                expect(resParam.contents).toBeDefined();
                expect(resParam.contents.value).toBe(VALUE);
                return client.disconnectAsync();
            });
    });

    it('should accept client to subscribe to matrix and update those who subscribed', async () => {
        const client = new EmberClient(options);
        await client.connectAsync();
        await client.getDirectoryAsync();
        // auto subscribe on get directory
        await client.getElementByPathAsync(MATRIX_PATH);
        // A get directory on non stream is auto subscribe
        expect(mockedServer.subscribers).toBeDefined();
        expect(mockedServer.subscribers[MATRIX_PATH]).toBeDefined();
        expect(mockedServer.subscribers[MATRIX_PATH].size).toBe(1);
        let res: TreeNode;
        for (const c of mockedServer.subscribers[MATRIX_PATH]) {
            c.queueMessage = (message: TreeNode) => {
                res = message;
            };
        }
        server.matrixConnect(MATRIX_PATH, 0, [1]);
        const resParam = res.getElementByPath(MATRIX_PATH) as Matrix;
        expect(resParam).toBeDefined();
        expect(resParam.getPath()).toBe(MATRIX_PATH);
        return client.disconnectAsync();
    });

    it('should clean up subscribers if client not connected anymore', () => {
        const client = new S101Socket();
        const VALUE = 'The new Value';
        mockedServer.subscribers[PARAMETER_PATH] = new Set();
        mockedServer.subscribers[PARAMETER_PATH].add(client);
        expect(mockedServer.subscribers[PARAMETER_PATH].size).toBe(1);
        let res: TreeNode;
        for (const c of mockedServer.subscribers[PARAMETER_PATH]) {
            c.queueMessage = (message: TreeNode) => {
                res = message;
            };
        }
        server.setValue(server.tree.getElementByPath(PARAMETER_PATH) as Parameter, VALUE, null);
        expect(res).not.toBeDefined();
        expect(mockedServer.subscribers[PARAMETER_PATH].has(client)).toBeFalsy();
    });

    it('should ignore unsubscribe if no subcribers', () => {
        const client = new S101Socket();
        let error;
        try {
            mockedServer.unsubscribe(client, server.tree.getElementByPath(PARAMETER_PATH));
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeDefined();
    });

    it('should ignore setValue on element with no contents', () => {
        const param = server.tree.getElementByPath(PARAMETER_PATH);
        const VALUE = 'The new Value';
        (param as {[index: string]: any}).setContents(null);
        let error: Error;
        try {
            server.setValue(param as Parameter, VALUE, null);
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeDefined();
    });

    it('should ignore setValue if unchanged', () => {
        const param = server.tree.getElementByPath(PARAMETER_PATH) as Parameter;
        let logMsg: LoggingEvent;
        mockedServer.logger.log = (msg: LogEventConstructor) => {
            logMsg = msg.createLog();
        };
        server.setValue(param as Parameter, param.value, null);
        expect(logMsg.type).toBe('SET_VALUE_UNCHANGED');
    });
});
