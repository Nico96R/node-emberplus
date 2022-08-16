import { ExtendedReader as Reader, CONTEXT, APPLICATION, EMBER_RELATIVE_OID } from '../ber';
import { QualifiedElement } from './qualified-element';
import { ParameterContents } from './parameter-contents';
import { TreeNode } from './tree-node';
import { UnimplementedEmberTypeError } from '../error/errors';
import { ParameterType } from './parameter-type';
import { StringIntegerCollection } from './string-integer-collection';
import { StreamDescription } from './stream/stream-description';
import { ParameterAccess } from './parameter-access';
import { Parameter } from './parameter';
import { Element } from './element';

export class QualifiedParameter extends QualifiedElement {

    static get BERID(): number {
        return APPLICATION(9);
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

    constructor(path: string, type?: ParameterType, value?: number|string|Buffer|boolean) {
        super(path);
        this._seqID = QualifiedParameter.BERID;
        if (type != null) {
            this.setContents(new ParameterContents(type, value));
        }
    }

    static decode(ber: Reader): QualifiedParameter {
        const qp = new QualifiedParameter('');
        ber = ber.getSequence(QualifiedParameter.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                qp.setPath(seq.readRelativeOID(EMBER_RELATIVE_OID));
            } else if (tag === CONTEXT(1)) {
                qp.setContents(ParameterContents.decode(seq));
            } else if (tag === CONTEXT(2)) {
                qp.decodeChildren(seq);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return qp;
    }

    isParameter(): boolean {
        return true;
    }
    isStream(): boolean {
        return this.contents != null &&
            (this.contents as ParameterContents).streamIdentifier != null;
    }

    /**
     * Generate a Root containing a minimal  QualifiedParameter and its new value.
     * Should be sent to the Provider to update the value.
     */
    setValue(value: number | ParameterContents): TreeNode {
        const r = this.getNewTree();
        const qp = new QualifiedParameter(this.path);
        r.addElement(qp);
        qp.setContents((value instanceof ParameterContents) ? value : new ParameterContents(ParameterType.integer, value));
        return r;
    }

    toElement(): Parameter {
        const element = new Parameter(this.getNumber());
        element.update(this);
        return element;
    }
}
