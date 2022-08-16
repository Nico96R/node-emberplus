import { ExtendedWriter as Writer, ExtendedReader as Reader, CONTEXT, APPLICATION, EMBER_SEQUENCE } from '../ber';
import { ParameterTypeFromBERTAG, ParameterTypeToBERTAG } from './parameter-type';
import { FunctionArgument, JFunctionArgument } from './function/function-argument';
import { UnimplementedEmberTypeError } from '../error/errors';
import { ElementBase } from './element.base';

export interface InvocationResultInterface {
    invocationId: number;
    success: boolean;
    result: JFunctionArgument[];
}

export class InvocationResult extends ElementBase {

    constructor(public invocationId?: number, public success?: boolean, public result?: FunctionArgument[]) {
        super();
    }

    static decode(ber: Reader): InvocationResult {
        const invocationResult = new InvocationResult();
        ber = ber.getSequence(InvocationResult.BERID);
        while (ber.remain > 0) {
            let tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) { // invocationId
                invocationResult.invocationId = seq.readInt();
            } else if (tag === CONTEXT(1)) {  // success
                invocationResult.success = seq.readBoolean();
            } else if (tag === CONTEXT(2)) {
                invocationResult.result = [];
                const res = seq.getSequence(EMBER_SEQUENCE);
                while (res.remain > 0) {
                    tag = res.peek();
                    if (tag === CONTEXT(0)) {
                        const resTag = res.getSequence(CONTEXT(0));
                        tag = resTag.peek();
                        invocationResult.result.push(
                            new FunctionArgument(
                                ParameterTypeFromBERTAG(tag),
                                resTag.readValue()
                            ));
                    } else {
                        throw new UnimplementedEmberTypeError(tag);
                    }
                }
                continue;
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }

        return invocationResult;
    }

    encode(ber: Writer): void {
        ber.startSequence(InvocationResult.BERID);
        if (this.invocationId != null) {
            ber.startSequence(CONTEXT(0));
            ber.writeInt(this.invocationId);
            ber.endSequence();
        }
        if (this.success != null) {
            ber.startSequence(CONTEXT(1));
            ber.writeBoolean(this.success);
            ber.endSequence();
        }
        if (this.result != null && this.result.length) {
            ber.startSequence(CONTEXT(2));
            ber.startSequence(EMBER_SEQUENCE);
            for (let i = 0; i < this.result.length; i++) {
                ber.startSequence(CONTEXT(0));
                ber.writeValue(this.result[i].value, ParameterTypeToBERTAG(this.result[i].type));
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
        ber.endSequence(); // APPLICATION(23)}
    }

    isInvocationResult(): boolean {
        return true;
    }

    setFailure(): void {
        this.success = false;
    }

    setSuccess(): void {
        this.success = true;
    }

    setResult(result: FunctionArgument[]): void {
        this.result = result;
    }

    toJSON(): InvocationResultInterface {
        return {
            invocationId: this.invocationId,
            success: this.success,
            result: this.result == null ? [] : this.result.map(r => r.toJSON())
        };
    }

    toQualified(): InvocationResult {
        return this;
    }

    static get BERID(): number {
        return APPLICATION(23);
    }

}
