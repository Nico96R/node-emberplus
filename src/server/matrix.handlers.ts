import { ServerEvents } from './ember-server.events';
import { EmberServerInterface } from './ember-server.interface';
import { MatrixDisposition } from '../common/matrix/matrix-disposition';
import { MatrixOperation } from '../common/matrix/matrix-operation';
import { MatrixType } from '../common/matrix/matrix-type';
import { ElementHandlers } from './element-handlers';
import { Matrix, MatrixConnections } from '../common/matrix/matrix';
import { MatrixConnection } from '../common/matrix/matrix-connection';
import { TreeNode } from '../common/tree-node';
import { QualifiedMatrix } from '../common/matrix/qualified-matrix';
import { ClientRequest } from './client-request';
import { MatrixNode } from '../common/matrix/matrix-node';
import { Parameter } from '../common/parameter';
import { ServerLogs } from './ember-server.logs';
import { LoggingService } from '../logging/logging.service';

export class MatrixHandlers extends ElementHandlers {
    constructor(server: EmberServerInterface, logger: LoggingService) {
        super(server, logger);
    }

    getDisconnectSource(matrix: Matrix, targetID: number): number {
        if (matrix.defaultSources) {
            return Number(matrix.defaultSources[targetID].value);
        }
        if (matrix.labels == null || matrix.labels.length === 0) {
            return -1;
        }
        const basePath = matrix.labels[matrix.labels.length - 1].basePath;
        const labels = this.server.tree.getElementByPath(basePath);
        const number = labels.getNumber() + 1; // Default Sources
        const parent = labels.getParent();
        const defaultSources = parent.getElement(number) as TreeNode;
        if (defaultSources != null) {
            matrix.defaultSources = defaultSources.getChildren() as Parameter[];
            return Number(matrix.defaultSources[targetID].value);
        }
        return -1;
    }

    handleMatrixConnections(
        client: ClientRequest, matrix: Matrix,
        connections: MatrixConnections, response: boolean = true): void {
        let res: Matrix;
        let conResult: MatrixConnection;
        let root: TreeNode; // ember message root
        this.logger?.log(ServerLogs.HANDLE_MATRIX_CONNECTIONS());
        if (client != null && client.request != null && client.request.isQualified()) {
            root = new TreeNode();
            res = new QualifiedMatrix(matrix.getPath());
            // root.elements = [res]; // do not use addchild or the element will get removed from the tree.
            root.addElement(res);
        } else {
            res = new MatrixNode(matrix.number);
            root = matrix._parent.getTreeBranch(res);
        }
        res.connections = {};
        for (const id in connections) {
            if (!connections.hasOwnProperty(id)) {
                continue;
            }
            const connection = connections[id];
            const src = client == null || client.socket == null ? 'local' : `${client.socket.remoteAddress}`;
            this.server.generateEvent(ServerEvents.MATRIX_CONNECTION(
                matrix.identifier, matrix.getPath(), src, Number(id), connection.sources
            ));
            conResult = new MatrixConnection(connection.target);
            res.connections[connection.target] = conResult;

            if (matrix.connections[connection.target].isLocked()) {
                conResult.disposition = MatrixDisposition.locked;
            } else {
                // Call pre-processing function
                this.server.preMatrixConnect(matrix, connection, res, client, response);
            }

            if (conResult.disposition == null) {
                // No decision made yet
                if (connection.operation !== MatrixOperation.disconnect &&
                    connection.sources != null && connection.sources.length > 0 &&
                    matrix.canConnect(connection.target, connection.sources, connection.operation)) {
                    this.server.applyMatrixConnect(matrix, connection, conResult, client, response);
                } else if (connection.operation !== MatrixOperation.disconnect &&
                    connection.sources != null && connection.sources.length === 0 &&
                    matrix.connections[connection.target].sources != null &&
                    matrix.connections[connection.target].sources.length > 0) {
                    // let's disconnect
                    conResult = this.server.disconnectMatrixTarget(
                        matrix, connection.target,
                        matrix.connections[connection.target].sources,
                        client,
                        response);
                } else if (connection.operation === MatrixOperation.disconnect &&
                    matrix.connections[connection.target].sources != null &&
                    matrix.connections[connection.target].sources.length > 0) {
                    // Disconnect
                    if (matrix.type === MatrixType.oneToN) {
                        this.server.applyMatrixOneToNDisconnect(matrix, connection, res, client, response);
                    } else {
                        conResult = this.server.disconnectSources(matrix, connection.target, connection.sources, client, response);
                    }
                }
            }
            if (conResult.disposition == null) {
                conResult.disposition = MatrixDisposition.tally;
            }

            // Send response or update subscribers.
            conResult.sources = matrix.connections[connection.target].sources;
        }
        if (client.socket != null) {
            client.socket.queueMessage(root);
        }

        if (conResult != null && conResult.disposition !== MatrixDisposition.tally) {
            this.server.updateSubscribers(matrix.getPath(), root, client.socket);
        }
    }
}
