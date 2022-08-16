import { Parameter } from '../common/Parameter';
import { StreamCollection } from '../common/stream/stream-collection';
import { StreamEntry } from '../common/stream/stream-entry';
import { init } from '../fixture/utils';
import { EmberClient, EmberClientOptions } from './ember-client';
import { EmberServer, EmberServerEvent, ClientErrorEventData, EmberServerOptions } from '../server/ember-server';
import { LoggingService, LogLevel, LoggingEvent, LogEventConstructor } from '../logging/logging.service';
import { TreeNode } from '../common/tree-node';
import { QualifiedParameter } from '../common/qualified-parameter';
import { S101Client, S101ClientEvent } from '../socket/s101.client';

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

describe('Streams', () => {
    let server: EmberServer;
    beforeEach(async () => {
        const jsonTree = init();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions: EmberServerOptions = {
            host: HOST, port: PORT, tree: root
        };
        server = new EmberServer(serverOptions);
        // server._debug = true;
        server.on(EmberServerEvent.ERROR, (e: Error) => {
            console.log('Server Error', e);
        });
        server.on(EmberServerEvent.CLIENT_ERROR, (info: ClientErrorEventData) => {
            console.log('clientError', info.error);
        });
        return server.listen();
    });
    afterEach(async () => {
        if (server != null) {
            await server.closeAsync();
        }
    });
    it('should handle StreamCollection received from Provider', async () => {
        const client = new EmberClient(options);
        const PATH = '1';
        client.on('error', () => {
            // ignore
        });
        await client.connectAsync();
        await client.expandAsync();
        const node: TreeNode = await client.getElementByPathAsync(PATH) as TreeNode;
        expect(node).toBeDefined();
        const streamCollection = new StreamCollection();
        const children = node.getChildren();
        expect(children == null).toBeFalsy();
        let count = 0;
        const cb = () => { count++; };
        const VALUE = 999;
        for (const child of children) {
            client.subscribeAsync(child as Parameter, cb);
            streamCollection.addEntry(new StreamEntry((child as Parameter).contents.streamIdentifier, VALUE));
        }
        // prepare StreamCollection
        const root = new TreeNode();
        root.setStreams(streamCollection);
        socket.emit(S101ClientEvent.EMBER_TREE, root);
        expect(count).toBe(children.length);
        for (const child of children) {
            expect((child as Parameter).contents.value).toBe(VALUE);
        }
        return client.disconnectAsync();
    });
    it('should ignore stream not subscribed', () => {
        const o: EmberClientOptions = {host: HOST, port: PORT};

        o.logger = new LoggingService();
        const client = new EmberClient(o);
        const mockedClient: {[index: string]: any} = client;
        const streamCollection = new StreamCollection();
        const root = new TreeNode();
        root.setStreams(streamCollection);
        streamCollection.addEntry(new StreamEntry(123456, 'value'));
        let log: LoggingEvent;
        mockedClient._logger.log = (msg: LogEventConstructor) => {
            log = msg.createLog();
        };
        mockedClient.handleRoot(root);
        expect(log).toBeDefined();
        expect(log.type).toBe('UNKOWN_STREAM_RECEIVED');
    });
    it('should do nothing when trying to subscribe/unsubscribe a non-stream', async () => {
        const client = new EmberClient(options);
        const PATH = '0.0.0';
        const cb = () => {};
        let lastSentNode: TreeNode = null;
        client.on('error', () => {
            // ignore
        });
        await client.connectAsync();
        const param: QualifiedParameter = await client.getElementByPathAsync(PATH) as QualifiedParameter;
        const sendBERNode = socket.sendBERNode;
        socket.sendBERNode = (node: TreeNode) => {
            lastSentNode = node;
            sendBERNode(node);
        };
        await client.subscribeAsync(param, cb);
        expect(lastSentNode).toBe(null);
        await client.unsubscribeAsync(param, cb);
        return client.disconnectAsync();
    });
    it('should do nothing when trying to subscribe/unsubscribe a non-stream', () => {
        const client = new EmberClient(options);
        const PATH = '0.0.0';
        const cb = () => {};
        let lastSentNode: TreeNode = null;
        client.on('error', () => {
            // ignore
        });
        return Promise.resolve()
            .then(() => client.connectAsync())
            .then(() => client.getElementByPathAsync(PATH))
            .then((param: QualifiedParameter) => {
                const sendBERNode = socket.sendBERNode;
                socket.sendBERNode = (node: TreeNode) => {
                    lastSentNode = node;
                    sendBERNode(node);
                };
                return client.subscribeAsync(param, cb)
                .then(() => {
                    expect(lastSentNode).toBe(null);
                    return client.unsubscribeAsync(param, cb);
                });
            })
            .then(() => client.disconnectAsync());
    });

});
