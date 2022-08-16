import { S101Socket } from '../socket/s101.socket';
import { ServerEvents } from './ember-server.events';
import { TreeNode } from '../common/tree-node';
import { MatrixConnection } from '../common/matrix/matrix-connection';
import { Matrix } from '../common/matrix/matrix';
import { ClientRequest } from './client-request';
import { Command } from '../common/command';

export interface EmberServerInterface {
    tree: TreeNode;

    applyMatrixConnect: (
        matrix: Matrix, connection: MatrixConnection,
        conResult: MatrixConnection, client: ClientRequest, response: boolean) => void;

    applyMatrixOneToNDisconnect: (
        matrix: Matrix, connection: MatrixConnection,
        res: Matrix, client: ClientRequest, response: boolean) => void;

    disconnectMatrixTarget: (
        matrix: Matrix, targetID: number, sources: number[],
        client: ClientRequest, response: boolean) => MatrixConnection;

    disconnectSources: (
        matrix: Matrix, target: number, sources: number[],
        client: ClientRequest, response: boolean) => MatrixConnection;

    emit: (x: string, y: any) => void;

    generateEvent: (event: ServerEvents) => void;

    createResponse: (element: TreeNode) => TreeNode;

    getDisconnectSource: (matrix: Matrix, targetID: number) => number;

    handleError: (client: ClientRequest, error: Error, node?: TreeNode|Command) => void;

    setValue: (
        element: TreeNode, value: string | number | Buffer | boolean,
        origin?: S101Socket, key?: string) => Promise<void>;

    subscribe: (client: S101Socket, element: TreeNode) => void;

    createQualifiedResponse: (element: TreeNode) => TreeNode;

    preMatrixConnect: (
        matrix: Matrix, connection: MatrixConnection,
        res: Matrix, client: ClientRequest, response: boolean) => void;

    updateSubscribers: (path: string, response: TreeNode, origin?: S101Socket) => void;

    unsubscribe: (client: S101Socket, element: TreeNode) => void;
}
