import {
    ExtendedReader as Reader,
    ExtendedWriter as Writer,
    CONTEXT, APPLICATION, EMBER_SEQUENCE
} from '../ber';
import { FunctionArgument, IFunctionArgument, JFunctionArgument } from './function/function-argument';
import { ParameterTypeToBERTAG, ParameterTypeFromBERTAG } from './parameter-type';
import { UnimplementedEmberTypeError } from '../error/errors';

let _id = 1;

export interface IInvocation  {
    id: number;
    arguments: IFunctionArgument[];
}

export interface JInvocation {
    id: number;
    arguments: JFunctionArgument[];
}

export class Invocation {

    public arguments: FunctionArgument[];

    constructor(public id?: number, args?: FunctionArgument[]) {
        this.arguments = args;
    }

    static decode(ber: Reader): Invocation {
        const invocation = new Invocation();
        ber = ber.getSequence(Invocation.BERID);
        while (ber.remain > 0) {
            let tag = ber.peek();
            let seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                invocation.id = seq.readInt();
            } else if (tag === CONTEXT(1)) {
                invocation.arguments = [];
                seq = seq.getSequence(EMBER_SEQUENCE);
                while (seq.remain > 0) {
                    const dataSeq = seq.getSequence(CONTEXT(0));
                    tag = dataSeq.peek();
                    const val = dataSeq.readValue();
                    invocation.arguments.push(
                        new FunctionArgument(ParameterTypeFromBERTAG(tag), val)
                    );
                }
            } else {
                // TODO: options
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return invocation;
    }

    static newInvocationID(): number {
        return _id++;
    }

    encode(ber: Writer): void {
        ber.startSequence(Invocation.BERID);
        if (this.id != null) {
            ber.startSequence(CONTEXT(0));
            ber.writeInt(this.id);
            ber.endSequence();
        }
        if (this.arguments != null) {
            ber.startSequence(CONTEXT(1));
            ber.startSequence(EMBER_SEQUENCE);
            for (let i = 0; i < this.arguments.length; i++) {
                ber.startSequence(CONTEXT(0));
                ber.writeValue(
                    this.arguments[i].value,
                    ParameterTypeToBERTAG(this.arguments[i].type
                    ));
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }

        ber.endSequence(); // APPLICATION(22)
    }

    toJSON(): JInvocation {
        return {
            id: this.id,
            arguments: this.arguments?.map(a => a.toJSON())
        };
    }

    static get BERID(): number {
        return APPLICATION(22);
    }
}
