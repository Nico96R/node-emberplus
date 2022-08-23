'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const parameter_type_1 = require("./parameter-type");
const parameter_access_1 = require("./parameter-access");
const ber_1 = require("../ber");
const string_integer_collection_1 = require("./string-integer-collection");
const stream_description_1 = require("./stream/stream-description");
const errors_1 = require("../error/errors");
class ParameterContents {
    constructor(type, value) {
        this.type = type;
        this.value = value;
        if (type != null && isNaN(Number(type))) {
            throw new errors_1.InvalidEmberNodeError(`Invalid parameter type ${type}`);
        }
    }
    static createParameterContent(value) {
        if (typeof value === 'string') {
            return new ParameterContents(parameter_type_1.ParameterType.string, value);
        }
        else if (typeof value === 'boolean') {
            return new ParameterContents(parameter_type_1.ParameterType.boolean, value);
        }
        else if (typeof value === 'number') {
            if (Math.round(value) === value) {
                return new ParameterContents(parameter_type_1.ParameterType.integer, value);
            }
            else {
                return new ParameterContents(parameter_type_1.ParameterType.real, value);
            }
        }
        else if (value instanceof Buffer) {
            return new ParameterContents(parameter_type_1.ParameterType.octets, value);
        }
        throw new errors_1.UnsupportedValueError(value);
    }
    static decode(ber) {
        const pc = new ParameterContents();
        ber = ber.getSequence(ber_1.EMBER_SET);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            switch (tag) {
                case ber_1.CONTEXT(0):
                    pc.identifier = seq.readString(ber_1.EMBER_STRING);
                    break;
                case ber_1.CONTEXT(1):
                    pc.description = seq.readString(ber_1.EMBER_STRING);
                    break;
                case ber_1.CONTEXT(2):
                    pc.value = seq.readValue();
                    break;
                case ber_1.CONTEXT(3):
                    pc.minimum = seq.readValue();
                    break;
                case ber_1.CONTEXT(4):
                    pc.maximum = seq.readValue();
                    break;
                case ber_1.CONTEXT(5):
                    pc.access = seq.readInt();
                    break;
                case ber_1.CONTEXT(6):
                    pc.format = seq.readString(ber_1.EMBER_STRING);
                    break;
                case ber_1.CONTEXT(7):
                    pc.enumeration = seq.readString(ber_1.EMBER_STRING);
                    break;
                case ber_1.CONTEXT(8):
                    pc.factor = seq.readInt();
                    break;
                case ber_1.CONTEXT(9):
                    pc.isOnline = seq.readBoolean();
                    break;
                case ber_1.CONTEXT(10):
                    pc.formula = seq.readString(ber_1.EMBER_STRING);
                    break;
                case ber_1.CONTEXT(11):
                    pc.step = seq.readInt();
                    break;
                case ber_1.CONTEXT(12):
                    pc.default = seq.readValue();
                    break;
                case ber_1.CONTEXT(13):
                    pc.type = seq.readInt();
                    break;
                case ber_1.CONTEXT(14):
                    pc.streamIdentifier = seq.readInt();
                    break;
                case ber_1.CONTEXT(15):
                    pc.enumMap = string_integer_collection_1.StringIntegerCollection.decode(seq);
                    break;
                case ber_1.CONTEXT(16):
                    pc.streamDescriptor = stream_description_1.StreamDescription.decode(seq);
                    break;
                case ber_1.CONTEXT(17):
                    pc.schemaIdentifiers = seq.readString(ber_1.EMBER_STRING);
                    break;
                case ber_1.CONTEXT(18):
                    pc.templateReference = seq.readRelativeOID(ber_1.EMBER_RELATIVE_OID);
                    break;
                default:
                    throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return pc;
    }
    encode(ber) {
        ber.startSequence(ber_1.EMBER_SET);
        ber.writeIfDefined(this.identifier, ber.writeString, 0, ber_1.EMBER_STRING);
        ber.writeIfDefined(this.description, ber.writeString, 1, ber_1.EMBER_STRING);
        ber.writeIfDefined(this.value, ber.writeValue, 2);
        ber.writeIfDefined(this.minimum, ber.writeValue, 3);
        ber.writeIfDefined(this.maximum, ber.writeValue, 4);
        ber.writeIfDefined(this.access, ber.writeInt, 5);
        ber.writeIfDefined(this.format, ber.writeString, 6, ber_1.EMBER_STRING);
        ber.writeIfDefined(this.enumeration, ber.writeString, 7, ber_1.EMBER_STRING);
        ber.writeIfDefined(this.factor, ber.writeInt, 8);
        ber.writeIfDefined(this.isOnline, ber.writeBoolean, 9);
        ber.writeIfDefined(this.formula, ber.writeString, 10, ber_1.EMBER_STRING);
        ber.writeIfDefined(this.step, ber.writeInt, 11);
        ber.writeIfDefined(this.default, ber.writeValue, 12);
        ber.writeIfDefined(this.type, ber.writeInt, 13);
        ber.writeIfDefined(this.streamIdentifier, ber.writeInt, 14);
        if (this.enumMap != null) {
            ber.startSequence(ber_1.CONTEXT(15));
            this.enumMap.encode(ber);
            ber.endSequence();
        }
        if (this.streamDescriptor != null) {
            ber.startSequence(ber_1.CONTEXT(16));
            this.streamDescriptor.encode(ber);
            ber.endSequence();
        }
        ber.writeIfDefined(this.schemaIdentifiers, ber.writeString, 17, ber_1.EMBER_STRING);
        ber.writeIfDefined(this.templateReference, ber.writeRelativeOID, 18, ber_1.EMBER_RELATIVE_OID);
        ber.endSequence();
    }
    toJSON(res) {
        var _a, _b;
        const response = (res || {});
        response.identifier = this.identifier,
            response.description = this.description,
            response.value = this.value,
            response.minimum = this.minimum,
            response.maximum = this.maximum,
            response.access = parameter_access_1.parameterAccessToString(this.access == null ? parameter_access_1.ParameterAccess.none : this.access),
            response.format = this.format,
            response.enumeration = this.enumeration,
            response.factor = this.factor,
            response.isOnline = this.isOnline,
            response.formula = this.formula,
            response.step = this.step,
            response.default = this.default,
            response.type = parameter_type_1.parameterTypeToString(this.type ? this.type : parameter_type_1.ParameterType.string),
            response.streamIdentifier = this.streamIdentifier,
            response.enumMap = (_a = this.enumMap) === null || _a === void 0 ? void 0 : _a.toJSON(),
            response.streamDescriptor = (_b = this.streamDescriptor) === null || _b === void 0 ? void 0 : _b.toJSON(),
            response.schemaIdentifiers = this.schemaIdentifiers,
            response.templateReference = this.templateReference;
        return response;
    }
}
exports.ParameterContents = ParameterContents;
//# sourceMappingURL=parameter-contents.js.map