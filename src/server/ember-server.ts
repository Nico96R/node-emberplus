import { EventEmitter } from 'events';
import { S101Socket, S101SocketEvent, SocketStatsInterface } from '../socket/s101.socket';
import { S101Server, S101ServerEvent } from '../socket/s101.server';
import { ServerEvents } from './ember-server.events';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { ServerLogs } from './ember-server.logs';
import { NodeHandlers } from './node.handlers';
import { MatrixDisposition } from '../common/matrix/matrix-disposition';
import { MatrixOperation } from '../common/matrix/matrix-operation';
import { UnknownElementError, InvalidEmberNodeError, MissingElementContentsError } from '../error/errors';
import { TreeNode } from '../common/tree-node';
import { ClientRequest } from './client-request';
import { Matrix } from '../common/matrix/matrix';
import { MatrixConnection } from '../common/matrix/matrix-connection';
import { JSONParser } from './json.parser';
import { Parameter } from '../common/parameter';
import { MatrixType } from '../common/matrix/matrix-type';
import { EmberServerInterface } from './ember-server.interface';
import { Command } from '../common/command';
import { QualifiedParameter } from '../common/qualified-parameter';
import { ParameterAccess } from '../common/parameter-access';

const DEFAULT_PORT = 9000;

export interface EmberServerOptions {
        host: string;
        port?: number;
        tree: TreeNode;
        logger?: LoggingService;
}

export interface ClientInfo {
    remoteAddress: string;
    stats: SocketStatsInterface;
}

export interface ClientErrorEventData {
    remoteAddress: string;
    error: Error;
}

export enum EmberServerEvent {
    LISTENING = 'listening',
    REQUEST = 'request',
    ERROR = 'error',
    DISCONNECT = 'disconnect',
    CLIENT_ERROR = 'clientError',
    CONNECTION = 'connection',
    DISCONNECTED = 'disconnected',
    EVENT = 'event',
    MATRIX_CHANGE = 'matrix-change',
    MATRIX_CONNECT = 'matrix-connect',
    MATRIX_DISCONNECT = 'matrix-disconnect',
    VALUE_CHANGE = 'value-change'
}

export class EmberServer extends EventEmitter {

    get host(): string {
        return this._host;
    }

    get port(): number {
        return this._port;
    }

    get tree(): TreeNode {
        return this._tree;
    }

    get connectedClientsCount(): number {
        return this.clients.size;
    }

    private get logger(): LoggingService {
        return this._logger;
    }

    public static readonly TIMEOUT_MS = 2000;

    private _host: string;
    private _port: number;
    private _tree: TreeNode;
    private _logger?: LoggingService;
    private server: S101Server;
    private subscribers: { [index: string]: Set<S101Socket> };
    private clients: Set<S101Socket>;
    private _handlers: NodeHandlers;
    constructor(public options: EmberServerOptions) {
        super();
        this._host = options.host;
        this._port = options.port || DEFAULT_PORT;
        this._tree = options.tree;
        this._logger = options.logger;
        this.server = new S101Server(this._host, this._port);
        this.clients = new Set();
        this.subscribers = {};
        this._handlers = new NodeHandlers(this.toServerInterface(), this.logger);
        this.server.on('listening', () => {
            this.logger?.log(ServerLogs.LISTENING());
            this.emit(EmberServerEvent.LISTENING);
        });

        this.server.on(S101ServerEvent.CONNECTION, (client: S101Socket) => {
            this.logger?.log(ServerLogs.CONNECTION(client));
            this.clients.add(client);
            client.startDeadTimer();
            client.on(S101SocketEvent.EMBER_TREE, (root: TreeNode) => {
                this.logger?.log(ServerLogs.EMBER_REQUEST(client));
                // handleRoot is surrounded with try .. catch. It is safe.
                const path = this.handleRoot(client, root);
                this.emit(EmberServerEvent.REQUEST, { client: client.remoteAddress, root: root, path: path });
            });
            client.on(S101SocketEvent.DISCONNECTED, () => {
                this.clients.delete(client);
                this.emit(EmberServerEvent.DISCONNECT, client.remoteAddress);
                this.logger?.log(ServerLogs.DISCONNECT(client));
            });
            client.on(S101SocketEvent.ERROR, (error: Error) => {
                const info: ClientErrorEventData = { remoteAddress: client.remoteAddress, error };
                this.emit(EmberServerEvent.CLIENT_ERROR, info);
                this.logger?.log(ServerLogs.CLIENT_ERROR(client, error));
            });
            this.emit(EmberServerEvent.CONNECTION, client.remoteAddress);
        });

        // @TODO: event never emit bu the server
        this.server.on(S101ServerEvent.DISCONNECTED, () => {
            this.clients.clear();
            this.emit(EmberServerEvent.DISCONNECTED);
            this.logger?.log(ServerLogs.SERVER_DISCONNECT());
        });

        this.server.on(S101ServerEvent.ERROR, (e: Error) => {
            this.emit(EmberServerEvent.ERROR, e);
            this.logger?.log(ServerLogs.SERVER_ERROR(e));
        });
    }

