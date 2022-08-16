import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION } from '../../ber';
import { Element } from '../element';
import { FunctionArgument, JFunctionArgument } from './function-argument';
import { FunctionContents } from './function-contents';
import { QualifiedFunction } from './qualified-function';
import { UnimplementedEmberTypeError } from '../../error/errors';

export type FunctionCallBack = (args: FunctionArgument[]) => FunctionArgument[];

export interface JFunction {
    number: number;
    path: string;
    children: object[];
    identifier: string;
    description: string;
    arguments: JFunctionArgument[];
    result: JFunctionArgument[];
    templateReference: string;
}

export class Function extends Element {
    get contents(): FunctionContents {
        return this._contents as FunctionContents;
    }

    get func(): FunctionCallBack {
        return this._func;
    }

    get arguments(): FunctionArgument[] {
        return this.contents?.arguments;
    }

    set arguments(value: FunctionArgument[]) {
        this.setContent('arguments', value);
    }

    get result(): FunctionArgument[] {
        return this.contents?.result;
    }

    get templateReference(): string {
        return this.contents?.templateReference;
    }

    set templateReference(value: string) {
        this.setContent('templateReference', value);
    }

    constructor(number: number, private _func?: FunctionCallBack, identifier?: string) {
        super(number);
        this._seqID = Function.BERID;
        if (identifier != null) {
            this.setContents(new FunctionContents(identifier));
        }
    }

    static decode(ber: Reader): Function {
        const f = new Function(0);
        ber = ber.getSequence(Function.BERID);

        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                f.setNumber(seq.readInt());
            } else if (tag === CONTEXT(1)) {
                f.setContents(FunctionContents.decode(seq));
            } else if (tag === CONTEXT(2)) {
                f.decodeChildren(seq);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return f;
    }

    isFunction(): boolean {
        return true;
    }

    toQualified(): QualifiedFunction {
        const qf = new QualifiedFunction(this.getPath(), this.func);
        qf.update(this);
        return qf;
    }

    static get BERID(): number {
        return APPLICATION(19);
    }
}
