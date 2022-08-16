import { EmberServer, EmberServerEvent, EmberServerOptions } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { S101Socket } from '../socket/s101.socket';
import { LoggingService, LogLevel, LogEventConstructor, LoggingEvent } from '../logging/logging.service';
import { InvalidRequestFormatError, InvalidCommandError, MissingElementNumberError } from '../error/errors';
import { EmberClient, EmberClientOptions } from '../client/ember-client';
import { NodeHandlers } from './node.handlers';
import { TreeNode } from '../common/tree-node';
import { Parameter } from '../common/parameter';
import { ParameterType, parameterTypeFromString } from '../common/parameter-type';
import { FunctionArgument } from '../common/function/function-argument';
import { Function } from '../common/function/function';
import { MatrixConnection } from '../common/matrix/matrix-connection';
import { COMMAND_GETDIRECTORY } from '../common/constants';
import { Command } from '../common/command';
import { MatrixNode } from '../common/matrix/matrix-node';
import { ClientRequest } from './client-request';
import { Node } from '../common/node';
import { Invocation } from '../common/invocation';
import { QualifiedNode } from '../common/qualified-node';
import { QualifiedParameter } from '../common/qualified-parameter';
import { Socket } from 'net';

function myWriter(str: string | Uint8Array, encoding?: string, cb?: (err?: Error) => void): boolean;
function myWriter(buffer: string | Uint8Array, cb?: (err?: Error) => void): boolean;
function myWriter(x: Uint8Array): boolean {
    return true;
}
const tcpSocket = new Socket();
tcpSocket.write = myWriter;

const LOCALHOST = '127.0.0.1';
const PORT = 9009;
const options: EmberClientOptions = {host: LOCALHOST, port: PORT};

