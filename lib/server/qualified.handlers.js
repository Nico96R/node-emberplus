"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../error/errors");
const matrix_handlers_1 = require("./matrix.handlers");
const ember_server_logs_1 = require("./ember-server.logs");
class QualifiedHandlers extends matrix_handlers_1.MatrixHandlers {
    constructor(server, logger) {
        super(server, logger);
    }
    handleQualifiedMatrix(client, element, matrix) {
        this.handleMatrixConnections(client, element, matrix.connections);
    }
    handleQualifiedNode(client, node) {
        var _a, _b;
        const path = node.path;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.HANDLE_QUALIFIED_NODE(path));
        const element = this.server.tree.getElementByPath(path);
        if (element == null) {
            this.server.handleError(client, new errors_1.UnknownElementError(path));
            return '';
        }
        if (node.hasChildren()) {
            const children = node.getChildren();
            for (const child of children) {
                if (child.isCommand()) {
                    this.handleCommand(client, element, child);
                }
                else {
                    (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_server_logs_1.ServerLogs.INVALID_EMBER_NODE(node));
                }
                break;
            }
        }
        else {
            if (node.isMatrix()) {
                this.handleQualifiedMatrix(client, element, node);
            }
            else if (node.isParameter()) {
                this.handleQualifiedParameter(client, element, node);
            }
        }
        return path;
    }
    handleQualifiedParameter(client, element, parameter) {
        if (parameter.value != null) {
            this.server.setValue(element, parameter.value, client.socket);
            const res = this.server.createQualifiedResponse(element);
            client.socket.queueMessage(res);
            this.server.updateSubscribers(element.getPath(), res, client.socket);
        }
    }
}
exports.QualifiedHandlers = QualifiedHandlers;
//# sourceMappingURL=qualified.handlers.js.map