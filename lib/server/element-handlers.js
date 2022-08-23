"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ember_server_events_1 = require("./ember-server.events");
const constants_1 = require("../common/constants");
const tree_node_1 = require("../common/tree-node");
const errors_1 = require("../error/errors");
const invocation_result_1 = require("../common/invocation-result");
const ember_server_logs_1 = require("./ember-server.logs");
class ElementHandlers {
    constructor(_server, _logger) {
        this._server = _server;
        this._logger = _logger;
    }
    get logger() {
        return this._logger;
    }
    get server() {
        return this._server;
    }
    handleCommand(client, element, cmd) {
        let identifier = 'root';
        if (!element.isRoot()) {
            const node = this.server.tree.getElementByPath(element.getPath());
            identifier = node == null || node.contents == null || node.contents.identifier == null ? 'unknown' : node.contents.identifier;
        }
        const src = client == null || client.socket == null ? 'local' : client.socket.remoteAddress;
        switch (cmd.number) {
            case constants_1.COMMAND_GETDIRECTORY:
                this.server.generateEvent(ember_server_events_1.ServerEvents.GETDIRECTORY(identifier, element.getPath(), src));
                this.handleGetDirectory(client, element);
                break;
            case constants_1.COMMAND_SUBSCRIBE:
                this.server.generateEvent(ember_server_events_1.ServerEvents.SUBSCRIBE(identifier, element.getPath(), src));
                this.handleSubscribe(client, element);
                break;
            case constants_1.COMMAND_UNSUBSCRIBE:
                this.server.generateEvent(ember_server_events_1.ServerEvents.UNSUBSCRIBE(identifier, element.getPath(), src));
                this.handleUnSubscribe(client, element);
                break;
            case constants_1.COMMAND_INVOKE:
                this.server.generateEvent(ember_server_events_1.ServerEvents.INVOKE(identifier, element.getPath(), src));
                this.handleInvoke(client, cmd.invocation, element);
                break;
            default:
                throw new errors_1.InvalidCommandError(cmd.number);
        }
    }
    handleGetDirectory(client, element) {
        var _a, _b;
        if (client != null) {
            if ((element.isMatrix() || element.isParameter()) &&
                (!element.isStream())) {
                this.server.subscribe(client.socket, element);
            }
            else if (element.isNode()) {
                const children = element.getChildren();
                if (children != null) {
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i];
                        if ((child.isMatrix() || child.isParameter()) &&
                            (!child.isStream())) {
                            this.server.subscribe(client.socket, child);
                        }
                    }
                }
            }
            const res = this.server.createQualifiedResponse(element);
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.GETDIRECTORY(element));
            client.socket.queueMessage(res);
        }
        else {
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.log(ember_server_logs_1.ServerLogs.UNEXPECTED('GetDirectory from null client'));
        }
    }
    handleInvoke(client, invocation, element) {
        var _a;
        const result = new invocation_result_1.InvocationResult();
        result.invocationId = invocation.id;
        if (element == null || !element.isFunction()) {
            result.setFailure();
        }
        else {
            try {
                const func = element.func;
                result.setResult(func(invocation.arguments));
                result.setSuccess();
            }
            catch (e) {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log(ember_server_logs_1.ServerLogs.FUNCTION_ERROR(e));
                result.setFailure();
            }
        }
        const res = new tree_node_1.TreeNode();
        res.setResult(result);
        client.socket.queueMessage(res);
    }
    handleSubscribe(client, element) {
        this.server.subscribe(client.socket, element);
    }
    handleUnSubscribe(client, element) {
        this.server.unsubscribe(client.socket, element);
    }
}
exports.ElementHandlers = ElementHandlers;
//# sourceMappingURL=element-handlers.js.map