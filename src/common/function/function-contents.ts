import {
    ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, EMBER_STRING, EMBER_SET,
    EMBER_SEQUENCE, EMBER_RELATIVE_OID
} from '../../ber';
import { FunctionArgument, JFunctionArgument } from './function-argument';
import { UnimplementedEmberTypeError } from '../../error/errors';

export interface JFunctionContents {
    identifier: string;
    description: string;
    arguments: JFunctionArgument[];
    result: JFunctionArgument[];
    templateReference: string;
}

export class FunctionContents {
    private _arguments: FunctionArgument[];
    private _result: FunctionArgument[];
    private _templateReference?: string;

    constructor(private _identifier?: string, private _description?: string) {
        this._arguments = [];
        this._result = [];
    }

    get identifier(): string {
        return this._identifier;
    }

    set identifier(value: string) {
        this._identifier = value;
    }

    get description(): string {
        return this._description;
    }

    set description(description: string) {
        this._description = description;
    }

    get arguments(): FunctionArgument[] {
        return this._arguments;
    }

    set arguments(value: FunctionArgument[]) {
        this._arguments = value;
    }

    get result(): FunctionArgument[] {
        return this._result;
    }

    set result(result: FunctionArgument[]) {
        this._result = result;
    }

    get templateReference(): string {
        return this._templateReference;
    }

    set templateReference(value: string) {
        this._templateReference = value;
    }

    static decode(ber: Reader): FunctionContents {

        const fc = new FunctionContents();
        ber = ber.getSequence(EMBER_SET);
        while (ber.remain > 0) {
            let tag = ber.peek();
            let seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                fc._identifier = seq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(1)) {
                fc._description = seq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(2)) {
                fc._arguments = [];
                const dataSeq = seq.getSequence(EMBER_SEQUENCE);
                while (dataSeq.remain > 0) {
                    seq = dataSeq.getSequence(CONTEXT(0));
                    fc._arguments.push(FunctionArgument.decode(seq));
                }
            } else if (tag === CONTEXT(3)) {
                fc._result = [];
                const dataSeq = seq.getSequence(EMBER_SEQUENCE);
                while (dataSeq.remain > 0) {
                    tag = dataSeq.peek();
                    if (tag === CONTEXT(0)) {
                        const fcSeq = dataSeq.getSequence(tag);
                        fc.result.push(FunctionArgument.decode(fcSeq));
                    } else {
                        throw new UnimplementedEmberTypeError(tag);
                    }
                }
            } else if (tag === CONTEXT(4)) {
                fc.templateReference = seq.readRelativeOID(EMBER_RELATIVE_OID);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }

        return fc;
    }

    encode(ber: Writer): void {
        ber.startSequence(EMBER_SET);

        if (this.identifier != null) {
            ber.startSequence(CONTEXT(0));
            ber.writeString(this.identifier, EMBER_STRING);
            ber.endSequence(); // CONTEXT(0)
        }

        if (this.description != null) {
            ber.startSequence(CONTEXT(1));
            ber.writeString(this.description, EMBER_STRING);
            ber.endSequence(); // CONTEXT(1)
        }

        if (this.arguments != null) {
            ber.startSequence(CONTEXT(2));
            ber.startSequence(EMBER_SEQUENCE);
            for (let i = 0; i < this.arguments.length; i++) {
                ber.startSequence(CONTEXT(0));
                this.arguments[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence(); // CONTEXT(2)
        }

        if (this.result != null && this.result.length > 0) {
            ber.startSequence(CONTEXT(3));
            ber.startSequence(EMBER_SEQUENCE);
            for (let i = 0; i < this.result.length; i++) {
                ber.startSequence(CONTEXT(0));
                /** @type {FunctionArgument} */
                this.result[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence(); // CONTEXT(3)
        }

        if (this.templateReference != null) {
            ber.startSequence(CONTEXT(4));
            ber.writeRelativeOID(this.templateReference, EMBER_RELATIVE_OID);
            ber.endSequence(); // CONTEXT(3)
        }

        ber.endSequence(); // EMBER_SET
    }

    toJSON(): JFunctionContents {
        return {
            identifier: this.identifier,
            description: this.description,
            arguments: this.arguments.map(a => a.toJSON()),
            result: this.result.map(r => r.toJSON()),
            templateReference: this.templateReference
        };
    }
}
