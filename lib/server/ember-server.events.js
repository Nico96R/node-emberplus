"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Types;
(function (Types) {
    Types[Types["UNKNOWN"] = 0] = "UNKNOWN";
    Types[Types["SETVALUE"] = 1] = "SETVALUE";
    Types[Types["GETDIRECTORY"] = 2] = "GETDIRECTORY";
    Types[Types["SUBSCRIBE"] = 3] = "SUBSCRIBE";
    Types[Types["UNSUBSCRIBE"] = 4] = "UNSUBSCRIBE";
    Types[Types["INVOKE"] = 5] = "INVOKE";
    Types[Types["MATRIX_CONNECTION"] = 6] = "MATRIX_CONNECTION";
})(Types = exports.Types || (exports.Types = {}));
class ServerEvents {
    constructor(txt, type = Types.UNKNOWN) {
        this.txt = txt;
        this.type = type;
        this._timestamp = Date.now();
    }
    get timestamp() {
        return this._timestamp;
    }
    static SETVALUE(identifier, path, src) {
        return new ServerEvents(`set value for ${identifier}(path: ${path}) from ${src}`, Types.SETVALUE);
    }
    static GETDIRECTORY(identifier, path, src) {
        return new ServerEvents(`getdirectory to ${identifier}(path: ${path}) from ${src}`, Types.GETDIRECTORY);
    }
    static SUBSCRIBE(identifier, path, src) {
        return new ServerEvents(`subscribe to ${identifier}(path: ${path}) from ${src}`, Types.SUBSCRIBE);
    }
    static UNSUBSCRIBE(identifier, path, src) {
        return new ServerEvents(`unsubscribe to ${identifier}(path: ${path}) from ${src}`, Types.UNSUBSCRIBE);
    }
    static INVOKE(identifier, path, src) {
        return new ServerEvents(`invoke to ${identifier}(path: ${path}) from ${src}`, Types.INVOKE);
    }
    static MATRIX_CONNECTION(identifier, path, src, target, sources) {
        const sourcesInfo = sources == null || sources.length === 0 ? 'empty' : sources.toString();
        return new ServerEvents(`Matrix connection to ${identifier}(path: ${path}) target ${target} connections: ${sourcesInfo} from ${src}`, Types.MATRIX_CONNECTION);
    }
    toString() {
        return this.txt;
    }
}
exports.ServerEvents = ServerEvents;
//# sourceMappingURL=ember-server.events.js.map