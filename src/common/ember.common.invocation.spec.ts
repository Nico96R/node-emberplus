import * as BER from '../ber';
import { UnimplementedEmberTypeError } from '../error/errors';
import { Invocation } from './invocation';
import { FunctionArgument } from './function/function-argument';
import { InvocationResult } from './invocation-result';
import { ParameterType } from './parameter-type';
import { testErrorReturned } from '../fixture/utils';
describe('Invocation', () => {
    describe('Generic', () => {
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(Invocation.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    Invocation.decode(new BER.ExtendedReader(writer.buffer));
                }, UnimplementedEmberTypeError);
        });

        it('should be able to encode even if no id', () => {
            const invocation = new Invocation();
            const writer = new BER.ExtendedWriter();
            invocation.encode(writer);
            const i = Invocation.decode(new BER.ExtendedReader(writer.buffer));
            expect(i.id == null).toBeTruthy();
        });

        it('should have a toJSON', () => {
            const invocation = new Invocation(1, [
                new FunctionArgument(ParameterType.integer, 10, 'arg1')
            ]);
            let js = invocation.toJSON();
            expect(js.id).toBe(invocation.id);
            expect(js.arguments.length).toBe(invocation.arguments.length);
            invocation.arguments = null;
            js = invocation.toJSON();
            expect(js.id).toBe(invocation.id);
            expect(js.arguments).not.toBeDefined();
        });
    });
    describe('InvocationResult', () => {
        it('should support all types of result', () => {
            const invocationResult = new InvocationResult();
            invocationResult.invocationId = 100;
            const valBuf = [0xa, 0x1, 0x2];
            invocationResult.setFailure();
            expect(invocationResult.success).toBeFalsy();
            invocationResult.setSuccess();
            expect(invocationResult.success).toBeTruthy();
            expect(invocationResult.toQualified()).toBe(invocationResult);
            invocationResult.setResult([
                new FunctionArgument(ParameterType.integer, 1),
                new FunctionArgument(ParameterType.real, 1.1),
                new FunctionArgument(ParameterType.string, 'one'),
                new FunctionArgument(ParameterType.boolean, false),
                new FunctionArgument(ParameterType.octets, Buffer.from(valBuf))
            ]);
            const writer = new BER.ExtendedWriter();
            invocationResult.encode(writer);
            const newInvocationRes = InvocationResult.decode(new BER.ExtendedReader(writer.buffer));
            expect(newInvocationRes.success).toBe(invocationResult.success);
            expect(newInvocationRes.invocationId).toBe(invocationResult.invocationId);
            expect(newInvocationRes.result.length).toBe(invocationResult.result.length);
            expect(newInvocationRes.result[4].value.length).toBe(valBuf.length);
            expect(newInvocationRes.result[4].value[0]).toBe(valBuf[0]);
        });

        it('should have a toJSON function', () => {
            const invocationResult = new InvocationResult();
            invocationResult.invocationId = 100;
            invocationResult.setSuccess();
            invocationResult.setResult([
                new FunctionArgument(ParameterType.integer, 1),
                new FunctionArgument(ParameterType.real, 1.1),
                new FunctionArgument(ParameterType.string, 'one'),
                new FunctionArgument(ParameterType.boolean, false)
            ]);
            const js = invocationResult.toJSON();
            expect(js.success).toBeDefined();
            expect(js.success).toBeTruthy();
            expect(js.result).toBeDefined();
        });

        it('should be able to encode with not result, no success', () => {
            const invocationResult: InvocationResult = new InvocationResult();
            invocationResult.invocationId = 100;
            invocationResult.result = null;
            invocationResult.success = null;
            const writer = new BER.ExtendedWriter();
            invocationResult.encode(writer);
            const newInvocationRes = InvocationResult.decode(new BER.ExtendedReader(writer.buffer));
            expect(newInvocationRes.result).not.toBeDefined();
        });

        it('should be able to encode with no invocationId', () => {
            const invocationResult = new InvocationResult();
            invocationResult.invocationId = null;
            invocationResult.result = null;
            invocationResult.success = null;
            const writer = new BER.ExtendedWriter();
            invocationResult.encode(writer);
            const newInvocationRes = InvocationResult.decode(new BER.ExtendedReader(writer.buffer));
            expect(newInvocationRes.invocationId == null).toBeTruthy();
        });

        it('should throw an error if can\'t decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(InvocationResult.BERID);
                    writer.startSequence(BER.CONTEXT(3));
                    writer.endSequence();
                    writer.endSequence();
                    InvocationResult.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(InvocationResult.BERID);
                    writer.startSequence(BER.CONTEXT(2));
                    writer.startSequence(BER.EMBER_SEQUENCE);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    writer.endSequence();
                    writer.endSequence();
                    InvocationResult.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });
    });
});
