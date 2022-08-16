
import { init as jsonRoot, testErrorReturned, testErrorReturnedAsync} from '../fixture/utils';
import { EmberClient, EmberClientOptions } from './ember-client';
import { EmberServer, EmberServerEvent, EmberServerOptions } from '../server/ember-server';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { TreeNode } from '../common/tree-node';
import { S101Client } from '../socket/s101.client';
import { Node } from '../common/node';
import { EmberTimeoutError, InvalidEmberNodeError, ErrorMultipleError } from '../error/errors';
import { Command } from '../common/command';
import { COMMAND_GETDIRECTORY } from '../common/constants';
import { MatrixNode } from '../common/matrix/matrix-node';
import { Label } from '../common/label';

const HOST = '127.0.0.1';
const PORT = 9014;
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

describe('getDirectory/expand', () => {
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
    it('should ignore null response and invalid response and timeout during GetDirectory operation', async () => {
        const client = new EmberClient(options);
        await testErrorReturnedAsync(
            async () => {
                client.setLogLevel(LogLevel.debug);
                await client.connectAsync();
                client.root = server.tree;
                // simulate null response
                client.timeoutValue = 10;
                socket.sendBERNode = (node: TreeNode) => {
                    socket.emit('emberTree', new Node(99));
                };
                await client.getDirectoryAsync(client.root.getElement(0) as TreeNode);
        }, EmberTimeoutError);
        return client.disconnectAsync();
    });
    it('should throw an error if tree received as no children', async () => {
        const client = new EmberClient(options);
        await testErrorReturnedAsync(
            async () => {
                await client.connectAsync();
                // simulate null response
                client.timeoutValue = 10;
                socket.sendBERNode = (node: TreeNode) => {
                    socket.emit('emberTree', new TreeNode());
                };
                await client.getDirectoryAsync();
            }, InvalidEmberNodeError);
        return client.disconnectAsync();
    });
    it('should throw an error if tree received contains a Command as a child', async () => {
        const client = new EmberClient(options);
        await testErrorReturnedAsync(
            async () => {
                await client.connectAsync();
                // simulate null response
                client.timeoutValue = 10;
                const response = new TreeNode();
                response.addElement(new Command(COMMAND_GETDIRECTORY));
                socket.sendBERNode = (node: TreeNode) => {
                    socket.emit('emberTree', response);
                };
                await client.getDirectoryAsync();
            }, InvalidEmberNodeError);
        return client.disconnectAsync();
    });
    it('should catch all errors during expand and throw a MutlipleError', async () => {
        const client: {[index: string]: any} = new EmberClient(options);
        await testErrorReturnedAsync(
            async () => {
                const expandAsync = client.expandAsync.bind(client);
                const internalError = new Error('internal error');
                let count = 0;
                client.expandAsync = (node?: TreeNode, callback?: (d: TreeNode) => void): Promise<void> => {
                    count++;
                    if (count === 3) {
                        throw internalError;
                    }
                    return expandAsync(node, callback);
                };
                await client.connectAsync();
                await client.expandAsync();
            }, ErrorMultipleError);
        return client.disconnectAsync();
    });
    it('should catch all MultipleError during expand and throw a MutlipleError', async () => {
        const client: {[index: string]: any} = new EmberClient(options);
        const internalError = new Error('internal error');
        const error: Error = await testErrorReturnedAsync(
            async () => {
                const expandAsync = client.expandAsync.bind(client);
                let count = 0;
                client.expandAsync = (node?: TreeNode, callback?: (d: TreeNode) => void): Promise<void> => {
                    count++;
                    if (count === 3) {
                        throw new ErrorMultipleError([internalError]);
                    }
                    return expandAsync(node, callback);
                };
                await client.connectAsync();
                await client.expandAsync();
        }, ErrorMultipleError);
        expect((error as ErrorMultipleError).errors[0]).toBe(internalError);
        return client.disconnectAsync();
    });
    it('should not crash on null response', async () => {
        const client = new EmberClient(options);
        let error: Error;
        client.getDirectoryAsync = (qnode?: TreeNode, callback?: (d: TreeNode) => void): Promise<TreeNode|null> => {
            return Promise.resolve(null);
        };
        await client.connectAsync();
        try {
            await client.expandAsync();
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeDefined();
        return client.disconnectAsync();
    });
    it('should stop if not children', async () => {
        const client: {[index: string]: any} = new EmberClient(options);
        client.getDirectoryAsync = (qnode?: TreeNode, callback?: (d: TreeNode) => void): Promise<TreeNode|null> => {
            return Promise.resolve(new TreeNode());
        };
        let error: Error;
        await client.connectAsync();
        try {
            await client.expandAsync();
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeDefined();
        return client.disconnectAsync();
    });
    it('should expand parametersLocation for matrix', async () => {
        const client: {[index: string]: any} = new EmberClient(options);
        let step = 0;
        let node: Node;
        const matrix = new MatrixNode(0, 'matrix1');
        matrix.parametersLocation = '0.1';
        client.root.addElement(matrix);
        client.getDirectoryAsync = (qnode?: TreeNode, callback?: (d: TreeNode) => void): Promise<TreeNode|null> => {
            step++;
            if (step === 2) {
                node = qnode as Node;
                return Promise.resolve(qnode);
            }
            return Promise.resolve(new TreeNode());
        };
        await client.expandAsync(matrix);
        expect(node).toBeDefined();
        expect(node.getPath()).toBe(matrix.parametersLocation);
    });
    it('should expand label for matrix', async () => {
        const client: {[index: string]: any} = new EmberClient(options);
        let step = 0;
        let node: Node;
        const matrix = new MatrixNode(0, 'matrix1');
        matrix.labels = [new Label('0.1', '0')];
        client.root.addElement(matrix);
        client.getDirectoryAsync = (qnode?: TreeNode, callback?: (d: TreeNode) => void): Promise<TreeNode|null> => {
            step++;
            if (step === 2) {
                node = qnode as Node;
                return Promise.resolve(qnode);
            }
            return Promise.resolve(new TreeNode());
        };
        await client.expandAsync(matrix);
        expect(node).toBeDefined();
        expect(node.getPath()).toBe(matrix.labels[0].basePath);
    });
});
