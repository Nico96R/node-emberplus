import {ExtendedReader as Reader, CONTEXT, APPLICATION, EMBER_RELATIVE_OID } from '../../ber';
import { QualifiedElement } from '../qualified-element';
import { FunctionContents } from './function-contents';
import { FunctionArgument } from './function-argument';
import { UnimplementedEmberTypeError } from '../../error/errors';
import { Function } from './function';

export class QualifiedFunction extends QualifiedElement {

    static get BERID(): number {
        return APPLICATION(20);
    }

    get contents(): FunctionContents {
        return this._contents as FunctionContents;
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

    constructor(path: string, public func?: (x: FunctionArgument[]) => FunctionArgument[], identifier?: string) {
        super(path);
        this.func = func;
        this._seqID = QualifiedFunction.BERID;
        if (identifier != null) {
            this.setContents(new FunctionContents(identifier));
        }
    }

    static decode(ber: Reader): QualifiedFunction {
        const qf = new QualifiedFunction('');
        ber = ber.getSequence(QualifiedFunction.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                qf.setPath(seq.readRelativeOID(EMBER_RELATIVE_OID));
            } else if (tag === CONTEXT(1)) {
                qf.setContents(FunctionContents.decode(seq));
            } else if (tag === CONTEXT(2)) {
                qf.decodeChildren(seq);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return qf;
    }

    isFunction(): boolean {
        return true;
    }

    toElement(): Function {
        const element = new Function(this.getNumber(), this.func);
        element.update(this);
        return element;
    }
}
