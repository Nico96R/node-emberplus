import { ExtendedReader, APPLICATION, CONTEXT } from '../ber';
import { TreeNode } from './tree-node';
import { Element } from './element';
import { Command } from './command';
import { InvocationResult } from './invocation-result';
import { StreamCollection } from './stream/stream-collection';
import { Parameter } from './parameter';
import { ParameterType } from './parameter-type';
import { ParameterAccess } from './parameter-access';
import { Node } from './node';
import { MatrixNode } from './matrix/matrix-node';
import { Template } from './template';
import { QualifiedMatrix } from './matrix/qualified-matrix';
import { QualifiedParameter } from './qualified-parameter';
import { QualifiedNode } from './qualified-node';
import { QualifiedFunction } from './function/qualified-function';
import { QualifiedTemplate } from './qualified-template';
import { UnimplementedEmberTypeError } from '../error/errors';
import { Function } from './function/function';
import { FunctionArgument } from './function/function-argument';
import { Label } from './label';
import { StringIntegerCollection } from './string-integer-collection';
import { StringIntegerPair } from './string-integer-pair';
import { Invocation } from './invocation';
import { StreamDescription } from './stream/stream-description';
import { StreamEntry } from './stream/stream-entry';
import { StreamFormat } from './stream/stream-format';

