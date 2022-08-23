"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const ber_1 = require("../ber");
const command_1 = require("./command");
const invocation_result_1 = require("./invocation-result");
const errors_1 = require("../error/errors");
const invocation_1 = require("./invocation");
const element_base_1 = require("./element.base");
class TreeNode extends element_base_1.ElementBase {
    constructor() {
        super();
        this._parent = null;
        this._subscribers = new Set();
    }
    get description() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.description;
    }
    set description(description) {
        this.setContent('description', description);
    }
    get identifier() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.identifier;
    }
    set identifier(identifier) {
        this.setContent('identifier', identifier);
    }
    get number() {
        const num = this._number;
        return num;
    }
    get path() {
        const path = this._path;
        return path;
    }
    get contents() {
        return this._contents;
    }
    static addElement(parent, element) {
        element._parent = parent;
        if (parent.elements == null) {
            parent.elements = new Map();
        }
        if (parent.isRoot() && element.isQualified()) {
            const path = element.getPath().split('.');
            if (path.length > 1) {
                parent.elements.set(element.getPath(), element);
                return;
            }
        }
        parent.elements.set(element.getNumber(), element);
    }
    static decode(ber) {
        return null;
    }
    static path2number(path) {
        try {
            const numbers = path.split('.');
            if (numbers.length > 0) {
                return Number(numbers[numbers.length - 1]);
            }
        }
        catch (e) {
        }
    }
    static createElementTree(node) {
        const elementTree = node.toElement();
        const children = node.getChildren();
        if (children != null) {
            for (const child of children) {
                elementTree.addChild(this.createElementTree(child));
            }
        }
        return elementTree;
    }
    _isSubscribable(callback) {
        return (callback != null &&
            ((this.isParameter() && this.isStream()) ||
                this.isMatrix()));
    }
    _isAutoSubscribable(callback) {
        return (callback != null &&
            ((this.isParameter() && !this.isStream()) ||
                this.isMatrix()));
    }
    _subscribe(callback) {
        this._subscribers.add(callback);
    }
    _unsubscribe(callback) {
        this._subscribers.delete(callback);
    }
    addChild(child) {
        TreeNode.addElement(this, child);
    }
    addElement(element) {
        TreeNode.addElement(this, element);
    }
    clear() {
        this.elements = undefined;
    }
    encode(ber) {
        ber.startSequence(ber_1.APPLICATION(0));
        if (this.elements != null) {
            const elements = this.getChildren();
            ber.startSequence(ber_1.APPLICATION(11));
            for (let i = 0; i < elements.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                elements[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
        }
        if (this.isRoot() && this._result != null) {
            this._result.encode(ber);
        }
        if (this.streams != null) {
            this.streams.encode(ber);
        }
        ber.endSequence();
    }
    encodeNumber(ber) {
        ber.startSequence(ber_1.CONTEXT(0));
        ber.writeInt(this.number);
        ber.endSequence();
    }
    encodePath(ber) {
        if (this.isQualified()) {
            ber.startSequence(ber_1.CONTEXT(0));
            ber.writeRelativeOID(this.path, ber_1.EMBER_RELATIVE_OID);
            ber.endSequence();
        }
    }
    getSubscribersCount() {
        return this._subscribers.size;
    }
    getNewTree() {
        return new TreeNode();
    }
    hasChildren() {
        return this.elements != null && this.elements.size > 0;
    }
    isRoot() {
        return this._parent == null;
    }
    getMinimalContent() {
        let obj;
        if (this.isQualified()) {
            obj = new this.constructor(this.path);
        }
        else {
            obj = new this.constructor(this.number);
        }
        if (this.contents != null) {
            obj.setContents(this.contents);
        }
        else if (this.isTemplate()) {
            obj.element = this.element;
        }
        return obj;
    }
    getDuplicate() {
        const obj = this.getMinimal();
        obj.update(this);
        return obj;
    }
    getMinimal() {
        if (this.isQualified()) {
            return new this.constructor(this.path);
        }
        else {
            return new this.constructor(this.number);
        }
    }
    getTreeBranch(child, modifier) {
        const m = this.getMinimal();
        if (child != null) {
            m.addChild(child);
        }
        if (modifier != null) {
            modifier(m);
        }
        if (this._parent == null) {
            return m;
        }
        else {
            return this._parent.getTreeBranch(m);
        }
    }
    getRoot() {
        if (this._parent == null) {
            return this;
        }
        else {
            return this._parent.getRoot();
        }
    }
    getCommand(cmd) {
        return this.getTreeBranch(cmd);
    }
    getDirectory(callback) {
        if (this._isAutoSubscribable(callback)) {
            this._subscribe(callback);
        }
        return this.getCommand(new command_1.Command(constants_1.COMMAND_GETDIRECTORY));
    }
    getChildren() {
        if (this.elements != null) {
            return [...this.elements.values()];
        }
        return null;
    }
    getNumber() {
        if (this.isQualified()) {
            return TreeNode.path2number(this.getPath());
        }
        else {
            return this.number;
        }
    }
    getParent() {
        return this._parent;
    }
    getElementByPath(path) {
        if (this.elements == null || this.elements.size === 0) {
            return null;
        }
        if (this.isRoot()) {
            const _node = this.elements.get(Array.isArray(path) ? path.join('.') : path);
            if (_node != null) {
                return _node;
            }
        }
        const myPath = this.getPath();
        if (path === myPath) {
            return this;
        }
        const myPathArray = this.isRoot() ? [] : myPath.split('.').map(x => Number(x));
        const pathArray = Array.isArray(path) ? path : path.split('.').map(x => Number(x));
        if (pathArray.length < myPathArray.length) {
            return null;
        }
        for (let i = 0; i < myPathArray.length; i++) {
            if (pathArray[i] !== myPathArray[i]) {
                return null;
            }
        }
        let node = this;
        while (myPathArray.length !== pathArray.length) {
            const number = pathArray[myPathArray.length];
            node = node.getElementByNumber(number);
            if (node == null || node.isCommand()) {
                return null;
            }
            if (node.isQualified() && node.path === path) {
                return node;
            }
            myPathArray.push(number);
        }
        return node;
    }
    getElementByNumber(number) {
        const n = Number(number);
        if (this.elements != null) {
            return this.elements.get(n);
        }
        return null;
    }
    getElementByIdentifier(identifier) {
        const children = this.getChildren();
        if (children == null) {
            return null;
        }
        for (let i = 0; i < children.length; i++) {
            if (children[i].isCommand()) {
                continue;
            }
            const contents = children[i].contents;
            if (contents != null &&
                contents.identifier === identifier) {
                return children[i];
            }
        }
        return null;
    }
    getElement(id) {
        const num = Number(id);
        if (Number.isInteger(num)) {
            return this.getElementByNumber(num);
        }
        else {
            const txt = String(id);
            return this.getElementByIdentifier(txt);
        }
    }
    getPath() {
        if (this.path != null) {
            return this.path;
        }
        if (this._parent == null) {
            if (this.number == null) {
                return '';
            }
            else {
                return this.number.toString();
            }
        }
        else {
            let path = this._parent.getPath();
            if (path.length > 0) {
                path = path + '.';
            }
            return path + this.number;
        }
    }
    getResult() {
        if (this.isRoot()) {
            return this._result;
        }
        throw new errors_1.InvalidEmberNodeError(this.getPath(), 'getResult only for root');
    }
    invoke(params) {
        const invocation = new invocation_1.Invocation(invocation_1.Invocation.newInvocationID());
        invocation.arguments = params;
        const req = this.getCommand(command_1.Command.getInvocationCommand(invocation));
        return req;
    }
    setResult(result) {
        if (this.isRoot()) {
            this._result = result;
        }
        else {
            throw new errors_1.InvalidEmberNodeError(this.getPath(), 'setResult only for root');
        }
    }
    setStreams(streams) {
        this.streams = streams;
    }
    getStreams() {
        return this.streams;
    }
    subscribe(callback) {
        if (this._isSubscribable(callback)) {
            this._subscribe(callback);
        }
        return this.getCommand(new command_1.Command(constants_1.COMMAND_SUBSCRIBE));
    }
    getJSONContent() {
        var _a, _b, _c;
        const node = this;
        if (this.isRoot()) {
            const elements = this.getChildren();
            return {
                elements: elements == null ? [] : elements.map(e => e.toJSON()),
                streams: (_a = node.streams) === null || _a === void 0 ? void 0 : _a.toJSON(),
                result: (_b = node._result) === null || _b === void 0 ? void 0 : _b.toJSON()
            };
        }
        const res = {
            nodeType: this.constructor.name,
            number: node.getNumber(),
            path: node.getPath()
        };
        (_c = node.contents) === null || _c === void 0 ? void 0 : _c.toJSON(res);
        return res;
    }
    toJSON() {
        var _a;
        const res = this.getJSONContent();
        res.children = (_a = this.getChildren()) === null || _a === void 0 ? void 0 : _a.map(child => child.toJSON());
        return res;
    }
    toElement() {
        if (this.isRoot()) {
            return new TreeNode();
        }
        return this.getDuplicate();
    }
    toQualified() {
        throw new errors_1.InvalidFunctionCallError('toQualified should not be called on TreeNode');
    }
    unsubscribe(callback) {
        this._unsubscribe(callback);
        return this.getCommand(new command_1.Command(constants_1.COMMAND_UNSUBSCRIBE));
    }
    update(other) {
        let modified = false;
        if ((other != null) && (other.contents != null)) {
            if (this.contents == null) {
                this.setContents(other.contents);
                modified = true;
            }
            else {
                const contents = this.contents;
                const newContents = other.contents;
                for (const key in newContents) {
                    if (contents[key] !== newContents[key]) {
                        contents[key] = newContents[key];
                        modified = true;
                    }
                }
            }
        }
        return modified;
    }
    updateSubscribers() {
        if (this._subscribers != null) {
            for (const cb of this._subscribers) {
                cb(this);
            }
        }
    }
    decodeChildren(ber) {
        const seq = ber.getSequence(ber_1.APPLICATION(4));
        while (seq.remain > 0) {
            const nodeSeq = seq.getSequence(ber_1.CONTEXT(0));
            const child = TreeNode.decode(nodeSeq);
            if (child == null) {
                throw new errors_1.InvalidEmberNodeError(this.getPath(), `decoded child is null. Hex: ${nodeSeq.buffer.toString('hex')}`);
            }
            if (child instanceof invocation_result_1.InvocationResult) {
                throw new errors_1.InvalidEmberNodeError('', 'Unexpected InvocationResult child');
            }
            this.addChild(child);
        }
    }
    encodeChildren(ber) {
        const children = this.getChildren();
        if (children != null) {
            ber.startSequence(ber_1.CONTEXT(2));
            ber.startSequence(ber_1.APPLICATION(4));
            for (let i = 0; i < children.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                children[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
    }
    setContent(key, value) {
        if (this._contents != null) {
            this._contents[key] = value;
        }
        else {
            throw new errors_1.InvalidEmberNodeError(this.getPath(), 'No contents defined');
        }
    }
    setPath(path) {
        this._path = path;
    }
    setNumber(number) {
        this._number = number;
    }
    setContents(contents) {
        this._contents = contents;
    }
}
exports.TreeNode = TreeNode;
//# sourceMappingURL=tree-node.js.map