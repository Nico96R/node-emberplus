import { ParameterType } from './parameter-type';
import * as BER from '../ber';
import { UnimplementedEmberTypeError } from '../error/errors';
import { TreeNode } from './tree-node';
import { Node } from './node';
import { COMMAND_GETDIRECTORY } from './constants';
import { Command } from './command';
import { Invocation } from './invocation';
import { FunctionArgument } from './function/function-argument';
import { decodeBuffer } from './common';
import { InvocationResult } from './invocation-result';
import { testErrorReturned } from '../fixture/utils';

describe('Command', () => {
    it('should throw error if unknown context found', () => {
        testErrorReturned(
            () => {
                const writer = new BER.ExtendedWriter();
                writer.startSequence(BER.APPLICATION(2));
                writer.startSequence(BER.CONTEXT(0));
                writer.writeInt(COMMAND_GETDIRECTORY);
                writer.endSequence(); // BER.CONTEXT(0)
                writer.startSequence(BER.CONTEXT(1));
                writer.writeInt(0);
                writer.endSequence();
                writer.startSequence(BER.CONTEXT(3));
                writer.writeInt(0);
                writer.endSequence();
                writer.endSequence(); // BER.APPLICATION(2)
                Command.decode(new BER.ExtendedReader(writer.buffer));
        }, UnimplementedEmberTypeError);
    });
    it('should have a toJSON', () => {
        const command = new Command(COMMAND_GETDIRECTORY);
        let jsonCommand = command.toJSON();
        expect(jsonCommand.number).toBe(COMMAND_GETDIRECTORY);
        command.invocation = new Invocation(1, [
            new FunctionArgument(ParameterType.integer, 1, 'arg1')
        ]);
        jsonCommand = command.toJSON();
        expect(jsonCommand.invocation?.arguments.length).toBe(1);
    });
    it('should throw an error if unable to decode', () => {
        testErrorReturned(
            () => {
                const writer = new BER.ExtendedWriter();
                writer.startSequence(Command.BERID);
                writer.startSequence(BER.CONTEXT(99));
                writer.endSequence();
                writer.endSequence();
                Command.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
    });
    it('should have a getElementByIdentifier', () => {
        const _identifier = 'node_identifier';
        const _description = 'node_description';
        const node = new Node(0, _identifier);
        node.contents.description = _description;
        const root = new TreeNode();
        root.addElement(node);
        let res = root.getElementByIdentifier(_identifier);
        expect(res).toBeDefined();
        expect(res.contents?.identifier).toBe(_identifier);

        res = root.getElementByIdentifier('unknown');
        expect(res).toBe(null);

        // Should return null if no children
        res = node.getElementByIdentifier(_identifier);
        expect(res).toBe(null);
    });
    describe('rootDecode', () => {
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    TreeNode.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should throw an error if InvocationResult as child', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.APPLICATION(0));
                    writer.startSequence(BER.APPLICATION(11));
                    writer.startSequence(BER.CONTEXT(0));
                    const invocationResult = new InvocationResult(7);
                    invocationResult.encode(writer);
                    writer.endSequence();
                    writer.endSequence();
                    writer.endSequence();
                    decodeBuffer(writer.buffer);
            }, UnimplementedEmberTypeError);
        });
    });
});
