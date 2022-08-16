import { S101Socket } from '../socket/s101.socket';
const s101Buffer = Buffer.from('fe000e0001c001021f026082008d6b820089a0176a15a0050d03010201a10c310aa0080c066c6162656c73a01b6a19a0050d03010202a110310ea00c0c0a706172616d6574657273a051714fa0050d03010203a1463144a0080c066d6174726978a403020104a503020104aa183016a0147212a0050d03010201a1090c075072696d617279a203020102a303020101a8050d03010202a903020101f24cff', 'hex');
const errorBuffer = Buffer.from('76fe000e0001c001021f026082008d6b820089a0176a15a0050d03010201a10c310aa0080c066c6162656c73a01b6a19a0050d03010202a110310ea00c0c0a706172616d6574657273a051714fa0050d03010203a1463144a0080c066d6174726978a403020104a503020104aa183016a0147212a0050d03010201a1090c075072696d617279a203020102a303020101a8050d03010202a903020101f24cff', 'hex');
import { parameterTypeFromString, ParameterType} from './parameter-type';

import * as BER from '../ber';
import { UnimplementedEmberTypeError, InvalidFunctionCallError, InvalidEmberNodeError} from '../error/errors';
import { TreeNode } from './tree-node';
import { StreamCollection } from './stream/stream-collection';
import { StreamEntry } from './stream/stream-entry';
import { MatrixType } from './matrix/matrix-type';
import { MatrixMode } from './matrix/matrix-mode';
import { Parameter } from './parameter';
import { Node } from './node';
import { MatrixNode } from './matrix/matrix-node';
import { QualifiedParameter } from './qualified-parameter';
import { decodeBuffer, nodeLogger } from './common';
import { InvocationResult } from './invocation-result';
import { COMMAND_GETDIRECTORY } from './constants';
import { Command } from './command';
import { QualifiedNode } from './qualified-node';
import { QualifiedMatrix } from './matrix/qualified-matrix';
import { QualifiedFunction } from './function/qualified-function';
import { QualifiedTemplate } from './qualified-template';
import { FunctionArgument } from './function/function-argument';
import { testErrorReturned } from '../fixture/utils';
import { Label } from './label';

