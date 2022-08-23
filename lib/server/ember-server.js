"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const s101_socket_1 = require("../socket/s101.socket");
const s101_server_1 = require("../socket/s101.server");
const ember_server_events_1 = require("./ember-server.events");
const ember_server_logs_1 = require("./ember-server.logs");
const node_handlers_1 = require("./node.handlers");
const matrix_disposition_1 = require("../common/matrix/matrix-disposition");
const matrix_operation_1 = require("../common/matrix/matrix-operation");
const errors_1 = require("../error/errors");
const tree_node_1 = require("../common/tree-node");
const client_request_1 = require("./client-request");
const matrix_connection_1 = require("../common/matrix/matrix-connection");
const json_parser_1 = require("./json.parser");
const matrix_type_1 = require("../common/matrix/matrix-type");
const parameter_access_1 = require("../common/parameter-access");
const DEFAULT_PORT = 9000;
var EmberServerEvent;
(function (EmberServerEvent) {
    EmberServerEvent["LISTENING"] = "listening";
    EmberServerEvent["REQUEST"] = "request";
    EmberServerEvent["ERROR"] = "error";
    EmberServerEvent["DISCONNECT"] = "disconnect";
    EmberServerEvent["CLIENT_ERROR"] = "clientError";
    EmberServerEvent["CONNECTION"] = "connection";
    EmberServerEvent["DISCONNECTED"] = "disconnected";
    EmberServerEvent["EVENT"] = "event";
    EmberServerEvent["MATRIX_CHANGE"] = "matrix-change";
    EmberServerEvent["MATRIX_CONNECT"] = "matrix-connect";
    EmberServerEvent["MATRIX_DISCONNECT"] = "matrix-disconnect";
    EmberServerEvent["VALUE_CHANGE"] = "value-change";
})(EmberServerEvent = exports.EmberServerEvent || (exports.EmberServerEvent = {}));
class EmberServer extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this._host = options.host;
        this._port = options.port || DEFAULT_PORT;
        this._tree = options.tree;
        this._logger = options.logger;
        this.server = new s101_server_1.S101Server(this._host, this._port);
        this.clients = new Set();
        this.subscribers = {};
        this._handlers = new node_handlers_1.NodeHandlers(this.toServerInterface(), this.logger);
        this.server.on('listening', () => {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.LISTENING());
            this.emit(EmberServerEvent.LISTENING);
        });
        this.server.on(s101_server_1.S101ServerEvent.CONNECTION, (client) => {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.CONNECTION(client));
            this.clients.add(client);
            client.startDeadTimer();
            client.on(s101_socket_1.S101SocketEvent.EMBER_TREE, (root) => {
                var _a;
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.EMBER_REQUEST(client));
                const path = this.handleRoot(client, root);
                this.emit(EmberServerEvent.REQUEST, { client: client.remoteAddress, root: root, path: path });
            });
            client.on(s101_socket_1.S101SocketEvent.DISCONNECTED, () => {
                var _a;
                this.clients.delete(client);
                this.emit(EmberServerEvent.DISCONNECT, client.remoteAddress);
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.DISCONNECT(client));
            });
            client.on(s101_socket_1.S101SocketEvent.ERROR, (error) => {
                var _a;
                const info = { remoteAddress: client.remoteAddress, error };
                this.emit(EmberServerEvent.CLIENT_ERROR, info);
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.CLIENT_ERROR(client, error));
            });
            this.emit(EmberServerEvent.CONNECTION, client.remoteAddress);
        });
        this.server.on(s101_server_1.S101ServerEvent.DISCONNECTED, () => {
            var _a;
            this.clients.clear();
            this.emit(EmberServerEvent.DISCONNECTED);
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.SERVER_DISCONNECT());
        });
        this.server.on(s101_server_1.S101ServerEvent.ERROR, (e) => {
            var _a;
            this.emit(EmberServerEvent.ERROR, e);
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.SERVER_ERROR(e));
        });
    }
    get host() {
        return this._host;
    }
    get port() {
        return this._port;
    }
    get tree() {
        return this._tree;
    }
    get connectedClientsCount() {
        return this.clients.size;
    }
    get logger() {
        return this._logger;
    }
    static validateMatrixOperation(matrix, target, sources) {
        if (matrix == null) {
            throw new errors_1.UnknownElementError(`matrix not found`);
        }
        if (matrix.contents == null) {
            throw new errors_1.MissingElementContentsError(matrix.getPath());
        }
        matrix.validateConnection(target, sources);
    }
    static doMatrixOperation(server, path, target, sources, operation) {
        const matrix = server.tree.getElementByPath(path);
        this.validateMatrixOperation(matrix, target, sources);
        const connection = new matrix_connection_1.MatrixConnection(target);
        connection.sources = sources;
        connection.operation = operation;
        server._handlers.handleMatrixConnections(new client_request_1.ClientRequest(null, null), matrix, [connection], false);
    }
    static createTreeFromJSON(obj) {
        const tree = new tree_node_1.TreeNode();
        json_parser_1.JSONParser.parseObj(tree, obj);
        return tree;
    }
    getConnectedClients() {
        const res = [];
        for (const client of this.clients) {
            res.push({
                remoteAddress: client.remoteAddress,
                stats: client.getStats()
            });
        }
        return res;
    }
    closeAsync() {
        return new Promise((resolve, reject) => {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.SERVER_CLOSING());
            const cb = (e) => {
                if (e == null) {
                    return resolve();
                }
                return reject(e);
            };
            this.server.close(cb);
            this.clients.clear();
        });
    }
    listen() {
        return this.server.listen();
    }
    matrixConnect(path, target, sources) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.MATRIX_CONNECT(path, target, sources));
        EmberServer.doMatrixOperation(this, path, target, sources, matrix_operation_1.MatrixOperation.connect);
    }
    matrixDisconnect(path, target, sources) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.MATRIX_DISCONNECT(path, target, sources));
        EmberServer.doMatrixOperation(this, path, target, sources, matrix_operation_1.MatrixOperation.disconnect);
    }
    matrixSet(path, target, sources) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.MATRIX_SET(path, target, sources));
        EmberServer.doMatrixOperation(this, path, target, sources, matrix_operation_1.MatrixOperation.absolute);
    }
    preMatrixConnect(matrix, connection, res, client, response) {
        var _a;
        const conResult = res.connections[connection.target];
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.PRE_MATRIX_CONNECT(matrix, connection));
        if (matrix.contents.type !== matrix_type_1.MatrixType.nToN &&
            connection.operation !== matrix_operation_1.MatrixOperation.disconnect &&
            connection.sources != null && connection.sources.length === 1) {
            if (matrix.contents.type === matrix_type_1.MatrixType.oneToOne) {
                const currentTargets = matrix.getSourceConnections(connection.sources[0]);
                if (currentTargets.length === 1 && currentTargets[0] !== connection.target) {
                    res.connections[currentTargets[0]] =
                        this.disconnectMatrixTarget(matrix, currentTargets[0], connection.sources, client, response);
                }
            }
            if (matrix.connections[connection.target].sources != null &&
                matrix.connections[connection.target].sources.length === 1) {
                if (matrix.contents.type === matrix_type_1.MatrixType.oneToN) {
                    const disconnectSource = this.getDisconnectSource(matrix, connection.target);
                    if (matrix.connections[connection.target].sources[0] === connection.sources[0]) {
                        if (disconnectSource >= 0 && disconnectSource !== connection.sources[0]) {
                            connection.sources = [disconnectSource];
                        }
                        else {
                            conResult.disposition = matrix_disposition_1.MatrixDisposition.tally;
                        }
                    }
                }
                if (matrix.connections[connection.target].sources[0] !== connection.sources[0]) {
                    this.disconnectMatrixTarget(matrix, connection.target, matrix.connections[connection.target].sources, client, response);
                }
                else if (matrix.contents.type === matrix_type_1.MatrixType.oneToOne) {
                    connection.operation = matrix_operation_1.MatrixOperation.disconnect;
                }
            }
        }
    }
    setLogLevel(logLevel) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.setLogLevel(logLevel);
    }
    setValue(parameter, value, origin) {
        var _a, _b, _c;
        if (!parameter.isParameter() || parameter.contents == null
            || (origin != null && (parameter.access == null || parameter.access < parameter_access_1.ParameterAccess.readWrite))) {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.INVALID_EMBER_NODE(parameter));
            return;
        }
        if (parameter.value === value) {
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_server_logs_1.ServerLogs.SET_VALUE_UNCHANGED(parameter, value));
            return;
        }
        parameter.value = value;
        (_c = this.logger) === null || _c === void 0 ? void 0 : _c.log(ember_server_logs_1.ServerLogs.SET_VALUE(parameter, value));
        const res = this.createResponse(parameter);
        this.updateSubscribers(parameter.getPath(), res, origin);
        const src = origin == null || origin.socket == null ? 'local' : `${origin.socket.remoteAddress}:${origin.socket.remotePort}`;
        this.emit(EmberServerEvent.VALUE_CHANGE, parameter);
        this.generateEvent(ember_server_events_1.ServerEvents.SETVALUE(parameter.contents.identifier, parameter.getPath(), src));
    }
    toJSON() {
        if (this.tree == null) {
            return [];
        }
        const elements = this.tree.getChildren();
        return elements.map(element => element.toJSON());
    }
    applyMatrixConnect(matrix, connection, conResult, client, response) {
        var _a, _b, _c;
        let emitType;
        if ((connection.operation == null) ||
            (connection.operation === matrix_operation_1.MatrixOperation.absolute)) {
            matrix.setSources(connection.target, connection.sources);
            emitType = EmberServerEvent.MATRIX_CHANGE;
        }
        else if (connection.operation === matrix_operation_1.MatrixOperation.connect) {
            matrix.connectSources(connection.target, connection.sources);
            emitType = EmberServerEvent.MATRIX_CONNECT;
        }
        conResult.disposition = matrix_disposition_1.MatrixDisposition.modified;
        if (response && emitType != null) {
            this.emit(emitType, {
                target: connection.target,
                sources: connection.sources,
                client: (_b = (_a = client) === null || _a === void 0 ? void 0 : _a.socket) === null || _b === void 0 ? void 0 : _b.remoteAddress
            });
        }
        (_c = this.logger) === null || _c === void 0 ? void 0 : _c.log(ember_server_logs_1.ServerLogs.APPLY_MATRIX_CONNECT(matrix, connection, emitType));
    }
    getDisconnectSource(matrix, targetID) {
        return this._handlers.getDisconnectSource(matrix, targetID);
    }
    disconnectMatrixTarget(matrix, targetID, sources, client, response) {
        var _a, _b, _c;
        const disconnect = new matrix_connection_1.MatrixConnection(targetID);
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.DISCONNECT_MATRIX_TARGET(matrix, targetID, sources));
        disconnect.setSources([]);
        disconnect.disposition = matrix_disposition_1.MatrixDisposition.modified;
        matrix.setSources(targetID, []);
        if (response) {
            this.emit(EmberServerEvent.MATRIX_DISCONNECT, {
                target: targetID,
                sources: sources,
                client: (_c = (_b = client) === null || _b === void 0 ? void 0 : _b.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress
            });
        }
        return disconnect;
    }
    disconnectSources(matrix, target, sources, client, response) {
        var _a, _b, _c;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.DISCONNECT_SOURCES(matrix, target, sources));
        const disconnect = new matrix_connection_1.MatrixConnection(target);
        disconnect.disposition = matrix_disposition_1.MatrixDisposition.modified;
        matrix.disconnectSources(target, sources);
        if (response) {
            this.emit(EmberServerEvent.MATRIX_DISCONNECT, {
                target: target,
                sources: sources,
                client: (_c = (_b = client) === null || _b === void 0 ? void 0 : _b.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress
            });
        }
        return disconnect;
    }
    applyMatrixOneToNDisconnect(matrix, connection, res, client, response) {
        var _a;
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
                conResult.disposition = matrix_disposition_1.MatrixDisposition.modified;
            }
            else {
                conResult.disposition = matrix_disposition_1.MatrixDisposition.tally;
            }
            res.connections[connection.target] = conResult;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.APPLY_ONETOONE_DISCONNECT(matrix, connection, conResult));
        }
    }
    generateEvent(event) {
        this.emit(EmberServerEvent.EVENT, event);
    }
    createResponse(element) {
        return element.getTreeBranch(undefined, node => {
            node.update(element);
            const children = element.getChildren();
            if (children != null) {
                for (let i = 0; i < children.length; i++) {
                    node.addChild(children[i].getDuplicate());
                }
            }
        });
    }
    createQualifiedResponse(element) {
        const res = new tree_node_1.TreeNode();
        let dup;
        if (element.isRoot() === false) {
            dup = element.toQualified();
        }
        const children = element.getChildren();
        if (children != null) {
            for (let i = 0; i < children.length; i++) {
                res.addChild(children[i].toQualified().getMinimalContent());
            }
        }
        else {
            res.addChild(dup);
        }
        return res;
    }
    handleError(client, error, node) {
        var _a;
        this.emit(EmberServerEvent.ERROR, error);
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.ERROR_HANDLING(error));
        if (client != null && client.socket != null) {
            const res = node == null || node.isCommand() ? this.tree.getMinimal() : node;
            client.socket.queueMessage(res);
        }
    }
    handleRoot(client, root) {
        return this._handlers.handleRoot(client, root);
    }
    subscribe(client, element) {
        var _a;
        const path = element.getPath();
        if (this.subscribers[path] == null) {
            this.subscribers[path] = new Set();
        }
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.SUBSCRIBE(client, path));
        this.subscribers[path].add(client);
    }
    toServerInterface() {
        const server = {
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
    unsubscribe(client, element) {
        var _a;
        const path = element.getPath();
        if (this.subscribers[path] == null) {
            return;
        }
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.UNSUBSCRIBE(client, path));
        this.subscribers[path].delete(client);
    }
    updateSubscribers(path, response, origin) {
        var _a, _b, _c;
        if (this.subscribers[path] == null) {
            return;
        }
        for (const client of this.subscribers[path]) {
            if (client === origin) {
                continue;
            }
            if (this.clients.has(client) && client.isConnected()) {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.UPDATE_SUBSCRIBERS(client, path));
                try {
                    client.queueMessage(response);
                }
                catch (e) {
                    (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_server_logs_1.ServerLogs.UPDATE_SUBSCRIBERS_WARN(client, path));
                }
            }
            else {
                (_c = this.logger) === null || _c === void 0 ? void 0 : _c.log(ember_server_logs_1.ServerLogs.UPDATE_SUBSCRIBERS_WARN(client, path));
                this.subscribers[path].delete(client);
            }
        }
    }
}
exports.EmberServer = EmberServer;
EmberServer.TIMEOUT_MS = 2000;
//# sourceMappingURL=ember-server.js.map