describe('Handlers', () => {
    let jsonTree;
    let server: EmberServer;
    let mockedServer: {[index: string]: any};
    let nodeHandlers: NodeHandlers;
    beforeEach(() => {
        jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions: EmberServerOptions = {
            host: LOCALHOST, port: PORT, tree: root, logger: new LoggingService(LogLevel.critical)
        };
        server = new EmberServer(serverOptions);
        mockedServer = server;
        nodeHandlers = new NodeHandlers(mockedServer.toServerInterface(), mockedServer.logger);
        server.on('error', () => {
            // ignore
        });
        server.on('clientError', () => {
            // ignore
        });
    });

    it('should through an error if can\'t process request', () => {
        const root = new TreeNode();
        root.addElement(new Node(0));
        let error: Error;
        const errorHandler = (e: Error) => {
            error = e;
        };
        server.on('error', errorHandler);
        const client = new S101Socket();
        mockedServer.handleRoot(client, root);
        expect(error instanceof InvalidRequestFormatError);
    });

    it('should ignore empty or null tree', () => {
        const root = new TreeNode();
        let error: Error;
        try {
            mockedServer.handleRoot(null, root);
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeDefined();
    });

    it('should generate responses which include children', () => {
        const node = server.tree.getElementByNumber(0) as TreeNode;
        mockedServer.createResponse(node);
        expect(node.getChildren().length > 0).toBeTruthy();
    });

    it('should update parameter value if new parameter value received', () => {
        const root = new TreeNode();
        const VALUE = '3.4.5';
        const parameter = new Parameter(2, parameterTypeFromString('string'), VALUE);
        const node = new Node(0);
        root.addElement(node);
        node.addChild(new Node(0));
        root.getElementByPath('0.0').addChild(parameter);
        const client = new S101Socket();
        mockedServer.handleRoot(client, root);
        const res = server.tree.getElementByPath('0.0.2') as Parameter;
        expect(res.contents.value).toBe(VALUE);
    });

    it('should throw an error if element not found during request process', () => {
        const root = new TreeNode();
        const VALUE = '3.4.5';
        const parameter = new Parameter(99, parameterTypeFromString('string'), VALUE);
        const node = new Node(0);
        root.addElement(node);
        node.addChild(new Node(0));
        root.getElementByPath('0.0').addChild(parameter);
        const client = new S101Socket();
        let count = 0;
        mockedServer.handleError = () => {
            count++;
        };
        nodeHandlers = new NodeHandlers(mockedServer.toServerInterface(), mockedServer.logger);
        nodeHandlers.handleRoot(client, root);
        expect(count).toBe(1);
    });

    it('should throw an error if element contains null child', () => {
        const root = new TreeNode();
        const node = new Node(0);
        root.addElement(node);
        node.elements = new Map();
        node.elements.set(0, null);
        const client = new S101Socket();
        let count = 0;
        mockedServer.handleError = () => {
            count++;
        };
        nodeHandlers = new NodeHandlers(mockedServer.toServerInterface(), mockedServer.logger);
        nodeHandlers.handleRoot(client, root);
        expect(count).toBe(1);
    });

    it('should handle commands embedded in Node', () => {
        const root = new TreeNode();
        const node = new Node(0);
        root.addElement(node);
        node.elements = new Map();
        node.elements.set(COMMAND_GETDIRECTORY, new Command(COMMAND_GETDIRECTORY));
        const client = new S101Socket();
        let count = 0;
        mockedServer._handlers.handleCommand = () => {
            count++;
        };
        mockedServer._handlers.handleRoot(client, root);
        expect(count).toBe(1);
    });

    it('should catch unknown commands', () => {
        const command = new Command(99);
        let error: Error = null;
        const errorHandler = (e: Error) => {
            error = e;
        };
        server.on(EmberServerEvent.ERROR, errorHandler);
        const root = new TreeNode();
        root.addElement(command);
        nodeHandlers.handleRoot(null, root);
        expect(error instanceof InvalidCommandError);
        server.off(EmberServerEvent.ERROR, errorHandler);
    });

    it('should catch invalid node with no number', () => {
        const node = new Node(99);
        (node as {[index: string]: any}).setNumber(null);
        let error: Error = null;
        const errorHandler = (e: Error) => {
            error = e;
        };
        const root = new TreeNode();
        root.addElement(node);
        nodeHandlers.handleRoot(null, root);
        expect(error instanceof MissingElementNumberError);
        server.off(EmberServerEvent.ERROR, errorHandler);
    });

    it('should handle matrix connections embedded in Node', () => {
        const root = new TreeNode();
        const node = new Node(0);
        root.addElement(node);
        const matrix = new MatrixNode(0);
        matrix.connections = [
            new MatrixConnection(0)
        ];
        node.elements = new Map();
        node.elements.set(0, matrix);

        const client = new S101Socket(tcpSocket);
        (client as {[index: string]: any})._clearTimers();
        let count = 0;
        mockedServer._handlers.handleMatrixConnections = () => {
            count++;
        };
        mockedServer.handleRoot(client, root);
        expect(count).toBe(1);
    });

    it('should catch function invocation errors and set success to false', () => {
        const client = new EmberClient(options);
        return server.listen()
            .then(() => client.connectAsync())
            .then(() => {
                const root = new TreeNode();
                const func = new Function(0, () => { throw Error('function error'); });
                root.addElement(func);
                (<any>server)._tree = root; // Trick server getter is protected and server tree setter does not exist
                return client.invokeFunctionAsync(func, []);
            })
            .then(result => {
                expect(result).toBeDefined();
                expect(result.success).toBeFalsy();
            })
            .then(() => client.disconnectAsync())
            .then(() => server.closeAsync());
    });

    it('should catch invoke to non function', () => {
        const client = new ClientRequest(new S101Socket(), null);
        let response: TreeNode;
        client.socket.queueMessage = (res: any) => {
            response = res;
        };
        const root = new TreeNode();
        const invocation = new Invocation(0, [new FunctionArgument(ParameterType.string, 'value')]);
        const func = new Function(0, (args: FunctionArgument[]) => args);
        root.addElement(func);
        (<any>(<any>nodeHandlers).server)._tree = root;     // Trick server getter is protected and server tree setter does not exist
        nodeHandlers.handleInvoke(client, invocation, func);
        expect(response).toBeDefined();
        const result = response.getResult();
        expect(result.success).toBeTruthy();
    });

    it('should handle error properly and send a response to client', async () => {
        const client = new ClientRequest(new S101Socket(), null);
        let response: TreeNode;
        client.socket.queueMessage = (msg: TreeNode) => {
            response = msg;
        };
        mockedServer.handleError(client, new Error('internal error'));
        expect(response).toBeDefined();
    });

    it('should handleQualifiedNode', () => {
        let count = 0;
        mockedServer._handlers.server.handleError = () => {
            count++;
        };
        const res = mockedServer._handlers.handleQualifiedNode(null, new QualifiedNode('1.2.3'));
        expect(res).toBe('');
        expect(count).toBe(1);
    });

    it('should handleQualifiedNode and ignore non-command', () => {
        let logMessage: LoggingEvent;
        mockedServer._handlers.logger.log = (msg: LogEventConstructor) => {
            logMessage = msg.createLog();
        };
        const node = new QualifiedNode('0.1');
        node.addChild(new Node(1001));
        const res = mockedServer._handlers.handleQualifiedNode(null, node);
        expect(res).toBe('0.1');
        expect(logMessage.type).toBe('INVALID_EMBER_NODE');
    });

    it('should handleQualifiedNode and call handleQualifiedParameter if QualifiedParameter', () => {
        let count = 0;
        mockedServer._handlers.server.setValue = () => {
            count++;
        };
        const node = new QualifiedParameter('0.1.1001.0', ParameterType.integer, 100);
        const socket = new S101Socket(tcpSocket);
        (socket as {[index: string]: any})._clearTimers();
        mockedServer._handlers.handleQualifiedNode(new ClientRequest(socket, null), node);
        expect(count).toBe(1);

        mockedServer._handlers.handleQualifiedNode(new ClientRequest(socket, null), new QualifiedParameter('0.1.1001.0'));
        expect(count).toBe(1);
    });
});
