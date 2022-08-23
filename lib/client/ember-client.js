"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const s101_client_1 = require("../socket/s101.client");
const BER = __importStar(require("../ber"));
const ember_client_request_1 = require("./ember-client.request");
const s101_client_2 = require("../socket/s101.client");
const ember_client_events_1 = require("./ember-client.events");
const errors_1 = require("../error/errors");
const tree_node_1 = require("../common/tree-node");
const invocation_result_1 = require("../common/invocation-result");
const matrix_operation_1 = require("../common/matrix/matrix-operation");
const matrix_connection_1 = require("../common/matrix/matrix-connection");
const stream_collection_1 = require("../common/stream/stream-collection");
const stream_entry_1 = require("../common/stream/stream-entry");
const ember_client_logs_1 = require("./ember-client-logs");
const parameter_contents_1 = require("../common/parameter-contents");
const common_1 = require("../common/common");
exports.DEFAULT_PORT = 9000;
exports.DEFAULT_TIMEOUT = 3000;
class EmberClient extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.timeoutValue = options.timeoutValue || exports.DEFAULT_TIMEOUT;
        this._host = options.host;
        this._port = options.port || exports.DEFAULT_PORT;
        this._logger = options.logger;
        this._pendingRequests = [];
        this._activeRequest = null;
        this._timeout = null;
        this._callback = undefined;
        this._requestID = 0;
        this._streams = new stream_collection_1.StreamCollection();
        this.root = new tree_node_1.TreeNode();
        this.socket = new s101_client_1.S101Client(this._host, this._port);
        this.socket.on(s101_client_2.S101ClientEvent.CONNECTING, () => {
            this.emit(ember_client_events_1.EmberClientEvent.CONNECTING);
        });
        this.socket.on(s101_client_2.S101ClientEvent.CONNECTED, () => {
            this.emit(ember_client_events_1.EmberClientEvent.CONNECTED);
            this.socket.startDeadTimer();
            if (this._callback != null) {
                this._callback();
            }
        });
        this.socket.on(s101_client_2.S101ClientEvent.DISCONNECTED, () => {
            this.emit(ember_client_events_1.EmberClientEvent.DISCONNECTED);
        });
        this.socket.on(s101_client_2.S101ClientEvent.ERROR, e => {
            if (this._callback != null) {
                this._callback(e);
            }
            this.emit(ember_client_events_1.EmberClientEvent.ERROR, e);
        });
        this.socket.on(s101_client_2.S101ClientEvent.EMBER_TREE, root => {
            var _a;
            try {
                if (root instanceof invocation_result_1.InvocationResult) {
                    this.emit(ember_client_events_1.EmberClientEvent.INVOCATION_RESULT, root);
                    if (this._callback) {
                        this._callback(undefined, root);
                    }
                }
                else if (root instanceof tree_node_1.TreeNode) {
                    this.handleRoot(root);
                }
            }
            catch (e) {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.INVALID_EMBER_MESSAGE_RECEIVED(e));
                if (this._callback) {
                    this._callback(e);
                }
            }
        });
    }
    get logger() {
        return this._logger;
    }
    static isDirectSubPathOf(path, parent) {
        return path === parent || (path.lastIndexOf('.') === parent.length && path.startsWith(parent));
    }
    connectAsync(timeout = 2) {
        return new Promise((resolve, reject) => {
            var _a;
            this._callback = e => {
                var _a, _b;
                this._callback = undefined;
                if (e === undefined) {
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.CONNECTED(this.socket.remoteAddress));
                    return resolve();
                }
                (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_client_logs_1.ClientLogs.CONNECTION_FAILED(this.socket.remoteAddress, e));
                return reject(e);
            };
            if (this.socket.isConnected()) {
                throw new errors_1.S101SocketError('Already connected');
            }
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.CONNECTING(`${this._host}:${this._port}`));
            this.socket.connect(timeout);
        });
    }
    disconnectAsync() {
        var _a;
        if (this.isConnected()) {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.DISCONNECTING(this.socket.remoteAddress));
            return this.socket.disconnectAsync();
        }
        return Promise.resolve();
    }
    expandAsync(node, callback) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.EXPANDING_NODE(node));
            let errors = [];
            if ((_b = node) === null || _b === void 0 ? void 0 : _b.isTemplate()) {
                (_c = this.logger) === null || _c === void 0 ? void 0 : _c.log(ember_client_logs_1.ClientLogs.EXPAND_NODE_COMPLETE(node));
                return;
            }
            if (node != null && (node.isParameter() || node.isMatrix() || node.isFunction())) {
                yield this.getDirectoryAsync(node, callback);
                if (node.isMatrix()) {
                    const matrix = node;
                    if (matrix.parametersLocation) {
                        let paramRoot = common_1.createTreeBranch(this.root, matrix.parametersLocation);
                        yield this.getDirectoryAsync(paramRoot, callback);
                        paramRoot = this.root.getElementByPath(matrix.parametersLocation);
                        try {
                            yield this.expandAsync(paramRoot, callback);
                        }
                        catch (e) {
                            if (e instanceof errors_1.ErrorMultipleError) {
                                errors = errors.concat(e.errors);
                            }
                            else {
                                (_d = this.logger) === null || _d === void 0 ? void 0 : _d.log(ember_client_logs_1.ClientLogs.EXPAND_NODE_ERROR(paramRoot, e));
                                errors.push(e);
                            }
                        }
                    }
                    if (matrix.labels != null) {
                        for (const label of matrix.labels) {
                            let labelRoot = common_1.createTreeBranch(this.root, label.basePath);
                            yield this.getDirectoryAsync(labelRoot, callback);
                            labelRoot = this.root.getElementByPath(label.basePath);
                            labelRoot = labelRoot.toQualified();
                            yield this.expandAsync(labelRoot, callback);
                        }
                    }
                }
                return;
            }
            const res = yield this.getDirectoryAsync(node, callback);
            if (res == null) {
                (_e = this.logger) === null || _e === void 0 ? void 0 : _e.log(ember_client_logs_1.ClientLogs.EXPAND_WITH_NO_CHILD(node));
                return;
            }
            const children = (_f = res) === null || _f === void 0 ? void 0 : _f.getChildren();
            if (children == null) {
                (_g = this.logger) === null || _g === void 0 ? void 0 : _g.log(ember_client_logs_1.ClientLogs.EXPAND_WITH_NO_CHILD(node));
                return;
            }
            for (const child of children) {
                try {
                    yield this.expandAsync(child, callback);
                }
                catch (e) {
                    if (e instanceof errors_1.ErrorMultipleError) {
                        errors = errors.concat(e.errors);
                    }
                    else {
                        (_h = this.logger) === null || _h === void 0 ? void 0 : _h.log(ember_client_logs_1.ClientLogs.EXPAND_NODE_ERROR(child, e));
                        errors.push(e);
                    }
                }
            }
            (_j = this.logger) === null || _j === void 0 ? void 0 : _j.log(ember_client_logs_1.ClientLogs.EXPAND_NODE_COMPLETE(node));
            if (errors.length > 0) {
                throw new errors_1.ErrorMultipleError(errors);
            }
        });
    }
    getDirectoryAsync(qNode, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (qNode == null) {
                this.root.clear();
                qNode = this.root;
            }
            const response = yield this.makeRequestAsync(() => {
                var _a;
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.GETDIRECTORY_SENDING_QUERY(qNode));
                const data = qNode.getDirectory(callback);
                this.socket.sendBERNode(qNode.getDirectory(callback));
            }, (err, node) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                const requestedPath = qNode.getPath();
                if (err) {
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.GETDIRECTORY_ERROR(err));
                    throw err;
                }
                if (!qNode.isQualified() && qNode.isRoot()) {
                    const elements = qNode.getChildren();
                    if (elements == null || elements.length === 0) {
                        throw new errors_1.InvalidEmberResponseError('Get root directory');
                    }
                    const nodeElements = (_b = node) === null || _b === void 0 ? void 0 : _b.getChildren();
                    if (nodeElements != null
                        && nodeElements.every((el) => el._parent instanceof tree_node_1.TreeNode)) {
                        (_c = this.logger) === null || _c === void 0 ? void 0 : _c.log(ember_client_logs_1.ClientLogs.GETDIRECTORY_RESPONSE(node));
                        return node;
                    }
                    else {
                        throw new errors_1.InvalidEmberResponseError(`getDirectory ${requestedPath}`);
                    }
                }
                else if (node.getElementByPath(requestedPath) != null) {
                    (_d = this.logger) === null || _d === void 0 ? void 0 : _d.log(ember_client_logs_1.ClientLogs.GETDIRECTORY_RESPONSE(node));
                    if (node.isStream()) {
                        const streamIdentifier = node.streamIdentifier;
                        const streamEntry = this._streams.getEntry(streamIdentifier);
                        if (streamEntry != null && streamEntry.value !== requestedPath) {
                            (_e = this.logger) === null || _e === void 0 ? void 0 : _e.log(ember_client_logs_1.ClientLogs.DUPLICATE_STREAM_IDENTIFIER(streamIdentifier, requestedPath, streamEntry.value));
                        }
                        else {
                            (_f = this.logger) === null || _f === void 0 ? void 0 : _f.log(ember_client_logs_1.ClientLogs.ADDING_STREAM_IDENTIFIER(streamIdentifier, requestedPath));
                            this._streams.addEntry(new stream_entry_1.StreamEntry(streamIdentifier, requestedPath));
                        }
                    }
                    return node;
                }
                else {
                    const nodeElements = (_g = node) === null || _g === void 0 ? void 0 : _g.getChildren();
                    if (nodeElements != null &&
                        ((qNode.isMatrix() &&
                            nodeElements.length === 1 &&
                            nodeElements[0].getPath() === requestedPath) ||
                            (!qNode.isMatrix() &&
                                nodeElements.every((el) => EmberClient.isDirectSubPathOf(el.getPath(), requestedPath))))) {
                        (_h = this.logger) === null || _h === void 0 ? void 0 : _h.log(ember_client_logs_1.ClientLogs.GETDIRECTORY_RESPONSE(node));
                        return node;
                    }
                    else {
                        (_j = this.logger) === null || _j === void 0 ? void 0 : _j.log(ember_client_logs_1.ClientLogs.GETDIRECTORY_UNEXPECTED_RESPONSE(qNode, node));
                        return undefined;
                    }
                }
            }, qNode);
            return response;
        });
    }
    getElementByPathAsync(path, callback) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const pathError = new errors_1.PathDiscoveryFailureError(path);
            const TYPE_NUM = 1;
            const TYPE_ID = 2;
            let type = TYPE_NUM;
            let pathArray = [];
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.GET_ELEMENT_REQUEST(path));
            if (path.indexOf('/') >= 0) {
                type = TYPE_ID;
                pathArray = path.split('/');
            }
            else {
                pathArray = path.split('.');
                if (pathArray.length === 1) {
                    if (isNaN(Number(pathArray[0]))) {
                        type = TYPE_ID;
                    }
                }
            }
            let pos = 0;
            let lastMissingPos = -1;
            let currentNode = this.root;
            const getNext = () => __awaiter(this, void 0, void 0, function* () {
                let node;
                if (type === TYPE_NUM) {
                    const number = Number(pathArray[pos]);
                    node = currentNode.getElementByNumber(number);
                }
                else {
                    const children = currentNode.getChildren();
                    const identifier = pathArray[pos];
                    if (children != null) {
                        let i = 0;
                        for (i = 0; i < children.length; i++) {
                            node = children[i];
                            if (node.contents != null && node.contents.identifier === identifier) {
                                break;
                            }
                        }
                        if (i >= children.length) {
                            node = null;
                        }
                    }
                }
                if (node != null) {
                    pos++;
                    if (pos >= pathArray.length) {
                        yield this.getDirectoryAsync(node, callback);
                        return node;
                    }
                    currentNode = node;
                    return getNext();
                }
                if (lastMissingPos === pos) {
                    throw pathError;
                }
                lastMissingPos = pos;
                yield this.getDirectoryAsync(currentNode, callback);
                return getNext();
            });
            const response = yield getNext();
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_client_logs_1.ClientLogs.GET_ELEMENT_RESPONSE(path, response));
            return response;
        });
    }
    getStats() {
        return this.socket.getStats();
    }
    invokeFunctionAsync(fnNode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.makeRequestAsync(() => {
                var _a;
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.INVOCATION_SENDING_QUERY(fnNode));
                this.socket.sendBERNode(fnNode.invoke(params));
            }, (err, result) => {
                var _a, _b;
                if (err) {
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.INVOCATION_ERROR(err));
                    throw err;
                }
                else {
                    (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_client_logs_1.ClientLogs.INVOCATION_RESULT_RECEIVED(result));
                    return result;
                }
            }, fnNode);
            return res;
        });
    }
    isConnected() {
        var _a;
        return (_a = this.socket) === null || _a === void 0 ? void 0 : _a.isConnected();
    }
    matrixConnectAsync(matrixNode, targetID, sources) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.MATRIX_CONNECTION_REQUEST(matrixNode, targetID, sources));
            return this.matrixOperationAsync(matrixNode, targetID, sources, matrix_operation_1.MatrixOperation.connect);
        });
    }
    matrixDisconnectAsync(matrixNode, targetID, sources) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.MATRIX_DISCONNECTION_REQUEST(matrixNode, targetID, sources));
            return this.matrixOperationAsync(matrixNode, targetID, sources, matrix_operation_1.MatrixOperation.disconnect);
        });
    }
    matrixSetConnection(matrixNode, targetID, sources) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.MATRIX_ABSOLUTE_CONNECTION_REQUEST(matrixNode, targetID, sources));
            return this.matrixOperationAsync(matrixNode, targetID, sources, matrix_operation_1.MatrixOperation.absolute);
        });
    }
    saveTree(f) {
        const writer = new BER.ExtendedWriter();
        this.root.encode(writer);
        f(writer.buffer);
    }
    setLogLevel(logLevel) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.setLogLevel(logLevel);
    }
    setValueAsync(node, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!node.isParameter()) {
                throw new errors_1.InvalidEmberNodeError(node.getPath(), 'not a Parameter');
            }
            else {
                return this.makeRequestAsync(() => {
                    var _a;
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.SETVALUE_REQUEST(node, value));
                    this.socket.sendBERNode(node.setValue(parameter_contents_1.ParameterContents.createParameterContent(value)));
                }, (err, n) => {
                    var _a, _b;
                    if (err) {
                        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.SETVALUE_REQUEST_ERROR(node, value));
                        throw err;
                    }
                    else {
                        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_client_logs_1.ClientLogs.SETVALUE_REQUEST_SUCCESS(node, value));
                        return n;
                    }
                }, node);
            }
        });
    }
    subscribeAsync(qNode, callback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if ((qNode.isParameter() || qNode.isMatrix()) && qNode.isStream()) {
                return this.makeRequestAsync(() => {
                    var _a;
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.SUBSCRIBE_REQUEST(qNode));
                    this.socket.sendBERNode(qNode.subscribe(callback));
                    this._streams.addEntry(new stream_entry_1.StreamEntry(qNode.contents.streamIdentifier, qNode.getPath()));
                    return;
                }, null, qNode);
            }
            else {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.INVALID_SUBSCRIBE_REQUEST(qNode));
            }
        });
    }
    unsubscribeAsync(qNode, callback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (qNode.isParameter() && qNode.isStream()) {
                return this.makeRequestAsync(() => {
                    var _a;
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.UNSUBSCRIBE_REQUEST(qNode));
                    this.socket.sendBERNode(qNode.unsubscribe(callback));
                    const entry = this._streams.getEntry(qNode.contents.streamIdentifier);
                    if (entry != null) {
                        this._streams.removeEntry(entry);
                    }
                }, undefined, qNode);
            }
            else {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.INVALID_UNSUBSCRIBE_REQUEST(qNode));
            }
        });
    }
    matrixOperationAsync(matrixNode, targetID, sources, operation = matrix_operation_1.MatrixOperation.connect) {
        return __awaiter(this, void 0, void 0, function* () {
            matrixNode.validateConnection(targetID, sources);
            const connections = {};
            const targetConnection = new matrix_connection_1.MatrixConnection(targetID);
            targetConnection.operation = operation;
            targetConnection.setSources(sources);
            connections[targetID] = targetConnection;
            return this.makeRequestAsync(() => {
                this.socket.sendBERNode(matrixNode.connect(connections));
            }, (err, node) => {
                var _a, _b, _c;
                const requestedPath = matrixNode.getPath();
                if (err) {
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.MATRIX_OPERATION_ERROR(matrixNode, targetID, sources));
                    throw err;
                }
                if (node == null) {
                    (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_client_logs_1.ClientLogs.MATRIX_OPERATION_UNEXPECTED_ANSWER(matrixNode, targetID, sources));
                    return undefined;
                }
                let matrix = null;
                if (node != null) {
                    matrix = node.getElementByPath(requestedPath);
                }
                if (matrix != null && matrix.isMatrix() && matrix.getPath() === requestedPath) {
                    return matrix;
                }
                else {
                    (_c = this.logger) === null || _c === void 0 ? void 0 : _c.log(ember_client_logs_1.ClientLogs.MATRIX_OPERATION_UNEXPECTED_ANSWER(matrixNode, targetID, sources));
                    return undefined;
                }
            }, matrixNode);
        });
    }
    handleRoot(root) {
        var _a, _b;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.EMBER_MESSAGE_RECEIVED());
        this.root.update(root);
        if (root.elements != null) {
            const elements = root.getChildren();
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].isQualified()) {
                    this.handleQualifiedNode(this.root, elements[i]);
                }
                else {
                    this.handleNode(this.root, elements[i]);
                }
            }
        }
        if (root.getStreams() != null) {
            const streams = root.getStreams();
            for (const streamEntry of streams) {
                const pathContainer = this._streams.getEntry(streamEntry.identifier);
                if (pathContainer == null) {
                    (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_client_logs_1.ClientLogs.UNKOWN_STREAM_RECEIVED(streamEntry.identifier));
                    continue;
                }
                const element = this.root.getElementByPath(pathContainer.value);
                if (element != null && element.isParameter() && element.isStream()
                    && element.contents.value !== streamEntry.value) {
                    element.contents.value = streamEntry.value;
                    element.updateSubscribers();
                }
            }
        }
        if (this._callback) {
            this._callback(null, root);
        }
    }
    finishRequest() {
        var _a;
        this.clearTimeout();
        this._callback = undefined;
        this._activeRequest = null;
        try {
            this.makeRequest();
        }
        catch (e) {
            if (this._callback != null) {
                this._callback(e);
            }
            else {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.REQUEST_FAILURE(e));
            }
            this.emit(ember_client_events_1.EmberClientEvent.ERROR, e);
        }
    }
    makeRequest() {
        var _a;
        if (this._activeRequest == null && this._pendingRequests.length > 0) {
            this._activeRequest = this._pendingRequests.shift();
            const req = `${this._requestID++} - ${this._activeRequest.node.getPath()}`;
            this._activeRequest.timeoutError = new errors_1.EmberTimeoutError(`Request ${req} timed out`);
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.MAKING_REQUEST());
            this._timeout = setTimeout(() => {
                var _a;
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.REQUEST_FAILURE(this._activeRequest.timeoutError));
                if (this._callback != null) {
                    this._callback(this._activeRequest.timeoutError);
                }
            }, this.timeoutValue);
            this._activeRequest.func();
        }
    }
    makeRequestAsync(action, cb, node) {
        return new Promise((resolve, reject) => {
            const req = new ember_client_request_1.Request(node, () => {
                if (cb != null) {
                    this._callback = (e, d) => {
                        try {
                            const res = cb(e, d);
                            if (res === undefined) {
                                return;
                            }
                            this.finishRequest();
                            resolve(res);
                        }
                        catch (error) {
                            this.finishRequest();
                            reject(error);
                        }
                    };
                }
                try {
                    const res = action();
                    if (cb == null) {
                        this.finishRequest();
                        resolve(res);
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
            this._pendingRequests.push(req);
            this.makeRequest();
        });
    }
    clearTimeout() {
        if (this._timeout != null) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }
    handleNode(parent, node) {
        if (!(node instanceof tree_node_1.TreeNode)) {
            throw new errors_1.InvalidEmberNodeError(parent.getPath(), 'children not a valid TreeNode');
        }
        let originalNode = parent.getElementByNumber(node.getNumber());
        if (originalNode == null) {
            parent.addChild(node);
            originalNode = node;
        }
        else if (originalNode.update(node)) {
            originalNode.updateSubscribers();
            this.emit(ember_client_events_1.EmberClientEvent.VALUE_CHANGE, originalNode);
        }
        const children = node.getChildren();
        if (children !== null) {
            for (let i = 0; i < children.length; i++) {
                this.handleNode(originalNode, children[i]);
            }
        }
    }
    handleQualifiedNode(parent, node) {
        var _a;
        let element = parent.getElementByPath(node.path);
        if (element !== null) {
            if (element.update(node)) {
                element.updateSubscribers();
                this.emit(ember_client_events_1.EmberClientEvent.VALUE_CHANGE, element);
            }
        }
        else {
            const path = node.path.split('.');
            if (path.length === 1) {
                this.root.addChild(node);
            }
            else {
                const parentPath = path.slice(0, path.length - 1).join('.');
                parent = this.root.getElementByPath(parentPath);
                if (parent == null) {
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_client_logs_1.ClientLogs.UNKOWN_ELEMENT_RECEIVED(parentPath));
                    return;
                }
                parent.addChild(node);
                parent.update(parent);
            }
            element = node;
        }
        const children = node.getChildren();
        if (children !== null) {
            for (let i = 0; i < children.length; i++) {
                if (children[i].isQualified()) {
                    this.handleQualifiedNode(element, children[i]);
                }
                else {
                    this.handleNode(element, children[i]);
                }
            }
        }
    }
}
exports.EmberClient = EmberClient;
//# sourceMappingURL=ember-client.js.map