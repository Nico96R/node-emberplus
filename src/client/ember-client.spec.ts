import { EmberClient, EmberClientOptions } from './ember-client';
import { EmberServer, EmberServerEvent, ClientErrorEventData, EmberServerOptions } from '../server/ember-server';
import { TreeNode } from '../common/tree-node';
import { getRootAsync } from '../fixture/utils';
import { init as jsonRoot} from '../fixture/utils';
import { QualifiedNode } from '../common/qualified-node';
import { Node } from '../common/node';
import { Parameter } from '../common/parameter';
import { ParameterType } from '../common/parameter-type';
import { EmberClientEvent } from './ember-client.events';
import { S101SocketError } from '../error/errors';

const HOST = '127.0.0.1';
const PORT = 9010;
const options: EmberClientOptions = {host: HOST, port: PORT};

describe('EmberClient', () => {
    describe('saveTree', () => {
        it('should be able to provide a buffer that can be saved into a file', () => {
            const client = new EmberClient(options);
            client.root = EmberServer.createTreeFromJSON(jsonRoot());
            client.root.getElementByPath('1.3').toJSON();
            client.saveTree((x: Buffer) => {
                expect(x).toBeDefined();
                expect(x.length).not.toBe(0);
            });
        });
    });
    describe('getStats', () => {
        it('should return the socket stats', () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            let count = 0;
            mockedClient.socket = {
                getStats: () => { count++; }
            };
            mockedClient.getStats();
            expect(count).toBe(1);
        });
    });
    describe('Connection', () => {
        let server: EmberServer;
        beforeEach(async () => {
            const root: TreeNode = await getRootAsync();
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
                return await server.closeAsync();
            }
        });

        it('should catch connection error', async () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            const internalError = new Error('internal error');
            mockedClient.socket.connect = () => {
                mockedClient._callback(internalError);
            };
            client.on('error', () => {
                // ignore
            });
            await expect(client.connectAsync()).rejects.toThrow(internalError);
        });
        it('should return connection status with isConnected', async () => {
            const client = new EmberClient(options);
            client.on('error', () => {
                // ignore
            });
            expect(client.isConnected()).toBeFalsy();
            await client.connectAsync();
            expect(client.isConnected()).toBeTruthy();
            await client.disconnectAsync();
            expect(client.isConnected()).toBeFalsy();
        });
        it('should throw an error if trying to connect and already connected', async () => {
            const client = new EmberClient(options);
            client.on('error', () => {
                // ignore
            });
            await client.connectAsync();
            expect(client.isConnected()).toBeTruthy();
            const p = client.connectAsync();
            await expect(p).rejects.toThrowError(S101SocketError);
            return client.disconnectAsync();
        });
        it('should simply return if calling disconnect and not connected', async () => {
            const client = new EmberClient(options);
            client.on('error', () => {
                // ignore
            });
            expect(client.isConnected()).toBeFalsy();
            await expect(client.disconnectAsync()).resolves.not.toThrow();
        });
        it('should be able to fetch a specific node', async () => {
            const client = new EmberClient(options);
            const PATH = '0.1';
            client.on('error', () => {
                // ignore
            });
            await client.connectAsync();
            await client.getDirectoryAsync();
            const node: TreeNode = await client.getElementByPathAsync(PATH) as TreeNode;
            expect(node).toBeDefined();
            expect((node as TreeNode).getPath()).toBe(PATH);
            return client.disconnectAsync();
        });
    });
    describe('Handlers', () => {
        it('should be able to handle QualifiedNode and its children', () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            const qn = new QualifiedNode('0');
            qn.addChild(new Node(0));
            qn.addChild(new QualifiedNode('0.1'));
            mockedClient.handleQualifiedNode(client.root, qn);
            expect(client.root.getElement(0)).toBeDefined();
            expect(client.root.getElement('0.1')).toBeDefined();
        });
        it('should be able to handle Node and its children', () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            const node = new Node(0);
            node.addChild(new Node(0));
            node.addChild(new Parameter(1));
            mockedClient.handleNode(client.root, node);
            expect(client.root.getElement(0)).toBeDefined();
            expect(client.root.getElement('0.1')).toBeDefined();
        });
        it('should ignore QualifiedNode that cannot be attached to our root', () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            const qn = new QualifiedNode('0.1');
            mockedClient.handleQualifiedNode(client.root, qn);
            expect(client.root.getElementByPath('0.1')).toBe(null);
        });
        it('should notify if parameter does change when receiving message', async () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            const value = 100;
            const number = 0;
            client.root = new TreeNode();
            client.root.addChild(new Parameter(number, ParameterType.integer, value));
            const param = new Parameter(number, ParameterType.integer, value + 1);
            const responsePromise = new Promise<[EmberClientEvent, TreeNode]>(resolve => {
                mockedClient.emit = (e: EmberClientEvent, data: any) => resolve([e, data as TreeNode]);
            });
            mockedClient.handleNode(client.root, param);
            const [event, response] = await responsePromise;
            expect(response).toBeDefined();
            expect(event).toBe(EmberClientEvent.VALUE_CHANGE);
            expect((client.root.getElement(number) as Parameter).value).toBe(value + 1);
        });
        it('should catch error when making request and emit them', async () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            const internalError = new Error('internal error');
            const responsePromise = new Promise<[EmberClientEvent, Error]>(resolve => {
                mockedClient.emit = (e: EmberClientEvent, data: any) => resolve([e, data as Error]);
            });
            mockedClient.makeRequest = () => {throw internalError; };
            mockedClient.finishRequest();
            const [event, error] = await responsePromise;
            expect(error).toBe(internalError);
            expect(event).toBe(EmberClientEvent.ERROR);
        });
        it('should catch error when making request and pass them to callback if defined', async () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            const internalError = new Error('internal error');
            client.on(EmberClientEvent.ERROR, () => {});
            const responsePromise = new Promise<Error>(resolve => {
                mockedClient.makeRequest = () => {
                    mockedClient._callback = (e: Error) => resolve(e);
                    throw internalError;
                };
            });
            mockedClient.finishRequest();
            const error = await responsePromise;
            expect(error).toBe(internalError);
        });
    });
    describe('getElementByPath', () => {
        it('should find an element with its identifier', async () => {
            const client = new EmberClient(options);
            const mockedClient: {[index: string]: any} = client;
            mockedClient.getDirectoryAsync = () => {};
            const IDENTIFIER = 'scoreMaster';
            client.on('error', () => {});
            client.root = EmberServer.createTreeFromJSON(jsonRoot());
            const node: Node = await client.getElementByPathAsync(IDENTIFIER) as Node;
            expect(node).toBeDefined();
            expect(node.contents.identifier).toBe(IDENTIFIER);
        });
    });
    describe('Subcribe', () => {
        let server: EmberServer;
        beforeEach(async () => {
            const root: TreeNode = EmberServer.createTreeFromJSON(jsonRoot());
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
                return await server.closeAsync();
            }
        });

        it('should auto subscribe with getDirectory and receive update', async () => {
            const client1 = new EmberClient(options);
            const client2 = new EmberClient(options);
            const VALUE = 'new company';
            client1.on('error', () => {
                // ignore
            });
            client2.on('error', () => {
                // ignore
            });

            await client1.connectAsync();
            await client2.connectAsync();
            const param: Parameter = await client2.getElementByPathAsync('0.0.1') as Parameter;

            const updatePromise = new Promise<Parameter>(async (resolve) => {
                const updateCB = (node: TreeNode) => {
                    resolve(node as Parameter);
                };
                await client1.getElementByPathAsync('0.0.1', updateCB);
                await client2.setValueAsync(param, VALUE);
            });

            const receivedUpdate = await updatePromise;
            expect(receivedUpdate).toBeDefined();
            expect(receivedUpdate?.value).toBe(VALUE);
            await client1.disconnectAsync();
            await client2.disconnectAsync();
        });
    });
});
