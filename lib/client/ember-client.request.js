"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Request {
    constructor(_node, _func) {
        this._node = _node;
        this._func = _func;
    }
    get timeoutError() {
        return this._timeoutError;
    }
    set timeoutError(value) {
        this._timeoutError = value;
    }
    get node() {
        return this._node;
    }
    get func() {
        return this._func;
    }
}
exports.Request = Request;
//# sourceMappingURL=ember-client.request.js.map