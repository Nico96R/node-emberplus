import { TreeNode } from '../common/tree-node';

export type RequestCallBack = (e?: Error) => void;

export class Request {
    private _timeoutError: Error;

    constructor(private _node: TreeNode, private _func: RequestCallBack) {
    }

    get timeoutError(): Error {
        return this._timeoutError;
    }

    set timeoutError(value: Error) {
        this._timeoutError = value;
    }

    get node(): TreeNode {
        return this._node;
    }

    get func(): RequestCallBack {
        return this._func;
    }
}
