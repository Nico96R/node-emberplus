import {
    ExtendedReader as Reader,
    ExtendedWriter as Writer,
    CONTEXT, APPLICATION, EMBER_STRING
} from '../../ber';
import { ParameterType, parameterTypeToString } from '../parameter-type';
import { UnimplementedEmberTypeError, InvalidEmberNodeError } from '../../error/errors';

/*
TupleDescription ::=
 SEQUENCE OF [0] TupleItemDescription
TupleItemDescription ::=
 [APPLICATION 21] IMPLICIT
 SEQUENCE {
 type [0] ParameterType,
 name [1] EmberString OPTIONAL
 }
Invocation ::=
 [APPLICATION 22] IMPLICIT
 SEQUENCE {
 invocationId [0] Integer32 OPTIONAL,
 arguments [1] Tuple OPTIONAL
 }
Tuple ::=
 SEQUENCE OF [0] Value
*/

export interface IFunctionArgument {
    type: ParameterType;
    name: string;
    value: any;
}

export interface JFunctionArgument {
    type: string;
    name: string;
    value: any;
}

export class FunctionArgument {

    constructor(private _type: ParameterType, private _value?: any, private _name?: string) {
        if (isNaN(Number(_type))) {
            throw new InvalidEmberNodeError(`Invalid Function type ${_type}`);
        }
        if (_name != null && typeof(_name) !== 'string') {
            throw new InvalidEmberNodeError(`Invalid Function name ${_name}`);
        }
    }

    get value(): any {
        return this._value;
    }

    set value(value: any) {
        this._value = value;
    }

    get type(): ParameterType {
        return this._type;
    }

    get name(): string {
        return this._name;
    }

    static decode(ber: Reader): FunctionArgument {
        const tuple: IFunctionArgument = {type: null, name: null, value: null};
        ber = ber.getSequence(FunctionArgument.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                tuple.type = seq.readInt();
            } else if (tag === CONTEXT(1)) {
                tuple.name = seq.readString(EMBER_STRING);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return new FunctionArgument(tuple.type, tuple.value, tuple.name);
    }

    encode(ber: Writer): void {
        ber.startSequence(FunctionArgument.BERID);
        if (this.type == null) {
            throw new InvalidEmberNodeError('', 'FunctionArgument requires a type');
        }
        ber.startSequence(CONTEXT(0));
        ber.writeInt(this.type);
        ber.endSequence();
        if (this.name != null) {
            ber.startSequence(CONTEXT(1));
            ber.writeString(this.name, EMBER_STRING);
            ber.endSequence();
        }
        ber.endSequence();
    }

    toJSON(): JFunctionArgument {
        return {
            type: parameterTypeToString(this.type),
            name: this.name,
            value: this.value
        };
    }

    static get BERID(): number {
        return APPLICATION(21);
    }

}