export const rootDecode = (ber: ExtendedReader): TreeNode | Command | InvocationResult => {
    const r = new TreeNode();
    let tag;
    while (ber.remain > 0) {
        tag = ber.peek();
        if (tag === APPLICATION(0)) {
            ber = ber.getSequence(APPLICATION(0));
            tag = ber.peek();

            if (tag === APPLICATION(11)) {
                const seq = ber.getSequence(APPLICATION(11));
                while (seq.remain > 0) {
                    const rootReader = seq.getSequence(CONTEXT(0));
                    while (rootReader.remain > 0) {
                        const element = childDecode(rootReader);
                        r.addElement(element as TreeNode | Command);
                    }
                }
            } else if (tag === InvocationResult.BERID) {
                return InvocationResult.decode(ber);
            } else if (tag === StreamCollection.BERID) {
                r.setStreams(StreamCollection.decode(ber));
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        } else if (tag === CONTEXT(0)) {
            // continuation of previous message
            try {
                const rootReader = ber.getSequence(CONTEXT(0));
                return childDecode(rootReader);
            } catch (e) {
                return r;
            }
        } else {
            throw new UnimplementedEmberTypeError(tag);
        }
    }
    return r;
};

export const createTreeBranch = (root: TreeNode, path: string): TreeNode => {
    const aPath = path.split('.');
    let node = root;
    let pos = 0;
    while (pos < aPath.length) {
        const number = Number(aPath[pos]);
        let child = node.getElement(number) as TreeNode;
        if (child == null) {
            child = new Node(number);
            node.addChild(child);
        }
        node = child;
        pos++;
    }
    return (node as Node).toQualified();
};

const jsonContentLogger = async (
    contents: {[index: string]: any},
    logger: {log: (x: string) => Promise<void>}, spaces= ' ', stepSpaces= ' '): Promise<void> => {

    const childSpaces = `${spaces}${stepSpaces}`;
    for (const prop of Object.keys(contents)) {
        if (prop === 'number' || prop === 'path' || contents[prop] === undefined) {
            continue;
        }
        const type = typeof contents[prop];
        if (type === 'string') {
            await logger.log(`,\n${spaces}"${prop}": "${contents[prop]}"`);
        } else if (type === 'number') {
            await logger.log(`,\n${spaces}"${prop}": ${contents[prop]}`);
        } else if (type === 'boolean') {
            await logger.log(`,\n${spaces}"${prop}": ${contents[prop] ? 'true' : 'false'}`);
        } else if (contents[prop] != null && contents[prop].toJSON != null) {
            await logger.log(`,\n${spaces}"${prop}":${JSON.stringify(contents[prop], null, childSpaces)}`);
        } else if (Array.isArray(contents[prop]) && contents[prop].length > 0 && contents[prop][0].toJSON != null) {
            await logger.log(
                `,\n${spaces}"${prop}":${JSON.stringify(contents[prop].map((x: any) => x.toJSON()), null, childSpaces)}`);
        } else {
            await logger.log(`,\n${spaces}"${prop}":${JSON.stringify(contents[prop], null, childSpaces)}`);
        }
    }
};
const jsonChildrenLogger = async (node: TreeNode, logger: {log: (x: string) => Promise<void>}, spaces= ' ', stepSpaces= ' '): Promise<void> => {
    const elements: TreeNode[] = node.getChildren() as TreeNode[];
    if (elements != null) {
        const childSpaces = `${spaces}${stepSpaces}`;
        await logger.log(`,\n${spaces}"children": [\n`);
        let first = true;
        for (const element of elements) {
            if (first) {
                first = false;
            } else {
                await logger.log(`,\n`);
            }
            await jsonFullNodeLogger(element as TreeNode, logger, childSpaces, stepSpaces);
        }
        await logger.log(`\n${spaces}]`);
    }
};

const jsonNodeContentLogger = async (node: TreeNode, logger: {log: (x: string) => Promise<void>}, spaces= ' ', stepSpaces= ' '): Promise<void> => {
    const propsSpaces = `${spaces}${stepSpaces}`;
    const childSpaces = `${propsSpaces}${stepSpaces}`;
    await logger.log(`${propsSpaces}"number": ${node.getNumber()},\n`);
    await logger.log(`${propsSpaces}"path": "${node.getPath()}"`);
    if (node.isTemplate()) {
        await logger.log(`,\n${propsSpaces}"template": `);
        await jsonFullNodeLogger((node as Template).element as TreeNode, logger, childSpaces, stepSpaces);
    } else {
        const contents = node.isMatrix() ? node.toJSON() : node.contents?.toJSON();
        if (node.isFunction()) {
            // add a fake function
            await logger.log(`,\n${propsSpaces}"func": null`);
        }
        if (contents) {
            await jsonContentLogger(contents, logger, propsSpaces, stepSpaces);
        }
    }
};

const jsonRootLogger = async (node: TreeNode, logger: {log: (x: string) => Promise<void>}, spaces= ' ', stepSpaces= ' '): Promise<void> => {
    await logger.log(`${spaces}[\n`);
    const elements = node.getChildren();
    if (elements != null) {
        const elementSpaces = `${spaces}${stepSpaces}`;
        let first = true;
        for (const element of elements) {
            if (first) {
                first = false;
            } else {
                await logger.log(`,\n`);
            }
            await jsonFullNodeLogger(element as TreeNode, logger, elementSpaces, stepSpaces);
        }
    }
    await logger.log(`\n${spaces}]\n`);
};

export const jsonFullNodeLogger = async (
    node: TreeNode,
    logger: {log: (x: string) => Promise<void>},
    spaces= ' ',
    stepSpaces= ' '): Promise<void> => {
    await logger.log(`${spaces}{\n`);
    const propsSpaces = `${spaces}${stepSpaces}`;
    await jsonNodeContentLogger(node, logger, propsSpaces, stepSpaces);
    await jsonChildrenLogger(node, logger, propsSpaces, stepSpaces);
    await logger.log(`\n${spaces}}`);
};

export const jsonNodeLogger = async (node: TreeNode, logger: {log: (x: string) => Promise<void>}, spaces= ' ', stepSpaces= ' '): Promise<void> => {
    await logger.log(`${spaces}{\n`);
    const propsSpaces = `${spaces}${stepSpaces}`;
    await jsonNodeContentLogger(node, logger, propsSpaces, stepSpaces);
    await logger.log(`\n${spaces}}`);
};

export const jsonTreeLogger = async (node: TreeNode, logger: {log: (x: string) => Promise<void>}, spaces= ' ', stepSpaces= ' '): Promise<void> => {
    if (node.getNumber() == null) {
        // Do not use isRoot() as template element is also considered a root.
        await jsonRootLogger(node, logger, spaces, stepSpaces);
    } else {
        await jsonFullNodeLogger(node, logger, spaces, stepSpaces);
    }
};

export const nodeLogger = async (node: TreeNode, logger: {log: (x: string) => Promise<void>}, spaces= ' ', stepSpaces= ' '): Promise<void> => {
    if (node.isRoot()) {
        await logger.log(`${spaces}- Root\n`);
        spaces = `${spaces}${stepSpaces}`;
        if (node.getResult() != null) {
            await logger.log(`{$spaces}result: ${JSON.stringify(node.getResult().toJSON())}\n`);
        }
        if (node.getStreams() != null) {
            await logger.log(`{$spaces}streams: ${JSON.stringify(node.getStreams().toJSON())}\n`);
        }
        const elements = node.getChildren();
        if (elements != null) {
            await logger.log(`${spaces} Elements:\n`);
            spaces = `${spaces}${stepSpaces}`;
            for (const element of elements) {
                await nodeLogger(element as TreeNode, logger, spaces, stepSpaces);
            }
        }
    } else {
        await logger.log(`${spaces}- ${node.constructor.name}\n`);
        spaces = `${spaces}${stepSpaces}`;
        await logger.log(`${spaces} number: ${node.getNumber()}\n`);
        await logger.log(`${spaces} path: ${node.getPath()}\n`);
        if (node.contents) {
            const contents = node.contents as { [index: string]: any };
            for (const prop of Object.keys(contents)) {
                const type = typeof contents[prop];
                if (type === 'string' || type === 'number') {
                    await logger.log(`${spaces} ${prop}:${contents[prop]}\n`);
                } else if (contents[prop] != null && contents[prop].toJSON != null) {
                    await logger.log(`${spaces} ${prop}:${JSON.stringify(contents[prop], null, ' ')}\n`);
                } else if (Array.isArray(contents[prop]) && contents[prop].length > 0 && contents[prop][0].toJSON != null) {
                    await logger.log(`${spaces} ${prop}:${JSON.stringify(contents[prop].map((x: any) => x.toJSON()), null, ' ')}\n`);
                } else {
                    await logger.log(`${spaces} ${prop}:${JSON.stringify(contents[prop], null, ' ')}\n`);
                }
            }
        }
        const elements = node.getChildren();
        if (elements != null) {
            await logger.log(`${spaces} Children:\n`);
            spaces = `${spaces}${stepSpaces}`;
            for (const element of elements) {
                await nodeLogger(element as TreeNode, logger, spaces, stepSpaces);
            }
        }
    }
};

const TreeNodeDecoders: {
    [index: number]:
    ((x: ExtendedReader) => TreeNode) |
    ((x: ExtendedReader) => Command)
} = {
    [Parameter.BERID]: Parameter.decode,
    [Node.BERID]: Node.decode,
    [Command.BERID]: Command.decode,
    [MatrixNode.BERID]: MatrixNode.decode,
    [Function.BERID]: Function.decode,
    [Template.BERID]: Template.decode,
    [QualifiedMatrix.BERID]: QualifiedMatrix.decode,
    [QualifiedParameter.BERID]: QualifiedParameter.decode,
    [QualifiedNode.BERID]: QualifiedNode.decode,
    [QualifiedFunction.BERID]: QualifiedFunction.decode,
    [QualifiedTemplate.BERID]: QualifiedTemplate.decode
};

export const childDecode = function (ber: ExtendedReader): TreeNode | Command  {
    const tag = ber.peek();
    const decode = TreeNodeDecoders[tag];
    if (decode == null) {
        throw new UnimplementedEmberTypeError(tag);
    } else {
        return decode(ber);
    }
};

TreeNode.decode = childDecode;

export const decodeBuffer = (packet: Buffer) => {
    const ber = new ExtendedReader(packet);
    return rootDecode(ber);
};

export const EmberLib = {
    decodeBuffer,
    TreeNode,
    Element,
    Node,
    Parameter,
    ParameterType,
    ParameterAccess,
    Function,
    FunctionArgument,
    MatrixNode,
    Invocation,
    InvocationResult,
    StreamCollection,
    Template,
    Command,
    QualifiedFunction,
    QualifiedMatrix,
    QualifiedNode,
    QualifiedParameter,
    QualifiedTemplate,
    Label,
    StreamDescription,
    StreamEntry,
    StreamFormat,
    StringIntegerPair,
    StringIntegerCollection
};