describe('Generic', () => {
    let client: S101Socket;

    beforeEach(() => {
        client = new S101Socket();
    });

    it('should parse S101 message without error', (done) => {
        client.on('emberPacket', () => {
            done();
        });
        client.on('error', e => {
            // eslint-disable-next-line no-console
            console.log(e);
            expect(e).toBeUndefined();
            done();
        });
        client.codec.dataIn(s101Buffer);
    });

    it('should handle Errors in message', () => {
        const ber = new BER.ExtendedReader(errorBuffer);
        expect(() => TreeNode.decode(ber)).toThrow(UnimplementedEmberTypeError);
    });

    it('should have a toJSON()', () => {
        const ID1 = 123456;
        const VALUE1 = 'value1';
        const node = new Node(0);
        const streamCollection = new StreamCollection();
        streamCollection.addEntry(new StreamEntry(ID1, VALUE1));
        node.setStreams(streamCollection);
        const node2 = new Node(0);
        node.addChild(node2);
        node2.addChild(new Parameter(1));
        const matrix = new MatrixNode(2, 'matrix', MatrixType.oneToN, MatrixMode.nonLinear);
        matrix.targets = [0, 3, 6, 7];
        matrix.sources = [2, 6, 8];
        node2.addChild(matrix);
        node.setResult(new InvocationResult(1));
        const js = node.toJSON();
        expect(js).toBeDefined();
        expect(js.result).toBeDefined();
        expect(js.streams).toBeDefined();
        expect(js.streams.length).toBe(streamCollection.size());
        expect(js.streams[0].identifier).toBe(ID1);
        expect(js.streams[0].value).toBe(VALUE1);
        expect(js.elements.length).toBe(1);
        expect(js.elements[0].number).toBe(0);
        expect(js.elements[0].children[0].number).toBe(1);
        expect(js.elements[0].children[1].number).toBe(2);
        expect(js.elements[0].children[1].targets.length).toBe(matrix.targets.length);
    });

    it('should have a nodeLogger', async () => {
        const ID1 = 123456;
        const VALUE1 = 'value1';
        const node = new Node(0);
        const streamCollection = new StreamCollection();
        streamCollection.addEntry(new StreamEntry(ID1, VALUE1));
        node.setStreams(streamCollection);
        const node2 = new Node(0);
        node.addChild(node2);
        node2.addChild(new Parameter(1));
        const matrix = new MatrixNode(2, 'matrix', MatrixType.oneToN, MatrixMode.nonLinear);
        matrix.targets = [0, 3, 6, 7];
        matrix.sources = [2, 6, 8];
        matrix.labels = [new Label('1.2', 'L1')];
        node2.addChild(matrix);
        node.setResult(new InvocationResult(1));
        let count = 0;
        const log = await nodeLogger(node, {log: async (x: string): Promise<void> => {count++; }});
        expect(count).not.toBe(0);
    });

    it('should have a getElement()', () => {
        const node = new Node(0);
        node.addChild(new Node(0));
        const res = node.getElement(0);
        expect(res).toBeDefined();
    });

    it('should have a isCommand(), isRoot() ... functions', () => {
        const root = new TreeNode();
        const node = new Node(0);
        root.addElement(node);
        expect(node.isCommand()).toBeFalsy();
        expect(node.isRoot()).toBeFalsy();
        expect(node.isStream()).toBeFalsy();
        expect(node.isTemplate()).toBeFalsy();
    });

    it('should have function getElement', () => {
        const _identifier = 'node_identifier';
        const _description = 'node_description';
        const node = new Node(0, _identifier);
        node.description = _description;
        const root = new TreeNode();
        root.addElement(node);
        let res: TreeNode = root.getElement(_identifier) as TreeNode;
        expect(res).toBeDefined();
        expect(res.identifier).toBe(_identifier);
        // Command should be ignored when looking for identifier to avoid crash
        root.addElement(new Command(COMMAND_GETDIRECTORY));
        // search something wrong to make sure to parse all elements including the command
        res = root.getElement(_description) as TreeNode;
        expect(res).toBe(null);
    });

    it('should have a getMinimalContent that works for Element and QualifiedElement', () => {
        const identifier = 'node_identifier';
        const node = new Node(0, identifier);
        const minNode = node.getMinimalContent();
        expect(minNode).toBeDefined();
        expect(minNode.number).toBe(node.number);
        expect(minNode.contents).toBeDefined();
    });

    it('should throw error if function getElement called from a node with longer path', () => {
        const root = new TreeNode();
        root.addChild(new Node(0));
        (root.getElement(0) as TreeNode).addChild(new Node(1));
        root.getElementByPath('0.1').addChild(new Node(1));
        const _identifier = 'node_identifier';
        const _description = 'node_description';
        const node = new Node(0, _identifier);
        node.description = _description;
        root.getElementByPath('0.1.1').addChild(node);

        let res = root.getElementByPath('0.1').getElementByPath('0');
        expect(res).toBe(null);

        res = root.getElementByPath('0.1').getElementByPath('0.2.0');
        expect(res).toBe(null);

        res = root.getElementByPath('0.1').getElementByPath('0.1');
        expect(res).toBeDefined();
    });

    it('should have a getRoot function', () => {
        const root = new TreeNode();
        root.addChild(new Node(0));
        (root.getElement(0) as TreeNode).addChild(new Node(1));
        root.getElementByPath('0.1').addChild(new Node(1));
        const node = new Node(0);
        root.getElementByPath('0.1.1').addChild(node);
        const res = node.getRoot();
        expect(res).toBe(root);
    });

    it('should have a getDirectory() and accept a callback for subscribers', () => {
        const parameter = new Parameter(0, parameterTypeFromString('integer'), 7);
        const res = parameter.getDirectory((x: TreeNode) => { });
        expect(res).toBeDefined();
        expect(parameter.getSubscribersCount()).toBe(1);
    });

    it('should have a subscribe() and accept a callback for subscribers', () => {
        const parameter = new Parameter(0, parameterTypeFromString('integer'), 7);
        parameter.streamIdentifier = 12345;
        const res = parameter.subscribe((x: TreeNode) => { });
        expect(res).toBeDefined();
        expect(parameter.getSubscribersCount()).toBe(1);
    });

    it('should have a getDuplicate function', () => {
        const parameter = new Parameter(0, parameterTypeFromString('string'), 'test') ;
        let res = parameter.getDuplicate();
        expect(res).toBeDefined();

        const qp = new QualifiedParameter('0.1', parameterTypeFromString('string'), 'test');
        res = qp.getDuplicate();
        expect(res).toBeDefined();
    });

    it('should decode continuation messages', () => {
        const writer = new BER.ExtendedWriter();
        writer.startSequence(BER.CONTEXT(0));
        const qp = new QualifiedParameter('0.1');
        qp.encode(writer);
        writer.endSequence();
        const res: TreeNode = decodeBuffer(writer.buffer) as TreeNode;
        expect(res).toBeDefined();
        expect(res.getElementByPath('0.1')).toBeDefined();
    });

    it('should throw an error if not able to decode root', () => {
        testErrorReturned(
            () => {
                const writer = new BER.ExtendedWriter();
                writer.startSequence(BER.CONTEXT(0));
                writer.startSequence(BER.CONTEXT(99));
                writer.endSequence();
                writer.endSequence();
                TreeNode.decode(new BER.ExtendedReader(writer.buffer));
            },
            UnimplementedEmberTypeError
        );

        testErrorReturned(
            () => {
                const writer = new BER.ExtendedWriter();
                writer.startSequence(BER.CONTEXT(99));
                writer.endSequence();
                TreeNode.decode(new BER.ExtendedReader(writer.buffer));
            },
            UnimplementedEmberTypeError
        );

        testErrorReturned(
            () => {
                const writer = new BER.ExtendedWriter();
                writer.startSequence(BER.APPLICATION(0));
                writer.startSequence(BER.CONTEXT(99));
                writer.endSequence();
                writer.endSequence();
                TreeNode.decode(new BER.ExtendedReader(writer.buffer));
            },
            UnimplementedEmberTypeError
        );
    });
    it('should have a toElement() for each qualified element type', () => {
        const node_identifier = 'node_identifier';
        const qNode = new QualifiedNode('0.1.2', node_identifier);
        const node = qNode.toElement();
        expect(node).toBeDefined();
        expect(node.identifier).toBe(qNode.identifier);

        const matrix_identifier = 'matrix_identifier';
        const qMatrix = new QualifiedMatrix('0.1.2', matrix_identifier);
        const matrix = qMatrix.toElement();
        expect(matrix).toBeDefined();
        expect(matrix.identifier).toBe(qMatrix.identifier);

        const function_identifier = 'function_identifier';
        const qFunction = new QualifiedFunction(
            '0.1.2',
            (x: FunctionArgument[]) => [],
            function_identifier
        );
        const functionElement = qFunction.toElement();
        expect(functionElement).toBeDefined();
        expect(functionElement.identifier).toBe(qFunction.identifier);

        const parameter_identifier = 'parameter_identifier';
        const qParam = new QualifiedParameter('0.1.2', ParameterType.integer);
        qParam.identifier = parameter_identifier;
        const param = qParam.toElement();
        expect(param).toBeDefined();
        expect(param.identifier).toBe(qParam.identifier);

        const qTemplate = new QualifiedTemplate('0.1.2', param);
        const template = qTemplate.toElement();
        expect(template).toBeDefined();
        expect(template.element).toBe(qTemplate.element);
    });
    it('should have a function to convert a tree to contain only Element', () => {
        const root = new TreeNode();
        const node = new Node(0);
        const qNode = new QualifiedNode('0.0');
        node.addChild(qNode);
        node.addChild(new QualifiedMatrix('0.1', 'matrix', MatrixType.nToN, MatrixMode.nonLinear));
        qNode.addChild(new QualifiedParameter('0.0.1', ParameterType.string, 'value'));
        root.addChild(node);
        root.addChild(new QualifiedParameter('1', ParameterType.integer, 10));
        const elementRoot = TreeNode.createElementTree(root);
        const validateElement = (element: TreeNode) => {
            expect(element.isQualified()).toBeFalsy();
            const children: TreeNode[] = element.getChildren() as TreeNode[];
            if (children == null) { return; }
            for (const child of children) {
                validateElement(child as TreeNode);
            }
        };
        validateElement(elementRoot);
    });
    it('should not attempt to call toQualified on TreeNode directly', () => {
        testErrorReturned(
            () => {
                const root = new TreeNode();
                root.toQualified();
            },
            InvalidFunctionCallError
        );
    });
    it('should throw an error if trying to setResult or getResult on non-root', () => {
        const root = new TreeNode();
        const node = new Node(0);
        root.addChild(node);
        testErrorReturned(
            () => {
                node.setResult(new InvocationResult(0));
            },
            InvalidEmberNodeError
        );
        testErrorReturned(
            () => {
                node.getResult();
            },
            InvalidEmberNodeError
        );
    });
    it('should throw error if decoded children is invalid', () => {
        testErrorReturned(
            () => {
                const writer = new BER.ExtendedWriter();
                writer.startSequence(BER.APPLICATION(4));
                writer.startSequence(BER.CONTEXT(0));
                writer.endSequence();
                writer.endSequence();
                const root = new TreeNode();
                (root as {[index: string]: any}).decodeChildren(writer);
            },
            InvalidEmberNodeError
        );
        testErrorReturned(
            () => {
                const writer = new BER.ExtendedWriter();
                writer.startSequence(BER.APPLICATION(4));
                writer.startSequence(BER.CONTEXT(0));
                const iresult = new InvocationResult();
                iresult.encode(writer);
                writer.endSequence();
                writer.endSequence();
                const root = new TreeNode();
                (root as {[index: string]: any}).decodeChildren(writer);
            },
            InvalidEmberNodeError
        );
    });
});
