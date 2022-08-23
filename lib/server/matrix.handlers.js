"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ember_server_events_1 = require("./ember-server.events");
const matrix_disposition_1 = require("../common/matrix/matrix-disposition");
const matrix_operation_1 = require("../common/matrix/matrix-operation");
const matrix_type_1 = require("../common/matrix/matrix-type");
const element_handlers_1 = require("./element-handlers");
const matrix_connection_1 = require("../common/matrix/matrix-connection");
const tree_node_1 = require("../common/tree-node");
const qualified_matrix_1 = require("../common/matrix/qualified-matrix");
const matrix_node_1 = require("../common/matrix/matrix-node");
const ember_server_logs_1 = require("./ember-server.logs");
class MatrixHandlers extends element_handlers_1.ElementHandlers {
    constructor(server, logger) {
        super(server, logger);
    }
    getDisconnectSource(matrix, targetID) {
        if (matrix.defaultSources) {
            return Number(matrix.defaultSources[targetID].value);
        }
        if (matrix.labels == null || matrix.labels.length === 0) {
            return -1;
        }
        const basePath = matrix.labels[matrix.labels.length - 1].basePath;
        const labels = this.server.tree.getElementByPath(basePath);
        const number = labels.getNumber() + 1;
        const parent = labels.getParent();
        const defaultSources = parent.getElement(number);
        if (defaultSources != null) {
            matrix.defaultSources = defaultSources.getChildren();
            return Number(matrix.defaultSources[targetID].value);
        }
        return -1;
    }
    handleMatrixConnections(client, matrix, connections, response = true) {
        var _a;
        let res;
        let conResult;
        let root;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.HANDLE_MATRIX_CONNECTIONS());
        if (client != null && client.request != null && client.request.isQualified()) {
            root = new tree_node_1.TreeNode();
            res = new qualified_matrix_1.QualifiedMatrix(matrix.getPath());
            root.addElement(res);
        }
        else {
            res = new matrix_node_1.MatrixNode(matrix.number);
            root = matrix._parent.getTreeBranch(res);
        }
        res.connections = {};
        for (const id in connections) {
            if (!connections.hasOwnProperty(id)) {
                continue;
            }
            const connection = connections[id];
            const src = client == null || client.socket == null ? 'local' : `${client.socket.remoteAddress}`;
            this.server.generateEvent(ember_server_events_1.ServerEvents.MATRIX_CONNECTION(matrix.identifier, matrix.getPath(), src, Number(id), connection.sources));
            conResult = new matrix_connection_1.MatrixConnection(connection.target);
            res.connections[connection.target] = conResult;
            if (matrix.connections[connection.target].isLocked()) {
                conResult.disposition = matrix_disposition_1.MatrixDisposition.locked;
            }
            else {
                this.server.preMatrixConnect(matrix, connection, res, client, response);
            }
            if (conResult.disposition == null) {
                if (connection.operation !== matrix_operation_1.MatrixOperation.disconnect &&
                    connection.sources != null && connection.sources.length > 0 &&
                    matrix.canConnect(connection.target, connection.sources, connection.operation)) {
                    this.server.applyMatrixConnect(matrix, connection, conResult, client, response);
                }
                else if (connection.operation !== matrix_operation_1.MatrixOperation.disconnect &&
                    connection.sources != null && connection.sources.length === 0 &&
                    matrix.connections[connection.target].sources != null &&
                    matrix.connections[connection.target].sources.length > 0) {
                    conResult = this.server.disconnectMatrixTarget(matrix, connection.target, matrix.connections[connection.target].sources, client, response);
                }
                else if (connection.operation === matrix_operation_1.MatrixOperation.disconnect &&
                    matrix.connections[connection.target].sources != null &&
                    matrix.connections[connection.target].sources.length > 0) {
                    if (matrix.type === matrix_type_1.MatrixType.oneToN) {
                        this.server.applyMatrixOneToNDisconnect(matrix, connection, res, client, response);
                    }
                    else {
                        conResult = this.server.disconnectSources(matrix, connection.target, connection.sources, client, response);
                    }
                }
            }
            if (conResult.disposition == null) {
                conResult.disposition = matrix_disposition_1.MatrixDisposition.tally;
            }
            conResult.sources = matrix.connections[connection.target].sources;
        }
        if (client.socket != null) {
            client.socket.queueMessage(root);
        }
        if (conResult != null && conResult.disposition !== matrix_disposition_1.MatrixDisposition.tally) {
            this.server.updateSubscribers(matrix.getPath(), root, client.socket);
        }
    }
}
exports.MatrixHandlers = MatrixHandlers;
//# sourceMappingURL=matrix.handlers.js.map