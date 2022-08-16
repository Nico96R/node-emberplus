import * as BER from '../ber';
import { UnimplementedEmberTypeError, InvalidEmberNodeError } from '../error/errors';
import { Node } from './node';
import { NodeContents } from './node-contents';
import { QualifiedNode } from './qualified-node';
import { testErrorReturned } from '../fixture/utils';
import { TreeNode } from './tree-node';
import { createTreeBranch, decodeBuffer } from './common';
import { Writer } from 'gdnet-asn1';

const identifier = 'node_identifier';
const description = 'node_description';

describe('Node', () => {
    describe('Generic', () => {
        it('should have an encoder', () => {
            const node = new Node(0, identifier);
            node.description = description;
            (node.contents as NodeContents).isRoot = true;
            node.isOnline = true;
            node.schemaIdentifiers = 'schema1';
            const root = new Node(0);
            root.addChild(node);
            let writer = new BER.ExtendedWriter();
            root.encode(writer);
            expect(writer.buffer.length).not.toBe(0);
            node.isOnline = null;
            node.identifier = null;
            writer = new BER.ExtendedWriter();
            root.encode(writer);
            expect(writer.buffer.length).not.toBe(0);
        });

        it('should have a decoder', () => {
            const node = new Node(0, identifier);
            node.description = description;
            (node.contents as NodeContents).isRoot = true;
            node.isOnline = true;
            node.schemaIdentifiers = 'schema1';
            const writer = new BER.ExtendedWriter();
            node.encode(writer);
            const n = Node.decode(new BER.ExtendedReader(writer.buffer));
            expect(n.number).toBe(node.number);
            expect(n.identifier).toBe(identifier);
            expect(n.description).toBe(description);
        });

        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(Node.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    Node.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should throw an error if unable to decode content', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.EMBER_SET);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    NodeContents.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should have createTreeBranch', () => {
            const root = new TreeNode();
            const qn = createTreeBranch(root, '0.5.1000');
            console.log(root);
            let path = qn.getPath();
            console.log(path, qn);
            expect(path).toBe('0.5.1000');
            const qnChild = new QualifiedNode('0.5.1000.1', 'qnchild');
            qn.addChild(qnChild);
            path = qnChild.getPath();
            expect(path).toBe('0.5.1000.1');
            const getDir = qnChild.getDirectory(null);
            console.log(getDir);
            const writer = new BER.ExtendedWriter();
            getDir.encode(writer);
            console.log(writer.buffer);
            const reader = new BER.ExtendedReader(writer.buffer);
            const res = decodeBuffer(reader.buffer);
            console.log(res);
        });
    });

    describe('QualifiedNode', () => {
        const PATH = '0.1.2';
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(QualifiedNode.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    QualifiedNode.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should return true to isNode() call', () => {
            const qNode = new QualifiedNode(PATH);
            expect(qNode.isNode()).toBeTruthy();
        });
    });
    describe('NodeContent properties directly accessible from Node/QualifiedNode', () => {
        const path = '0.1.10';
        const value = 'zero';
        const number = 10;
        it('should provide getter and setter for each property', () => {
            const nodes = [
                new QualifiedNode(path, identifier),
                new Node(number, identifier)
            ];
            for (const node of nodes) {
                node.schemaIdentifiers = value;
                expect(node.schemaIdentifiers).toBe(value);
                expect(node.contents.schemaIdentifiers).toBe(value);
                node.isOnline = true;
                expect(node.isOnline).toBeTruthy();
                expect(node.contents.isOnline).toBeTruthy();
            }
        });
        it('should return undefined if no contents defined and trying to access property', () => {
            const nodes = [
                new QualifiedNode(path),
                new Node(number)
            ];
            for (const node of nodes) {
                expect(node.isOnline).not.toBeDefined();
                expect(node.schemaIdentifiers).not.toBeDefined();
            }
        });
        it('should throw an error if trying to set a property and no contents defined', () => {
            const nodes = [
                new QualifiedNode(path),
                new Node(number)
            ];
            for (const node of nodes) {
                testErrorReturned(
                    () => {
                        node.isOnline = true;
                }, InvalidEmberNodeError);
            }
        });
    });
});
