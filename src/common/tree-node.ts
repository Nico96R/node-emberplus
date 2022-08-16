import { COMMAND_GETDIRECTORY, COMMAND_SUBSCRIBE, COMMAND_UNSUBSCRIBE } from './constants';
import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION, EMBER_RELATIVE_OID } from '../ber';
import { Command } from './command';
import { InvocationResult } from './invocation-result';
import { StreamCollection } from './stream/stream-collection';
import { FunctionContents } from './function/function-contents';
import { ParameterContents } from './parameter-contents';
import { NodeContents } from './node-contents';
import { MatrixContents } from './matrix/matrix-contents';
import { InvalidEmberNodeError, InvalidFunctionCallError, InvalidEmberResponseError } from '../error/errors';
import { Invocation } from './invocation';
import { FunctionArgument } from './function/function-argument';
import { ElementBase } from './element.base';
import { QualifiedElement } from './qualified-element';
import { Template } from './template';

export class TreeNode extends ElementBase {

    get description(): string|null {
        return this.contents?.description;
    }
    set description(description: string) {
        this.setContent('description', description);
    }

    get identifier(): string|null {
        return this.contents?.identifier;
    }

    set identifier(identifier: string) {
        this.setContent('identifier', identifier);
    }

    get number(): number {
        const num = this._number;
        return num;
    }

    get path(): string {
        // send a copy of the path to avoid modification
        const path = this._path;
        return path;
    }

    get contents(): FunctionContents | ParameterContents | NodeContents | MatrixContents|null {
        return this._contents;
    }
    public _parent: TreeNode;
    public elements: Map<string | number, TreeNode | Command | InvocationResult>;
    protected _result?: InvocationResult;
    protected _contents?: FunctionContents | ParameterContents | NodeContents | MatrixContents;
    protected _number?: number;
    protected _path?: string; protected _seqID: number;
    private _subscribers: Set<(x: TreeNode) => void>;
    private streams?: StreamCollection;

    constructor() {
        super();
        this._parent = null;
        this._subscribers = new Set();
    }

    static addElement(parent: TreeNode, element: TreeNode | Command): void {
        /*
        Store element hashed by number direct to the parent.
        But if QualifiedElement, it could be directly attached to the root.
        In this case, use the path instead of number.
        However, if the path is a single number, it is equivalent to number.
         */
        element._parent = parent;
        if (parent.elements == null) {
            parent.elements = new Map();
        }
        if (parent.isRoot() && element.isQualified()) {
            const path = (element as TreeNode).getPath().split('.');
            if (path.length > 1) {
                parent.elements.set((element as TreeNode).getPath(), element);
                return;
            }
        }
        parent.elements.set(element.getNumber(), element);
    }

    static decode(ber: Reader): TreeNode | Command | InvocationResult {
        // Will be set in index
        return null;
    }

    static path2number(path: string): number {
        try {
            const numbers = path.split('.');
            if (numbers.length > 0) {
                return Number(numbers[numbers.length - 1]);
            }
        } catch (e) {
            // ignore
        }
    }

    static createElementTree(node: TreeNode): TreeNode {
        const elementTree = node.toElement();
        const children: TreeNode[] = node.getChildren() as TreeNode[];
        if (children != null) {
            for (const child of children) {
                elementTree.addChild(this.createElementTree(child));
            }
        }
        return elementTree;
    }

    _isSubscribable(callback: (x: TreeNode) => void): boolean {
        return (callback != null &&
            ((this.isParameter() && this.isStream()) ||
                this.isMatrix()));
    }

    _isAutoSubscribable(callback: (x: TreeNode) => void): boolean {
        return (callback != null &&
            ((this.isParameter() && !this.isStream()) ||
                this.isMatrix()));
    }

    _subscribe(callback: (x: TreeNode) => void): void {
        this._subscribers.add(callback);
    }

    _unsubscribe(callback: (x: TreeNode) => void): void {
        this._subscribers.delete(callback);
    }

    addChild(child: TreeNode | Command): void {
        TreeNode.addElement(this, child);
    }

    addElement(element: TreeNode | Command): void {
        TreeNode.addElement(this, element);
    }

    clear(): void {
        this.elements = undefined;
    }

    encode(ber: Writer): void {
        ber.startSequence(APPLICATION(0));
        if (this.elements != null) {
            const elements = this.getChildren();
            ber.startSequence(APPLICATION(11));
            for (let i = 0; i < elements.length; i++) {
                ber.startSequence(CONTEXT(0));
                elements[i].encode(ber);
                ber.endSequence(); // CONTEXT(0)
            }
            ber.endSequence();
        }
        if (this.isRoot() && this._result != null) {
            this._result.encode(ber);
        }
        if (this.streams != null) {
            this.streams.encode(ber);
        }
        ber.endSequence(); // APPLICATION(0)
    }

