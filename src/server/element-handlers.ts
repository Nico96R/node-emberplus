import { ServerEvents } from './ember-server.events';
import { EmberServerInterface } from './ember-server.interface';
import { Command } from '../common/command';
import { COMMAND_GETDIRECTORY, COMMAND_SUBSCRIBE, COMMAND_INVOKE, COMMAND_UNSUBSCRIBE } from '../common/constants';
import { ClientRequest } from './client-request';
import { TreeNode } from '../common/tree-node';
import { Invocation } from '../common/invocation';
import { InvalidCommandError } from '../error/errors';
import { QualifiedFunction } from '../common/function/qualified-function';
import { InvocationResult } from '../common/invocation-result';
import { Function } from '../common/function/function';
import { ServerLogs } from './ember-server.logs';
import { LoggingService } from '../logging/logging.service';

export class ElementHandlers {
    constructor(private _server: EmberServerInterface, private _logger: LoggingService) {
    }

    protected get logger(): LoggingService {
        return this._logger;
    }

    protected get server(): EmberServerInterface {
        return this._server;
    }

    handleCommand(client: ClientRequest, element: TreeNode, cmd: Command): void {
        let identifier = 'root';
        if (!element.isRoot()) {
            const node = this.server.tree.getElementByPath(element.getPath());
            identifier = node == null || node.contents == null || node.contents.identifier == null ? 'unknown' : node.contents.identifier;
        }
        const src = client == null || client.socket == null ? 'local' : client.socket.remoteAddress;
        switch (cmd.number) {
            case COMMAND_GETDIRECTORY:
                this.server.generateEvent(ServerEvents.GETDIRECTORY(identifier, element.getPath(), src));
                this.handleGetDirectory(client, element);
                break;
            case COMMAND_SUBSCRIBE:
                this.server.generateEvent(ServerEvents.SUBSCRIBE(identifier, element.getPath(), src));
                this.handleSubscribe(client, element);
                break;
            case COMMAND_UNSUBSCRIBE:
                this.server.generateEvent(ServerEvents.UNSUBSCRIBE(identifier, element.getPath(), src));
                this.handleUnSubscribe(client, element);
                break;
            case COMMAND_INVOKE:
                this.server.generateEvent(ServerEvents.INVOKE(identifier, element.getPath(), src));
                this.handleInvoke(client, cmd.invocation, element as Function);
                break;
            default:
                throw new InvalidCommandError(cmd.number);
        }
    }

    handleGetDirectory(client: ClientRequest, element: TreeNode): void {
        if (client != null) {
            if ((element.isMatrix() || element.isParameter()) &&
                (!element.isStream())) {
                // ember spec: parameter without streamIdentifier should
                // report their value changes automatically.
                this.server.subscribe(client.socket, element);
            } else if (element.isNode()) {
                const children = element.getChildren();
                if (children != null) {
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i];
                        if ((child.isMatrix() || child.isParameter()) &&
                            (!child.isStream())) {
                            this.server.subscribe(client.socket, child as TreeNode);
                        }
                    }
                }
            }

            const res = this.server.createQualifiedResponse(element);
            this.logger?.log(ServerLogs.GETDIRECTORY(element));
            client.socket.queueMessage(res);
        } else {
            this.logger?.log(ServerLogs.UNEXPECTED('GetDirectory from null client'));
        }
    }

    handleInvoke(client: ClientRequest, invocation: Invocation, element: Function | QualifiedFunction): void {
        const result = new InvocationResult();
        result.invocationId = invocation.id;
        if (element == null || !element.isFunction()) {
            result.setFailure();
        } else {
            try {
                const func = element.func;
                result.setResult(func(invocation.arguments));
                result.setSuccess();
            } catch (e) {
                this.logger?.log(ServerLogs.FUNCTION_ERROR(e));
                result.setFailure();
            }
        }
        const res = new TreeNode();
        res.setResult(result);
        client.socket.queueMessage(res);
    }

    handleSubscribe(client: ClientRequest, element: TreeNode): void {
        this.server.subscribe(client.socket, element);
    }

    handleUnSubscribe(client: ClientRequest, element: TreeNode): void {
        this.server.unsubscribe(client.socket, element);
    }
}
