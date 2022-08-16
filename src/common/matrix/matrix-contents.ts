import { MatrixType } from './matrix-type';
import { MatrixMode } from './matrix-mode';
import {
    ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT,
    EMBER_SEQUENCE, EMBER_SET, EMBER_STRING, EMBER_RELATIVE_OID
} from '../../ber';
import { Label, LabelInterface } from '../label';
import { UnimplementedEmberTypeError } from '../../error/errors';

export interface JMatrixContents {
    identifier?: string;
    description?: string;
    targetCount?: number;
    sourceCount?: number;
    maximumTotalConnects?: number;
    maximumConnectsPerTarget?: number;
    parametersLocation?: number|string;
    gainParameterNumber?: number;
    labels?: LabelInterface[];
    schemaIdentifiers?: string;
    templateReference?: string;
}

export class MatrixContents {
    public identifier?: string;
    public description?: string;
    public targetCount?: number;
    public sourceCount?: number;
    public maximumTotalConnects?: number;
    public maximumConnectsPerTarget?: number;
    public parametersLocation?: number | string;
    public gainParameterNumber?: number;
    public labels?: Label[];
    public schemaIdentifiers?: string;
    public templateReference?: string;
    constructor(public type: MatrixType = MatrixType.oneToN, public mode: MatrixMode = MatrixMode.linear) {
    }

    static decode(ber: Reader): MatrixContents {
        const mc = new MatrixContents();
        ber = ber.getSequence(EMBER_SET);
        while (ber.remain > 0) {
            let tag = ber.peek();
            let seq = ber.getSequence(tag);

            if (tag === CONTEXT(0)) {
                mc.identifier = seq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(1)) {
                mc.description = seq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(2)) {
                mc.type = seq.readInt();
            } else if (tag === CONTEXT(3)) {
                mc.mode = seq.readInt();
            } else if (tag === CONTEXT(4)) {
                mc.targetCount = seq.readInt();
            } else if (tag === CONTEXT(5)) {
                mc.sourceCount = seq.readInt();
            } else if (tag === CONTEXT(6)) {
                mc.maximumTotalConnects = seq.readInt();
            } else if (tag === CONTEXT(7)) {
                mc.maximumConnectsPerTarget = seq.readInt();
            } else if (tag === CONTEXT(8)) {
                tag = seq.peek();
                if (tag === EMBER_RELATIVE_OID) {
                    mc.parametersLocation = seq.readRelativeOID(EMBER_RELATIVE_OID); // 13 => relative OID
                } else {
                    mc.parametersLocation = seq.readInt();
                }
            } else if (tag === CONTEXT(9)) {
                mc.gainParameterNumber = seq.readInt();
            } else if (tag === CONTEXT(10)) {
                mc.labels = [];
                seq = seq.getSequence(EMBER_SEQUENCE);
                while (seq.remain > 0) {
                    const lSeq = seq.getSequence(CONTEXT(0));
                    mc.labels.push(Label.decode(lSeq));
                }
            } else if (tag === CONTEXT(11)) {
                mc.schemaIdentifiers = seq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(12)) {
                mc.templateReference = seq.readRelativeOID(EMBER_RELATIVE_OID);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }
        return mc;
    }

    encode(ber: Writer): void {
        ber.startSequence(EMBER_SET);
        if (this.identifier != null) {
            ber.startSequence(CONTEXT(0));
            ber.writeString(this.identifier, EMBER_STRING);
            ber.endSequence();
        }
        if (this.description != null) {
            ber.startSequence(CONTEXT(1));
            ber.writeString(this.description, EMBER_STRING);
            ber.endSequence();
        }
        if (this.type != null) {
            ber.startSequence(CONTEXT(2));
            ber.writeInt(this.type);
            ber.endSequence();
        }
        if (this.mode != null) {
            ber.startSequence(CONTEXT(3));
            ber.writeInt(this.mode);
            ber.endSequence();
        }
        if (this.targetCount != null) {
            ber.startSequence(CONTEXT(4));
            ber.writeInt(this.targetCount);
            ber.endSequence();
        }
        if (this.sourceCount != null) {
            ber.startSequence(CONTEXT(5));
            ber.writeInt(this.sourceCount);
            ber.endSequence();
        }
        if (this.maximumTotalConnects != null) {
            ber.startSequence(CONTEXT(6));
            ber.writeInt(this.maximumTotalConnects);
            ber.endSequence();
        }
        if (this.maximumConnectsPerTarget != null) {
            ber.startSequence(CONTEXT(7));
            ber.writeInt(this.maximumConnectsPerTarget);
            ber.endSequence();
        }
        if (this.parametersLocation != null) {
            ber.startSequence(CONTEXT(8));
            const param = Number(this.parametersLocation);
            if (isNaN(param)) {
                ber.writeRelativeOID(String(this.parametersLocation), EMBER_RELATIVE_OID);
            } else {
                ber.writeInt(param);
            }
            ber.endSequence();
        }
        if (this.gainParameterNumber != null) {
            ber.startSequence(CONTEXT(9));
            ber.writeInt(this.gainParameterNumber);
            ber.endSequence();
        }
        if (this.labels != null) {
            ber.startSequence(CONTEXT(10));
            ber.startSequence(EMBER_SEQUENCE);
            for (let i = 0; i < this.labels.length; i++) {
                ber.startSequence(CONTEXT(0));
                this.labels[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
        if (this.schemaIdentifiers != null) {
            ber.startSequence(CONTEXT(11));
            ber.writeString(this.schemaIdentifiers, EMBER_STRING);
            ber.endSequence();
        }
        if (this.templateReference != null) {
            ber.startSequence(CONTEXT(12));
            ber.writeRelativeOID(this.templateReference, EMBER_RELATIVE_OID);
            ber.endSequence();
        }
        ber.endSequence();
    }

    toJSON(res?: {[index: string]:  any}): JMatrixContents {
        const response: JMatrixContents = (res || {}) as JMatrixContents;
        response.identifier = this.identifier;
        response.description = this.description;
        response.targetCount = this.targetCount;
        response.sourceCount = this.sourceCount;
        response.maximumTotalConnects = this.maximumTotalConnects;
        response.maximumConnectsPerTarget = this.maximumConnectsPerTarget;
        response.parametersLocation = this.parametersLocation;
        response.gainParameterNumber = this.gainParameterNumber;
        response.labels = this.labels == null || this.labels.length === 0 ? [] : this.labels.map(l => l.toJSON());
        response.schemaIdentifiers = this.schemaIdentifiers;
        response.templateReference = this.templateReference;
        return response;
    }
}
