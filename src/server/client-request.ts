import { S101Socket } from '../socket/s101.socket';
import { Command } from '../common/command';
import { TreeNode } from '../common/tree-node';
import { InvocationResult } from '../common/invocation-result';

export class ClientRequest {
    constructor(public socket: S101Socket, public request: TreeNode | Command | InvocationResult) {
    }
}
