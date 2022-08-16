
import { QualifiedHandlers } from './qualified.handlers';
import { S101Socket } from '../socket/s101.socket';
import { Command } from '../common/command';
import { MissingElementNumberError, InvalidRequestError, UnknownElementError, InvalidRequestFormatError } from '../error/errors';
import { TreeNode } from '../common/tree-node';
import { ClientRequest } from './client-request';
import { InvocationResult } from '../common/invocation-result';
import { Element } from '../common/element';
import { Parameter } from '../common/parameter';
import { QualifiedNode } from '../common/qualified-node';
import { Matrix } from '../common/matrix/matrix';
import { ServerLogs } from './ember-server.logs';
import { EmberServerInterface } from './ember-server.interface';
import { LoggingService } from '../logging/logging.service';

export class NodeHandlers extends QualifiedHandlers {
    constructor(server: EmberServerInterface, logger: LoggingService) {
        super(server, logger);
    }

    handleRoot(socket: S101Socket, root: TreeNode): string {
        if ((root == null) || (root.elements == null) || (root.elements.size < 1)) {
            this.logger?.log(ServerLogs.EMPTY_REQUEST());
            return;
        }

        // We validated root as at least 1 element. We assume it is only 1.
        const node = root.getChildren()[0];
        const clientRequest = new ClientRequest(socket, node);
        try {
            if (node.isQualified()) {
                return this.handleQualifiedNode(clientRequest, node as QualifiedNode);
            } else if (node.isCommand()) {
                // Command on root element
                this.handleCommand(clientRequest, this.server.tree, node as Command);
                return 'root';
            } else {
                return this.handleNode(clientRequest, node as Element);
            }
        } catch (e) {
            this.server.handleError(clientRequest, e, node as TreeNode|Command);
        }
    }

    handleNode(client: ClientRequest, node: Element): string {
        // traverse the tree
        let element: Element | Command | InvocationResult = node;
        this.logger?.log(ServerLogs.HANDLE_NODE(node.number));
        const path: number[] = [];
        while (element != null) {
            if (element.isCommand() || element.isInvocationResult()) {
                break;
            }
            if ((element as Element).number == null) {
                throw new MissingElementNumberError();
            }

            path.push((element as Element).getNumber());

            const children: (TreeNode | Command | InvocationResult)[] = (element as Element).getChildren();
            if ((!children) || (children.length === 0)) {
                break;
            }
            element = children[0];
        }
        const cmd = element;

        if (cmd == null) {
            const error = new InvalidRequestError();
            this.server.handleError(client, error);
            return path.join('.');
        }

        element = this.server.tree.getElementByPath(path.join('.'));
        if (element == null) {
            this.server.handleError(client, new UnknownElementError(path.join('.')));
            return path.join('.');
        }
        if (cmd.isCommand()) {
            this.handleCommand(client, element as TreeNode, cmd as Command);
        } else if ((cmd.isMatrix()) && ((cmd as Matrix).connections != null)) {
            this.handleMatrixConnections(client, element as Matrix, (cmd as Matrix).connections);
        } else if ((cmd.isParameter()) &&
            ((cmd as Parameter).contents != null) && ((cmd as Parameter).contents.value != null)) {
            this.server.setValue(element, (cmd as Parameter).contents.value, client.socket);
            const res = this.server.createResponse(element);
            client.socket.queueMessage(res);
            this.server.updateSubscribers((cmd as Parameter).getPath(), res, client.socket);
        } else {
            this.server.handleError(client, new InvalidRequestFormatError(path.join('.')),
                (element as TreeNode).getTreeBranch());
        }
        // for logging purpose, return the path.
        return path.join('.');
    }
}
