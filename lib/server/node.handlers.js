"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qualified_handlers_1 = require("./qualified.handlers");
const errors_1 = require("../error/errors");
const client_request_1 = require("./client-request");
const ember_server_logs_1 = require("./ember-server.logs");
class NodeHandlers extends qualified_handlers_1.QualifiedHandlers {
    constructor(server, logger) {
        super(server, logger);
    }
    handleRoot(socket, root) {
        var _a;
        if ((root == null) || (root.elements == null) || (root.elements.size < 1)) {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.EMPTY_REQUEST());
            return;
        }
        const node = root.getChildren()[0];
        const clientRequest = new client_request_1.ClientRequest(socket, node);
        try {
            if (node.isQualified()) {
                return this.handleQualifiedNode(clientRequest, node);
            }
            else if (node.isCommand()) {
                this.handleCommand(clientRequest, this.server.tree, node);
                return 'root';
            }
            else {
                return this.handleNode(clientRequest, node);
            }
        }
        catch (e) {
            this.server.handleError(clientRequest, e, node);
        }
    }
    handleNode(client, node) {
        var _a;
        let element = node;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.HANDLE_NODE(node.number));
        const path = [];
        while (element != null) {
            if (element.isCommand() || element.isInvocationResult()) {
                break;
            }
            if (element.number == null) {
                throw new errors_1.MissingElementNumberError();
            }
            path.push(element.getNumber());
            const children = element.getChildren();
            if ((!children) || (children.length === 0)) {
                break;
            }
            element = children[0];
        }
        const cmd = element;
        if (cmd == null) {
            const error = new errors_1.InvalidRequestError();
            this.server.handleError(client, error);
            return path.join('.');
        }
        element = this.server.tree.getElementByPath(path.join('.'));
        if (element == null) {
            this.server.handleError(client, new errors_1.UnknownElementError(path.join('.')));
            return path.join('.');
        }
        if (cmd.isCommand()) {
            this.handleCommand(client, element, cmd);
        }
        else if ((cmd.isMatrix()) && (cmd.connections != null)) {
            this.handleMatrixConnections(client, element, cmd.connections);
        }
        else if ((cmd.isParameter()) &&
            (cmd.contents != null) && (cmd.contents.value != null)) {
            this.server.setValue(element, cmd.contents.value, client.socket);
            const res = this.server.createResponse(element);
            client.socket.queueMessage(res);
            this.server.updateSubscribers(cmd.getPath(), res, client.socket);
        }
        else {
            this.server.handleError(client, new errors_1.InvalidRequestFormatError(path.join('.')), element.getTreeBranch());
        }
        return path.join('.');
    }
}
exports.NodeHandlers = NodeHandlers;
//# sourceMappingURL=node.handlers.js.map