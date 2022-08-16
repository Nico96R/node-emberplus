import { ParameterType } from './parameter-type';
import * as BER from '../ber';
import { UnimplementedEmberTypeError, InvalidEmberNodeError } from '../error/errors';
import { Node } from './node';
import { FunctionArgument } from './function/function-argument';
import { Function as EmberFunction } from './function/function';
import { FunctionContents } from './function/function-contents';
import { QualifiedFunction } from './function/qualified-function';
import { TreeNode } from './tree-node';
import { decodeBuffer } from '../common/common';
import { testErrorReturned } from '../fixture/utils';

const identifier = 'node_identifier';
const description = 'node_description';

describe('Function', () => {
    describe('Generic', () => {
        let func: EmberFunction;
        beforeEach(() => {
            func = new EmberFunction(0, (args: any) => {
                const res = new FunctionArgument(ParameterType.integer, args[0].value + args[1].value);
                return [res];
            }, identifier);
            func.description = description;
        });

        it('should be able to encode FunctionArgument with no name', () => {
            const res = new FunctionArgument(ParameterType.integer);
            const writer = new BER.ExtendedWriter();
            res.encode(writer);
            expect(writer.buffer.length > 0).toBeTruthy();
        });

        it('should throw an Error  if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(EmberFunction.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence(); // BER.CONTEXT(0)
                    writer.endSequence(); // BER.CONTEXT(0)
                    EmberFunction.decode(new BER.ExtendedReader(writer.buffer));
                },
                UnimplementedEmberTypeError
            );
        });

        it('should return true when calling isFunction', () => {
            expect(func.isFunction()).toBeTruthy();
        });

        it('should have an invoke function', () => {
            const invoke = func.invoke([]);
            const children = invoke.getChildren();
            expect(children.length).toBe(1);
            expect(children[0].isCommand()).toBeTruthy();
        });

        it('should be able to encode/decode result properly', () => {
            const buf = '6082008c6b820088a04e744ca0050d03010401a1433141a0050c03616464a2243022a00f750da003020101a1060c0461726731a00f750da003020101a1060c0461726732a3123010a00e750ca003020101a1050c0373756da01a7418a0050d03010402a10f310da00b0c09646f4e6f7468696e67a01a6a18a0050d03010403a10f310da00b0c096c6963656e73696e67';
            const root: TreeNode = decodeBuffer(Buffer.from(buf, 'hex')) as TreeNode;
            expect(root).toBeDefined();
            const _func = root.getElementByPath('1.4.1');
            expect(_func).toBeDefined();
            expect(_func.contents).toBeDefined();
            expect((_func.contents as FunctionContents).result).toBeDefined();

        });

        it('should have a encoder/decoder', () => {
            func.templateReference = '1.2.3';
            func.addChild(new Node(1));
            func.arguments = [
                new FunctionArgument(ParameterType.integer, null, 'arg1'),
                new FunctionArgument(ParameterType.integer, null, 'arg2')
            ];
            (<any>func.contents)._result = [    // Trick result has only a getter
                new FunctionArgument(ParameterType.integer, null, 'result')
            ];
            let writer = new BER.ExtendedWriter();
            func.encode(writer);
            let f = EmberFunction.decode(new BER.ExtendedReader(writer.buffer));
            expect(f.number).toBe(func.number);
            expect(f.identifier).toBe(identifier);
            expect(f.description).toBe(description);
            expect(f.result.length).toBe(1);
            expect(f.templateReference).toBe(func.templateReference);

            writer = new BER.ExtendedWriter();
            func.identifier = null;
            func.arguments = null;
            (<any>func.contents)._result = null;    // Trick result has only a getter
            func.encode(writer);
            f = EmberFunction.decode(new BER.ExtendedReader(writer.buffer));
            expect(f.number).toBe(func.number);
            expect(f.identifier == null).toBeTruthy();
            expect(f.result == null || f.result.length === 0).toBeTruthy();
        });

        it('should throw an error if unable to decode result', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.EMBER_SET);
                    writer.startSequence(BER.CONTEXT(3));
                    writer.startSequence(BER.EMBER_SEQUENCE);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    writer.endSequence();
                    writer.endSequence();
                    FunctionContents.decode(new BER.ExtendedReader(writer.buffer));
                },
                UnimplementedEmberTypeError
            );
        });

        it('should throw an error if unable to decode content', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.EMBER_SET);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    FunctionContents.decode(new BER.ExtendedReader(writer.buffer));
                },
                UnimplementedEmberTypeError
            );
        });

        it('should throw an error if unable to decode FunctionArgument', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(FunctionArgument.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    FunctionArgument.decode(new BER.ExtendedReader(writer.buffer));
                },
                UnimplementedEmberTypeError
            );
        });
    });

    describe('QualifiedFunction', () => {
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(QualifiedFunction.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    QualifiedFunction.decode(new BER.ExtendedReader(writer.buffer));
                },
                UnimplementedEmberTypeError
            );
        });
    });
    describe('NodeContent properties directly accessible from Node/QualifiedNode', () => {
        const path = '0.1.10';
        const value = 'zero';
        const number = 10;
        it('should provide getter and setter for each property', () => {
            const functions = [
                new QualifiedFunction(path, (ar: FunctionArgument[]) => [], identifier),
                new EmberFunction(number, (ar: FunctionArgument[]) => [], identifier)
            ];
            for (const emberFunction of functions) {
                emberFunction.arguments = [new FunctionArgument(ParameterType.integer)];
                expect(emberFunction.arguments.length).toBe(1);
                expect(emberFunction.contents.arguments.length).toBe(1);
                emberFunction.templateReference = value;
                expect(emberFunction.templateReference).toBe(value);
                expect(emberFunction.contents.templateReference).toBe(value);
            }
        });
        it('should return undefined if no contents defined and trying to access property', () => {
            const functions = [
                new QualifiedFunction(path),
                new EmberFunction(number)
            ];
            for (const emberFunction of functions) {
                expect(emberFunction.arguments).not.toBeDefined();
                expect(emberFunction.templateReference).not.toBeDefined();
                expect(emberFunction.result).not.toBeDefined();
            }
        });
        it('should throw an error if trying to set a property and no contents defined', () => {
            const functions = [
                new QualifiedFunction(path),
                new EmberFunction(number)
            ];
            for (const emberFunction of functions) {
                testErrorReturned(
                    () => {
                        emberFunction.templateReference = value;
                }, InvalidEmberNodeError);
            }
        });
    });
    describe('FunctionArgument properties', () => {
        const name = 'arg1';
        const value = true;
        it('should provide getter and setter for each property', () => {
            const functionArguments = new FunctionArgument(ParameterType.boolean, true, name);
            expect(functionArguments.type).toBe(ParameterType.boolean);
            expect(functionArguments.value).toBe(value);
            expect(functionArguments.name).toBe(name);
            functionArguments.value = false;
            expect(functionArguments.value).toBe(false);
        });
    });
});
