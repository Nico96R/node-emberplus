import { ExtendedReader as Reader, CONTEXT, APPLICATION } from '../ber';
import { Element } from './element';
import { ParameterContents } from './parameter-contents';
import { TreeNode } from './tree-node';
import { QualifiedParameter } from './qualified-parameter';
import { UnimplementedEmberTypeError, InvalidEmberNodeError } from '../error/errors';
import { ParameterType } from './parameter-type';
import { ParameterAccess } from './parameter-access';
import { StringIntegerCollection } from './string-integer-collection';
import { StreamDescription } from './stream/stream-description';

export interface JParameter {
    number: number;
    path: string;
    children?: Object[];
    //////// contents
    identifier?: string;
    description?: string;
    value?: string|number|boolean|Buffer;
    minimum?: string|number|boolean|Buffer;
    maximum?: string|number|boolean|Buffer;
    access?: string;
    format?: string;
    enumeration?: string;
    factor?: number;
    isOnline?: boolean;
    formula?: string;
    step?: number;
    default?: string|number|boolean|Buffer;
    type?: string;
    streamIdentifier?: number;
    enumMap?: object;
    streamDescriptor?: object;
    schemaIdentifiers?: string;
    templateReference?: string;
}

export class Parameter extends Element {

    static get BERID(): number {
        return APPLICATION(1);
    }

    get contents(): ParameterContents {
        return this._contents as ParameterContents;
    }

    get minimum(): string | number | boolean | Buffer | null {
        return this.contents?.minimum;
    }

    set minimum(minimum: string | number | boolean | Buffer) {
        this.setContent('minimum', minimum);
    }

    get maximum(): string | number | boolean | Buffer| null {
        return this.contents?.maximum;
    }

    set maximum(maximum: string | number | boolean | Buffer) {
        this.setContent('maximum', maximum);
    }

    get access(): ParameterAccess| null {
        return this.contents?.access;
    }

    set access(access: ParameterAccess) {
        this.setContent('access', access);
    }

    get format(): string| null {
        return this.contents?.format;
    }

    set format(format: string) {
        this.setContent('format', format);
    }

    get enumeration(): string| null {
        return this.contents?.enumeration;
    }

    set enumeration(enumeration: string) {
        this.setContent('enumeration', enumeration);
    }

    get factor(): number | null {
        return this.contents?.factor;
    }

    set factor(factor: number) {
        this.setContent('factor', factor);
    }

    get isOnline(): boolean|null {
        return this.contents?.isOnline;
    }
    set isOnline(isOnline: boolean) {
        this.setContent('isOnline', isOnline);
    }

    get formula(): string | null {
        return this.contents?.formula;
    }

    set formula(formula: string) {
        this.setContent('formula', formula);
    }

    get step(): number | null {
        return this.contents?.step;
    }

    set step(step: number) {
        this.setContent('step', step);
    }

    get default(): string | number | boolean | Buffer| null {
        return this.contents?.default;
    }

    set default(value: string | number | boolean | Buffer) {
        this.setContent('default', value);
    }

    get value(): string | number | boolean | Buffer| null {
        return this.contents?.value;
    }

    set value(value: string | number | boolean | Buffer) {
        this.setContent('value', value);
    }

    get streamIdentifier(): number | null {
        return this.contents?.streamIdentifier;
    }

    set streamIdentifier(streamIdentifier: number) {
        this.setContent('streamIdentifier', streamIdentifier);
    }

    get enumMap(): StringIntegerCollection | null {
        return this.contents?.enumMap;
    }

    set enumMap(enumMap: StringIntegerCollection) {
        this.setContent('enumMap', enumMap);
    }

    get streamDescriptor(): StreamDescription | null {
        return this.contents?.streamDescriptor;
    }

    set streamDescriptor(streamDescriptor: StreamDescription) {
        this.setContent('streamDescriptor', streamDescriptor);
    }

    get schemaIdentifiers(): string|null {
        return this.contents?.schemaIdentifiers;
    }

    set schemaIdentifiers(schemaIdentifiers: string) {
        this.setContent('schemaIdentifiers', schemaIdentifiers);
    }

    get type(): ParameterType | null {
        return this.contents?.type;
    }

    set type(type: ParameterType) {
        this.setContent('type', type);
    }

    constructor(number: number, type?: ParameterType, value?: number|string|Buffer|boolean) {
        super(number);
        this._seqID = Parameter.BERID;
        if (type != null) {
            this.setContents(new ParameterContents(type, value));
        }
    }

    static decode(ber: Reader): Parameter {
        const p = new Parameter(0);
        ber = ber.getSequence(Parameter.BERID);

        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                p.setNumber(seq.readInt());
            } else if (tag === CONTEXT(1)) {
                p.setContents(ParameterContents.decode(seq));
            } else if (tag === CONTEXT(2)) {
                p.decodeChildren(seq);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return p;
    }

    isParameter(): boolean {
        return true;
    }

    isStream(): boolean {
        return this.contents != null &&
            (this.contents as ParameterContents).streamIdentifier != null;
    }

    setValue(value: ParameterContents| number | string | boolean | Buffer): TreeNode {
        return this.getTreeBranch(undefined, (m: TreeNode) => {
            (m as Parameter).setContents(
                (value instanceof ParameterContents) ? value : ParameterContents.createParameterContent(value));
        });
    }

    toQualified(): QualifiedParameter {
        const qp = new QualifiedParameter(this.getPath());
        qp.update(this);
        return qp;
    }
}
