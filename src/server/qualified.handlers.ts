import { EmberServerInterface } from './ember-server.interface';
import { UnknownElementError, InvalidCommandError } from '../error/errors';
import { Command } from '../common/command';
import { MatrixHandlers } from './matrix.handlers';
import { ClientRequest } from './client-request';
import { QualifiedNode } from '../common/qualified-node';
import { QualifiedMatrix } from '../common/matrix/qualified-matrix';
import { QualifiedParameter } from '../common/qualified-parameter';
import { Matrix } from '../common/matrix/matrix';
import { TreeNode } from '../common/tree-node';
import { ServerLogs } from './ember-server.logs';
import { LoggingService } from '../logging/logging.service';
import { QualifiedTemplate } from '../common/qualified-template';

export class QualifiedHandlers extends MatrixHandlers {
    constructor(server: EmberServerInterface, logger: LoggingService) {
        super(server, logger);
    }

    handleQualifiedMatrix(client: ClientRequest, element: Matrix, matrix: Matrix): void {
        this.handleMatrixConnections(client, element, matrix.connections);
    }

    handleQualifiedNode(client: ClientRequest, node: QualifiedNode | QualifiedParameter | QualifiedMatrix): string {
        const path = node.path;
        this.logger?.log(ServerLogs.HANDLE_QUALIFIED_NODE(path));
        // Find this element in our tree
        const element = this.server.tree.getElementByPath(path);
        if (element == null) {
            this.server.handleError(client, new UnknownElementError(path));
            return '';
        }

        if (node.hasChildren()) {
            const children = node.getChildren();
            for (const child of children) {
                if (child.isCommand()) {
                    this.handleCommand(client, element, child as Command);
                } else {
                    this.logger?.log(ServerLogs.INVALID_EMBER_NODE(node));
                }
                break;
            }
        } else {
            if (node.isMatrix()) {
                this.handleQualifiedMatrix(client, element as Matrix, node as QualifiedMatrix);
            } else if (node.isParameter()) {
                this.handleQualifiedParameter(client, element, node as QualifiedParameter);
            }
        }
        return path;
    }

    handleQualifiedParameter(client: ClientRequest, element: TreeNode, parameter: QualifiedParameter): void {
        if (parameter.value != null) {
            this.server.setValue(element, parameter.value, client.socket);
            const res = this.server.createQualifiedResponse(element);
            client.socket.queueMessage(res);
            this.server.updateSubscribers(element.getPath(), res, client.socket);
        }
    }
}