    encodeNumber(ber: Writer): void {
        ber.startSequence(CONTEXT(0));
        ber.writeInt(this.number);
        ber.endSequence(); // CONTEXT(0)
    }

    encodePath(ber: Writer): void {
        if (this.isQualified()) {
            ber.startSequence(CONTEXT(0));
            ber.writeRelativeOID(this.path, EMBER_RELATIVE_OID);
            ber.endSequence(); // CONTEXT(0)
        }
    }

    getSubscribersCount(): number {
        return this._subscribers.size;
    }

    getNewTree(): TreeNode {
        return new TreeNode();
    }

    hasChildren(): boolean {
        return this.elements != null && this.elements.size > 0;
    }

    isRoot(): boolean {
        return this._parent == null;
    }

    getMinimalContent(): any {
        let obj;
        if (this.isQualified()) {
            obj = new (<any>this.constructor)(this.path);
        } else {
            obj = new (<any>this.constructor)(this.number);
        }
        if (this.contents != null) {
            obj.setContents(this.contents);
        } else if (this.isTemplate()) {
            obj.element = (this as Template).element;
        }
        return obj;
    }

    getDuplicate(): TreeNode {
        const obj = this.getMinimal();
        obj.update(this);
        return obj;
    }

    getMinimal(): TreeNode {
        if (this.isQualified()) {
            return new (<any>this.constructor)(this.path);
        } else {
            return new (<any>this.constructor)(this.number);
        }
    }

    getTreeBranch(child?: ElementBase, modifier?: (x: TreeNode) => void): TreeNode {
        const m = this.getMinimal();
        if (child != null) {
            m.addChild(child as TreeNode);
        }

        if (modifier != null) {
            modifier(m);
        }

        if (this._parent == null) {
            return m;
        } else {
            return this._parent.getTreeBranch(m);
        }
    }

    getRoot(): TreeNode {
        if (this._parent == null) {
            return this;
        } else {
            return this._parent.getRoot();
        }
    }

    getCommand(cmd: Command): TreeNode {
        return this.getTreeBranch(cmd);
    }

    getDirectory(callback: (x: TreeNode) => void): TreeNode {
        if (this._isAutoSubscribable(callback)) {
            this._subscribe(callback);
        }
        return this.getCommand(new Command(COMMAND_GETDIRECTORY));
    }

    getChildren(): (TreeNode | Command | InvocationResult)[] | null {
        if (this.elements != null) {
            return [...this.elements.values()];
        }
        return null;
    }

    getNumber(): number {
        if (this.isQualified()) {
            return TreeNode.path2number(this.getPath());
        } else {
            return this.number;
        }
    }

    getParent(): TreeNode {
        return this._parent;
    }

    getElementByPath(path: string|number[]): TreeNode {
        if (this.elements == null || this.elements.size === 0) {
            return null;
        }
        if (this.isRoot()) {
            // check if we have QualifiedElement
            const _node = this.elements.get(Array.isArray(path) ? path.join('.') : path);
            if (_node != null) {
                return (_node as TreeNode);
            }
        }
        const myPath = this.getPath();
        if (path === myPath) {
            return this;
        }
        const myPathArray: number[] = this.isRoot() ? [] : myPath.split('.').map(x => Number(x));
        const pathArray = Array.isArray(path) ? path : path.split('.').map(x => Number(x));

        if (pathArray.length < myPathArray.length) {
            // We are lower in the tree than the requested path
            return null;
        }

        // Verify that our path matches the beginning of the requested path
        for (let i = 0; i < myPathArray.length; i++) {
            if (pathArray[i] !== myPathArray[i]) {
                return null;
            }
        }
        // Now add child by child to get the requested path
        let node: TreeNode | Command | InvocationResult = this;
        while (myPathArray.length !== pathArray.length) {
            const number = pathArray[myPathArray.length];
            node = (node as TreeNode).getElementByNumber(number);
            if (node == null || node.isCommand()) {
                return null;
            }
            if (node.isQualified() && (node as QualifiedElement).path === path) {
                return (node as TreeNode);
            }
            myPathArray.push(number);
        }
        return (node as TreeNode);
    }

    getElementByNumber(number: number): TreeNode | Command | InvocationResult {
        const n = Number(number);
        if (this.elements != null) {
            return this.elements.get(n);
        }
        return null;
    }

    getElementByIdentifier(identifier: string): TreeNode {
        const children = this.getChildren();
        if (children == null) { return null; }
        for (let i = 0; i < children.length; i++) {
            if (children[i].isCommand()) {
                continue;
            }
            const contents = (children[i] as TreeNode).contents;
            if (contents != null &&
                contents.identifier === identifier) {
                return (children[i] as TreeNode);
            }
        }
        return null;
    }

