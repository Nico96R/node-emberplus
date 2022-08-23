"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matrix_type_1 = require("./matrix-type");
const matrix_mode_1 = require("./matrix-mode");
const ber_1 = require("../../ber");
const label_1 = require("../label");
const errors_1 = require("../../error/errors");
class MatrixContents {
    constructor(type = matrix_type_1.MatrixType.oneToN, mode = matrix_mode_1.MatrixMode.linear) {
        this.type = type;
        this.mode = mode;
    }
    static decode(ber) {
        const mc = new MatrixContents();
        ber = ber.getSequence(ber_1.EMBER_SET);
        while (ber.remain > 0) {
            let tag = ber.peek();
            let seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                mc.identifier = seq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(1)) {
                mc.description = seq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(2)) {
                mc.type = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(3)) {
                mc.mode = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(4)) {
                mc.targetCount = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(5)) {
                mc.sourceCount = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(6)) {
                mc.maximumTotalConnects = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(7)) {
                mc.maximumConnectsPerTarget = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(8)) {
                tag = seq.peek();
                if (tag === ber_1.EMBER_RELATIVE_OID) {
                    mc.parametersLocation = seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID);
                }
                else {
                    mc.parametersLocation = seq.readInt();
                }
            }
            else if (tag === ber_1.CONTEXT(9)) {
                mc.gainParameterNumber = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(10)) {
                mc.labels = [];
                seq = seq.getSequence(ber_1.EMBER_SEQUENCE);
                while (seq.remain > 0) {
                    const lSeq = seq.getSequence(ber_1.CONTEXT(0));
                    mc.labels.push(label_1.Label.decode(lSeq));
                }
            }
            else if (tag === ber_1.CONTEXT(11)) {
                mc.schemaIdentifiers = seq.readString(ber_1.EMBER_STRING);
            }
            else if (tag === ber_1.CONTEXT(12)) {
                mc.templateReference = seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return mc;
    }
    encode(ber) {
        ber.startSequence(ber_1.EMBER_SET);
        if (this.identifier != null) {
            ber.startSequence(ber_1.CONTEXT(0));
            ber.writeString(this.identifier, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        if (this.description != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            ber.writeString(this.description, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        if (this.type != null) {
            ber.startSequence(ber_1.CONTEXT(2));
            ber.writeInt(this.type);
            ber.endSequence();
        }
        if (this.mode != null) {
            ber.startSequence(ber_1.CONTEXT(3));
            ber.writeInt(this.mode);
            ber.endSequence();
        }
        if (this.targetCount != null) {
            ber.startSequence(ber_1.CONTEXT(4));
            ber.writeInt(this.targetCount);
            ber.endSequence();
        }
        if (this.sourceCount != null) {
            ber.startSequence(ber_1.CONTEXT(5));
            ber.writeInt(this.sourceCount);
            ber.endSequence();
        }
        if (this.maximumTotalConnects != null) {
            ber.startSequence(ber_1.CONTEXT(6));
            ber.writeInt(this.maximumTotalConnects);
            ber.endSequence();
        }
        if (this.maximumConnectsPerTarget != null) {
            ber.startSequence(ber_1.CONTEXT(7));
            ber.writeInt(this.maximumConnectsPerTarget);
            ber.endSequence();
        }
        if (this.parametersLocation != null) {
            ber.startSequence(ber_1.CONTEXT(8));
            const param = Number(this.parametersLocation);
            if (isNaN(param)) {
                ber.writeRelativeOID(String(this.parametersLocation), ber_1.EMBER_RELATIVE_OID);
            }
            else {
                ber.writeInt(param);
            }
            ber.endSequence();
        }
        if (this.gainParameterNumber != null) {
            ber.startSequence(ber_1.CONTEXT(9));
            ber.writeInt(this.gainParameterNumber);
            ber.endSequence();
        }
        if (this.labels != null) {
            ber.startSequence(ber_1.CONTEXT(10));
            ber.startSequence(ber_1.EMBER_SEQUENCE);
            for (let i = 0; i < this.labels.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                this.labels[i].encode(ber);
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
        if (this.schemaIdentifiers != null) {
            ber.startSequence(ber_1.CONTEXT(11));
            ber.writeString(this.schemaIdentifiers, ber_1.EMBER_STRING);
            ber.endSequence();
        }
        if (this.templateReference != null) {
            ber.startSequence(ber_1.CONTEXT(12));
            ber.writeRelativeOID(this.templateReference, ber_1.EMBER_RELATIVE_OID);
            ber.endSequence();
        }
        ber.endSequence();
    }
    toJSON(res) {
        const response = (res || {});
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
exports.MatrixContents = MatrixContents;
//# sourceMappingURL=matrix-contents.js.map