import { EmberServer, EmberServerOptions } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { S101Socket } from '../socket/s101.socket';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { EmberClient, EmberClientOptions } from '../client/ember-client';
import { TreeNode } from '../common/tree-node';
import { Parameter } from '../common/Parameter';

const LOCALHOST = '127.0.0.1';
const PORT = 9009;
const options = new EmberClientOptions(LOCALHOST, PORT);

describe('Parameters subscribe/unsubscribe', () => {
    let server: EmberServer;
    let mockedServer: {[index: string]: any};
    let jsonTree: { [index: string]: any }[];
    beforeEach(() => {
        jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions = new EmberServerOptions(
            LOCALHOST, PORT, root
        );
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
        return server.closeAsync();
    });

    it('should not auto subscribe stream parameter', () => {
        const parameter = server.tree.getElementByPath('0.0.2');
        expect(parameter.isStream()).toBeTruthy();
        expect(mockedServer.subscribers['0.0.2']).not.toBeDefined();
    });

    it('should be able subscribe to parameter changes', async () => {
        const client = new EmberClient(options);
        const PATH = '0.0.2';

        const cb = () => {
            return 'updated';
        };
        await client.connectAsync();
        await client.getDirectoryAsync();
        let parameter: Parameter = await client.getElementByPathAsync(PATH) as Parameter;
        expect(mockedServer.subscribers[PATH]).not.toBeDefined();
        expect(parameter.getSubscribersCount()).toBe(0);

        const _subscribe = mockedServer.subscribe.bind(server);
        let _resolve: (value?: unknown) => void;
        const promiseSubscribe = (c: S101Socket, e: Parameter) => {
            _subscribe(c, e);
            _resolve();
        };
        mockedServer._handlers._server.subscribe = promiseSubscribe.bind(server);
        let waitForServer = new Promise(resolve => {
            _resolve = resolve;
        });
        await client.subscribeAsync(parameter, cb);
        await waitForServer;
        expect(mockedServer.subscribers[PATH]).toBeDefined();
        expect(mockedServer.subscribers[PATH].size).toBe(1);
        parameter = await client.getElementByPathAsync(PATH) as Parameter;
        expect(parameter.getSubscribersCount()).toBe(1);
        const _unsubscribe = mockedServer.unsubscribe.bind(server);
        waitForServer = new Promise(resolve => {
            _resolve = resolve;
        });
        const promiseUnsubscribe = (c: S101Socket, e: Parameter) => {
            _unsubscribe(c, e);
            _resolve();
        };

        mockedServer._handlers._server.unsubscribe = promiseUnsubscribe.bind(server);
        await client.unsubscribeAsync(parameter, cb);
        await waitForServer;
        expect(mockedServer.subscribers[PATH]).toBeDefined();
        parameter = await client.getElementByPathAsync(PATH) as Parameter;
        expect(mockedServer.subscribers[PATH]).toBeDefined();
        expect(mockedServer.subscribers[PATH].size).toBe(0);
        expect((parameter as TreeNode).getSubscribersCount()).toBe(0);
        return client.disconnectAsync();
    });
});