    static validateMatrixOperation(matrix: Matrix, target: number, sources: number[]): void {
        if (matrix == null) {
            throw new UnknownElementError(`matrix not found`);
        }
        if (matrix.contents == null) {
            throw new MissingElementContentsError(matrix.getPath());
        }
        matrix.validateConnection(target, sources);
    }

    static doMatrixOperation(server: EmberServer, path: string, target: number, sources: number[], operation: MatrixOperation): void {
        const matrix: Matrix = server.tree.getElementByPath(path) as Matrix;

        this.validateMatrixOperation(matrix, target, sources);

        const connection = new MatrixConnection(target);
        connection.sources = sources;
        connection.operation = operation;
        server._handlers.handleMatrixConnections(new ClientRequest(null, null), matrix, [connection], false);
    }

    static createTreeFromJSON(obj: object): TreeNode {
        const tree = new TreeNode();
        JSONParser.parseObj(tree, obj);
        return tree;
    }

    getConnectedClients(): ClientInfo[] {
        const res: ClientInfo[] = [];
        for (const client of this.clients) {
            res.push({
                remoteAddress: client.remoteAddress,
                stats: client.getStats()
            });
        }
        return res;
    }

    closeAsync(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.logger?.log(ServerLogs.SERVER_CLOSING());
            const cb = (e?: Error) => {
                if (e == null) {
                    return resolve();
                }
                return reject(e);
            };
            this.server.close(cb);
            this.clients.clear();
        });
    }

    listen(): Promise<void> {
        return this.server.listen();
    }

    matrixConnect(path: string, target: number, sources: number[]): void {
        this.logger?.log(ServerLogs.MATRIX_CONNECT(path, target, sources));
        EmberServer.doMatrixOperation(this, path, target, sources, MatrixOperation.connect);
    }

    matrixDisconnect(path: string, target: number, sources: number[]): void {
        this.logger?.log(ServerLogs.MATRIX_DISCONNECT(path, target, sources));
        EmberServer.doMatrixOperation(this, path, target, sources, MatrixOperation.disconnect);
    }

    matrixSet(path: string, target: number, sources: number[]): void {
        this.logger?.log(ServerLogs.MATRIX_SET(path, target, sources));
        EmberServer.doMatrixOperation(this, path, target, sources, MatrixOperation.absolute);
    }

    preMatrixConnect(matrix: Matrix, connection: MatrixConnection,
        res: Matrix, client: ClientRequest, response: boolean): void {
        const conResult = res.connections[connection.target];
        this.logger?.log(ServerLogs.PRE_MATRIX_CONNECT(matrix, connection));

        if (matrix.contents.type !== MatrixType.nToN &&
            connection.operation !== MatrixOperation.disconnect &&
            connection.sources != null && connection.sources.length === 1) {
            if (matrix.contents.type === MatrixType.oneToOne) {
                // if the source is being used already, disconnect it from current target.
                const currentTargets = matrix.getSourceConnections(connection.sources[0]);
                if (currentTargets.length === 1 && currentTargets[0] !== connection.target) {
                    res.connections[currentTargets[0]] =
                        this.disconnectMatrixTarget(matrix, currentTargets[0], connection.sources, client, response);
                }
            }
            // if the target is connected already, disconnect it
            if (matrix.connections[connection.target].sources != null &&
                matrix.connections[connection.target].sources.length === 1) {
                if (matrix.contents.type === MatrixType.oneToN) {
                    const disconnectSource = this.getDisconnectSource(matrix, connection.target);
                    if (matrix.connections[connection.target].sources[0] === connection.sources[0]) {
                        if (disconnectSource >= 0 && disconnectSource !== connection.sources[0]) {
                            connection.sources = [disconnectSource];
                        } else {
                            // do nothing => set disposition to bypass further processing
                            conResult.disposition = MatrixDisposition.tally;
                        }
                    }
                }
                if (matrix.connections[connection.target].sources[0] !== connection.sources[0]) {
                    this.disconnectMatrixTarget(matrix, connection.target, matrix.connections[connection.target].sources, client, response);
                } else if (matrix.contents.type === MatrixType.oneToOne) {
                    // let's change the request into a disconnect
                    connection.operation = MatrixOperation.disconnect;
                }
            }
        }
    }

    setLogLevel(logLevel: LogLevel): void {
        this.logger?.setLogLevel(logLevel);
    }

    setValue(parameter: Parameter|QualifiedParameter, value: string | number | Buffer | boolean, origin?: S101Socket): Promise<void> {
        // Change the element value if write access permitted or if decided by server (origin == null).
        if (!parameter.isParameter() || parameter.contents == null
            || (origin != null && (parameter.access == null || parameter.access < ParameterAccess.readWrite))) {
            this.logger?.log(ServerLogs.INVALID_EMBER_NODE(parameter));
            return;
        }

        if (parameter.value === value) {
            this.logger?.log(ServerLogs.SET_VALUE_UNCHANGED(parameter, value));
            return;
        }

        parameter.value = value;
        this.logger?.log(ServerLogs.SET_VALUE(parameter, value));
        const res = this.createResponse(parameter);
        this.updateSubscribers(parameter.getPath(), res, origin);
        const src = origin == null || origin.socket == null ? 'local' : `${origin.socket.remoteAddress}:${origin.socket.remotePort}`;
        this.emit(EmberServerEvent.VALUE_CHANGE, parameter);
        this.generateEvent(ServerEvents.SETVALUE(parameter.contents.identifier, parameter.getPath(), src));
    }

    toJSON(): any {
        if (this.tree == null) {
            return [];
        }
        const elements = this.tree.getChildren();

        return elements.map(element => element.toJSON());
    }

    private applyMatrixConnect(matrix: Matrix, connection: MatrixConnection,
        conResult: MatrixConnection, client: ClientRequest, response: boolean): void {
        // Apply changes
        let emitType;
        if ((connection.operation == null) ||
            (connection.operation === MatrixOperation.absolute)) {
            matrix.setSources(connection.target, connection.sources);
            emitType = EmberServerEvent.MATRIX_CHANGE;
        } else if (connection.operation === MatrixOperation.connect) {
            matrix.connectSources(connection.target, connection.sources);
            emitType = EmberServerEvent.MATRIX_CONNECT;
        }
        conResult.disposition = MatrixDisposition.modified;
        if (response && emitType != null) {
            // We got a request so emit something.
            this.emit(emitType, {
                target: connection.target,
                sources: connection.sources,
                client: client?.socket?.remoteAddress
            });
        }
        this.logger?.log(ServerLogs.APPLY_MATRIX_CONNECT(matrix, connection, emitType));
    }

    private getDisconnectSource(matrix: Matrix, targetID: number): number {
        return this._handlers.getDisconnectSource(matrix, targetID);
    }

    private disconnectMatrixTarget(matrix: Matrix, targetID: number, sources: number[],
        client: ClientRequest, response: boolean): MatrixConnection {
        const disconnect = new MatrixConnection(targetID);
        this.logger?.log(ServerLogs.DISCONNECT_MATRIX_TARGET(matrix, targetID, sources));

        disconnect.setSources([]);
        disconnect.disposition = MatrixDisposition.modified;
        matrix.setSources(targetID, []);
        if (response) {
            this.emit(EmberServerEvent.MATRIX_DISCONNECT, {
                target: targetID,
                sources: sources,
                client: client?.socket?.remoteAddress
            });
        }
        return disconnect;
    }

    private disconnectSources(matrix: Matrix, target: number, sources: number[],
        client: ClientRequest, response: boolean): MatrixConnection {
        this.logger?.log(ServerLogs.DISCONNECT_SOURCES(matrix, target, sources));
        const disconnect = new MatrixConnection(target);
        disconnect.disposition = MatrixDisposition.modified;
        matrix.disconnectSources(target, sources);
        if (response) {
            this.emit(EmberServerEvent.MATRIX_DISCONNECT, {
                target: target,
                sources: sources,
                client: client?.socket?.remoteAddress
            });
        }
        return disconnect;
    }

    private applyMatrixOneToNDisconnect(matrix: Matrix, connection: MatrixConnection,
        res: Matrix, client: ClientRequest, response: boolean): void {
        const disconnectSource = this.getDisconnectSource(matrix, connection.target);
        if (matrix.connections[connection.target].sources[0] === connection.sources[0]) {
            const conResult = res.connections[connection.target];
            if (disconnectSource >= 0 && disconnectSource !== connection.sources[0]) {
                if (response) {
                    this.emit(EmberServerEvent.MATRIX_DISCONNECT, {
                        target: connection.target,
                        sources: matrix.connections[connection.target].sources,
                        client: client == null || client.socket == null ? null : client.socket.remoteAddress
                    });
                }
                matrix.setSources(connection.target, [disconnectSource]);
                conResult.disposition = MatrixDisposition.modified;
            } else {
                // do nothing
                conResult.disposition = MatrixDisposition.tally;
            }
            res.connections[connection.target] = conResult;
            this.logger?.log(ServerLogs.APPLY_ONETOONE_DISCONNECT(matrix, connection, conResult));
        }
    }

    // private replaceElement(element: TreeNode): void {
    //     const path = element.getPath();
    //     this.logger?.log(ServerLogs.REPLACE_ELEMENT(path));
    //     const existingElement = this.tree.getElementByPath(path);
    //     if (existingElement == null) {
    //         throw new UnknownElementError(path);
    //     }
    //     const parent = existingElement._parent;
    //     if (parent == null) {
    //         throw new InvalidEmberNodeError(path, 'No parent. Can\'t execute replaceElement');
    //     }
    //     // Replace the element at the parent
    //     parent.elements.set(existingElement.getNumber(), element);
    //     // point the new element to parent
    //     element._parent = parent;
    //     const res = this.createResponse(element);
    //     this.updateSubscribers(path, res);
    // }

    private generateEvent(event: ServerEvents): void {
        this.emit(EmberServerEvent.EVENT, event);
    }

    private createResponse(element: TreeNode): TreeNode {
        return element.getTreeBranch(undefined, node => {
            node.update(element);
            const children = element.getChildren();
            if (children != null) {
                for (let i = 0; i < children.length; i++) {
                    node.addChild((children[i] as TreeNode).getDuplicate());
                }
            }
        });
    }

    private createQualifiedResponse(element: TreeNode): TreeNode {
        const res = new TreeNode();
        let dup;
        if (element.isRoot() === false) {
            dup = element.toQualified();
        }
        const children = element.getChildren();
        if (children != null) {
            for (let i = 0; i < children.length; i++) {
                res.addChild((children[i] as TreeNode).toQualified().getMinimalContent());
            }
        } else {
            res.addChild(dup);
        }
        return res;
    }

    private handleError(client: ClientRequest, error: Error, node?: TreeNode| Command): void {
        this.emit(EmberServerEvent.ERROR, error);
        this.logger?.log(ServerLogs.ERROR_HANDLING(error));
        if (client != null && client.socket != null) {
            const res: TreeNode = node == null || node.isCommand() ? this.tree.getMinimal() : node as TreeNode;
            client.socket.queueMessage(res);
        }
    }

    private handleRoot(client: S101Socket, root: TreeNode): string {
        return this._handlers.handleRoot(client, root);
    }

    private subscribe(client: S101Socket, element: TreeNode): void {
        const path = element.getPath();
        if (this.subscribers[path] == null) {
            this.subscribers[path] = new Set();
        }
        this.logger?.log(ServerLogs.SUBSCRIBE(client, path));
        this.subscribers[path].add(client);
    }

    private toServerInterface(): EmberServerInterface {
        const server: EmberServerInterface = {
            tree: this.tree,
            applyMatrixConnect: this.applyMatrixConnect.bind(this),
            applyMatrixOneToNDisconnect: this.applyMatrixOneToNDisconnect.bind(this),
            disconnectMatrixTarget: this.disconnectMatrixTarget.bind(this),
            disconnectSources: this.disconnectSources.bind(this),
            emit: this.emit,
            generateEvent: this.generateEvent.bind(this),
            createResponse: this.createResponse.bind(this),
            getDisconnectSource: this.getDisconnectSource.bind(this),
            handleError: this.handleError.bind(this),
            setValue: this.setValue.bind(this),
            subscribe: this.subscribe.bind(this),
            createQualifiedResponse: this.createQualifiedResponse.bind(this),
            preMatrixConnect: this.preMatrixConnect.bind(this),
            updateSubscribers: this.updateSubscribers.bind(this),
            unsubscribe: this.unsubscribe.bind(this)
        };
        return server;
    }

    private unsubscribe(client: S101Socket, element: TreeNode): void {
        const path = element.getPath();
        if (this.subscribers[path] == null) {
            return;
        }
        this.logger?.log(ServerLogs.UNSUBSCRIBE(client, path));
        this.subscribers[path].delete(client);
    }

    private updateSubscribers(path: string, response: TreeNode, origin?: S101Socket): void {
        if (this.subscribers[path] == null) {
            return;
        }

        for (const client of this.subscribers[path]) {
            if (client === origin) {
                continue; // already sent the response to origin
            }
            if (this.clients.has(client) && client.isConnected()) {
                this.logger?.log(ServerLogs.UPDATE_SUBSCRIBERS(client, path));
                try {
                    client.queueMessage(response);
                } catch (e) {
                    this.logger?.log(ServerLogs.UPDATE_SUBSCRIBERS_WARN(client, path));
                }
            } else {
                // clean up subscribers - client is gone
                this.logger?.log(ServerLogs.UPDATE_SUBSCRIBERS_WARN(client, path));
                this.subscribers[path].delete(client);
            }
        }
    }
}