    getElement(id: number | string): TreeNode | Command | InvocationResult {
        const num = Number(id);
        if (Number.isInteger(num)) {
            return this.getElementByNumber(num);
        } else {
            const txt = String(id);
            return this.getElementByIdentifier(txt);
        }
    }

    getPath(): string {
        if (this.path != null) {
            return this.path;
        }
        if (this._parent == null) {
            if (this.number == null) {
                return '';
            } else {
                return this.number.toString();
            }
        } else {
            let path = this._parent.getPath();
            if (path.length > 0) {
                path = path + '.';
            }
            return path + this.number;
        }
    }

    getResult(): InvocationResult|null {
        if (this.isRoot()) {
            return this._result;
        }
        throw new InvalidEmberNodeError(this.getPath(), 'getResult only for root');
    }

    invoke(params: FunctionArgument[]): TreeNode {
        const invocation = new Invocation(Invocation.newInvocationID());
        invocation.arguments = params;
        const req = this.getCommand(Command.getInvocationCommand(invocation));
        return req;
    }

    setResult(result: InvocationResult): void {
        if (this.isRoot()) {
            this._result = result;
        } else {
            throw new InvalidEmberNodeError(this.getPath(), 'setResult only for root');
        }
    }

    setStreams(streams: StreamCollection): void {
        this.streams = streams;
    }

    getStreams(): StreamCollection {
        return this.streams;
    }

    subscribe(callback: (x: TreeNode) => void): TreeNode {
        if (this._isSubscribable(callback)) {
            this._subscribe(callback);
        }
        return this.getCommand(new Command(COMMAND_SUBSCRIBE));
    }

    getJSONContent(): { [index: string]: any } {
        const node = this;
        if (this.isRoot()) {
            const elements = this.getChildren();
            return {
                elements: elements == null ? [] : elements.map(e => e.toJSON()),
                streams: node.streams?.toJSON(),
                result: node._result?.toJSON()
            };
        }
        const res: { [index: string]: any } = {
            nodeType: this.constructor.name,
            number: node.getNumber(),
            path: node.getPath()
        };

        node.contents?.toJSON(res);
        return res;
    }

    toJSON(): { [index: string]: any } {
        const res = this.getJSONContent();
        res.children = this.getChildren()?.map(child => child.toJSON());
        return res;
    }

    toElement(): TreeNode {
        if (this.isRoot()) {
            return new TreeNode();
        }
        return  this.getDuplicate();
    }

    toQualified(): TreeNode {
        // Should override.
        throw new InvalidFunctionCallError('toQualified should not be called on TreeNode');
    }

    unsubscribe(callback: (x: TreeNode) => void): TreeNode {
        this._unsubscribe(callback);
        return this.getCommand(new Command(COMMAND_UNSUBSCRIBE));
    }

    update(other: TreeNode): boolean {
        let modified = false;
        if ((other != null) && (other.contents != null)) {
            if (this.contents == null) {
                this.setContents(other.contents);
                modified = true;
            } else {
                const contents = (this.contents as { [index: string]: any });
                const newContents = (other.contents as { [index: string]: any });
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

    updateSubscribers(): void {
        if (this._subscribers != null) {
            for (const cb of this._subscribers) {
                cb(this);
            }
        }
    }

    protected decodeChildren(ber: Reader): void {
        const seq = ber.getSequence(APPLICATION(4));
        while (seq.remain > 0) {
            const nodeSeq = seq.getSequence(CONTEXT(0));
            const child = TreeNode.decode(nodeSeq);
            if (child == null) {
                throw new InvalidEmberNodeError(this.getPath(), `decoded child is null. Hex: ${nodeSeq.buffer.toString('hex')}`);
            }
            if (child instanceof InvocationResult) {
                throw new InvalidEmberNodeError('', 'Unexpected InvocationResult child');
            }
            this.addChild(child as TreeNode | Command);
        }
    }

    protected encodeChildren(ber: Writer): void {
        const children = this.getChildren();
        if (children != null) {
            ber.startSequence(CONTEXT(2));
            ber.startSequence(APPLICATION(4));
            for (let i = 0; i < children.length; i++) {
                ber.startSequence(CONTEXT(0));
                children[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
    }

    protected setContent(key: string, value: any): void {
        if (this._contents != null) {
            (this._contents as {[index: string]: any})[key] = value;
        } else {
            throw new InvalidEmberNodeError(this.getPath(), 'No contents defined');
        }
    }
    protected setPath(path: string): void {
        this._path = path;
    }
    protected setNumber(number: number): void {
        this._number = number;
    }

    protected setContents(contents: FunctionContents | ParameterContents | NodeContents | MatrixContents): void {
        this._contents = contents;
    }
}
