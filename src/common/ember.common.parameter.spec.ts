import { parameterTypeFromString, ParameterTypeToBERTAG, ParameterTypeFromBERTAG, ParameterType } from './parameter-type';
import * as BER from '../ber';
import { UnimplementedEmberTypeError, InvalidEmberNodeError, InvalidBERFormatError, UnsupportedValueError } from '../error/errors';
import { Parameter } from './parameter';
import { Node } from './node';
import { ParameterContents } from './parameter-contents';
import { QualifiedParameter } from './qualified-parameter';
import { ParameterAccess } from './parameter-access';
import { StringIntegerCollection } from './string-integer-collection';
import { StringIntegerPair } from './string-integer-pair';
import { StreamFormat } from './stream/stream-format';
import { StreamDescription } from './stream/stream-description';
import { childDecode } from './common';
import { StreamCollection } from './stream/stream-collection';
import { testErrorReturned } from '../fixture/utils';

describe('Parameter', () => {
    describe('Generic', () => {
        it('should through an error if decoding unknown parameter type', () => {
            testErrorReturned(
                () => {
                    ParameterTypeFromBERTAG(99);
            }, InvalidBERFormatError);
            testErrorReturned(
                () => {
                    ParameterTypeToBERTAG(99 as ParameterType);
            }, InvalidEmberNodeError);
        });

        it('should have an update function', () => {
            const VALUE = 1;
            const NEW_VALUE = VALUE + 1;
            const parameter = new Parameter(0, parameterTypeFromString('integer'), VALUE);
            const newParameter = new Parameter(0, parameterTypeFromString('integer'), NEW_VALUE);
            parameter.update(newParameter);
            expect(parameter.value).toBe(NEW_VALUE);
        });

        it('should have setValue function', () => {
            const VALUE = 1;
            const parameter = new Parameter(0, parameterTypeFromString('integer'), VALUE);
            let NEW_VALUE = VALUE + 1;
            let setVal = parameter.setValue(NEW_VALUE);
            expect((setVal.contents as ParameterContents).value).toBe(NEW_VALUE);
            NEW_VALUE = NEW_VALUE + 1;
            setVal = parameter.setValue(new ParameterContents(ParameterType.integer, NEW_VALUE));
            expect((setVal.contents as ParameterContents).value).toBe(NEW_VALUE);
        });

        // @TODO: Unit test failing
        it('should have decoder function', () => {
            const VALUE = 1;
            const parameter = new Parameter(0, parameterTypeFromString('integer'), VALUE);
            parameter.minimum = 0;
            parameter.maximum = 100;
            parameter.access = ParameterAccess.readWrite;
            parameter.format = 'db';
            parameter.factor = 10;
            parameter.isOnline = true;
            parameter.formula = 'x10';
            const STEP = 2;
            parameter.step = STEP;
            const DEFAULT = 0;
            parameter.default = DEFAULT;
            parameter.type = ParameterType.integer;
            parameter.enumeration = 'enumeration';
            parameter.description = 'description';
            parameter.enumMap = new StringIntegerCollection();
            const KEY = 'one';
            const KEY_VAL = 1;
            parameter.enumMap.addEntry(KEY, new StringIntegerPair(KEY, KEY_VAL));

            const OFFSET = 4;
            parameter.streamDescriptor = new StreamDescription(StreamFormat.signedInt8, OFFSET);

            const SCHEMA = 'schema';
            parameter.schemaIdentifiers = SCHEMA;
            const node = new Node(0);
            parameter.addChild(node);
            const writer = new BER.ExtendedWriter();
            parameter.encode(writer);
            const newParameter = childDecode(new BER.ExtendedReader(writer.buffer)) as Parameter;
            expect(newParameter.getChildren()).toHaveLength(1);
            expect(newParameter.streamDescriptor?.offset).toBe(OFFSET);
            expect(newParameter.step).toBe(STEP);
            expect(newParameter.default).toBe(DEFAULT);
            expect(newParameter.enumMap?.get(KEY).value).toBe(KEY_VAL);
            expect(newParameter.schemaIdentifiers).toBe(SCHEMA);
        });

        it('should support type real', () => {
            const VALUE = 1.1;
            const parameter = new Parameter(0, parameterTypeFromString('real'), VALUE);
            const writer = new BER.ExtendedWriter();
            parameter.encode(writer);
            const newParameter = Parameter.decode(new BER.ExtendedReader(writer.buffer));
            expect(newParameter.value).toBe(VALUE);
        });

        it('should keep type real even if integer value', () => {
            const VALUE = 1;
            const parameter = new Parameter(0, parameterTypeFromString('real'), VALUE);
            const writer = new BER.ExtendedWriter();
            parameter.encode(writer);
            const newParameter = Parameter.decode(new BER.ExtendedReader(writer.buffer));
            expect(newParameter.value).toBe(VALUE);
            expect(newParameter.type).toBe(ParameterType.real);
        });

        it('should support type string', () => {
            const VALUE = 'string support';
            const parameter = new Parameter(0, parameterTypeFromString('string'), VALUE);
            const writer = new BER.ExtendedWriter();
            parameter.encode(writer);
            const newParameter = Parameter.decode(new BER.ExtendedReader(writer.buffer));
            expect(newParameter.value).toBe(VALUE);
        });

        it('should support type boolean', () => {
            const VALUE = true;
            const parameter = new Parameter(0, parameterTypeFromString('boolean'), VALUE);
            const writer = new BER.ExtendedWriter();
            parameter.encode(writer);
            const newParameter = Parameter.decode(new BER.ExtendedReader(writer.buffer));
            expect(newParameter.value).toBe(VALUE);
        });

        it('should throw an error if fails to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(Parameter.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    Parameter.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should throw an error if fails to decode StringIntegerPair', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(StringIntegerPair.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    StringIntegerPair.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should throw an error if fails to decode StringIntegerCollection', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(StringIntegerCollection.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    StringIntegerCollection.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should throw an error if fails to decode ParameterContents', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.EMBER_SET);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    ParameterContents.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });
    });

    describe('QualifiedParameter', () => {
        const PATH = '0.1.2';
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(QualifiedParameter.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    QualifiedParameter.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should return true to isParameter() call', () => {
            const qNode = new QualifiedParameter(PATH);
            expect(qNode.isParameter()).toBeTruthy();
        });

        it('should have setValue function', () => {
            const VALUE = 1;
            const qp = new QualifiedParameter(PATH, parameterTypeFromString('integer'), VALUE);
            let NEW_VALUE = VALUE + 1;
            let setVal = qp.setValue(NEW_VALUE);
            const dup: Parameter = setVal.getElementByPath(PATH) as Parameter;
            expect(dup).toBeDefined();
            expect(dup.contents.value).toBe(NEW_VALUE);
            NEW_VALUE = NEW_VALUE + 1;
            setVal = qp.setValue(new ParameterContents(ParameterType.integer, NEW_VALUE));
            expect((setVal.getElementByPath(PATH) as Parameter).contents.value).toBe(NEW_VALUE);
        });

        it('should accept subscribers and have a function to update them', async () => {
            const VALUE = 1;
            const qp = new QualifiedParameter(PATH, parameterTypeFromString('integer'), VALUE);
            qp.streamIdentifier = 12345;
            const updatePromise = new Promise(resolve => qp.subscribe((param) => resolve((param as Parameter).contents.value)));
            qp.updateSubscribers();
            const updatedValue = await updatePromise;
            expect(updatedValue).toBe(VALUE);
        });
    });
    describe('createParameterContent', () => {
        it('should detect the correct type from the value passed', () => {
            const integerValue = 7;
            const stringValue = 'textvalue';
            const booleanValue = true;
            const bufferValue = Buffer.alloc(4);
            const realValue = 2.1415829;

            let paramContent = ParameterContents.createParameterContent(integerValue);
            expect(paramContent.type).toBe(ParameterType.integer);

            paramContent = ParameterContents.createParameterContent(stringValue);
            expect(paramContent.type).toBe(ParameterType.string);

            paramContent = ParameterContents.createParameterContent(booleanValue);
            expect(paramContent.type).toBe(ParameterType.boolean);

            paramContent = ParameterContents.createParameterContent(bufferValue);
            expect(paramContent.type).toBe(ParameterType.octets);

            paramContent = ParameterContents.createParameterContent(realValue);
            expect(paramContent.type).toBe(ParameterType.real);

            paramContent = ParameterContents.createParameterContent(integerValue, ParameterType.real);
            expect(paramContent.type).toBe(ParameterType.real);
        });

        it('should throw an error if value type is not supported', () => {
            testErrorReturned(
                () => {
                    const badValue = {test: 7};
                    (ParameterContents.createParameterContent as (x: any) => any)(badValue);
            }, UnsupportedValueError);
        });
    });
    describe('ParameterContent properties directly accessible from Parameter', () => {
        const number = 10;
        const path = '0.1.10';
        const value = 'zero';
        const new_value = 'zero_zero';
        const streamIdentifier = 123456;
        const streamDescriptor = new StreamDescription(StreamFormat.signedInt16BigEndian, 4);
        const strinInCollection = new StringIntegerCollection();
        const paramAccess = ParameterAccess.readWrite;
        const type = ParameterType.string;
        it('should provide getter and setter for each property of Parameter', () => {
            const params = [
                new Parameter(number, type, value),
                new QualifiedParameter(path, type, value)
            ];
            for (const param of params) {
                expect(param.type).toBe(ParameterType.string);
                expect(param.value).toBe(value);
                param.value = new_value;
                expect(param.value).toBe(new_value);
                expect(param.contents.value).toBe(new_value);
                param.streamIdentifier = streamIdentifier;
                expect(param.streamIdentifier).toBe(streamIdentifier);
                expect(param.contents.streamIdentifier).toBe(streamIdentifier);
                param.streamDescriptor = streamDescriptor;
                expect(param.streamDescriptor).toBe(streamDescriptor);
                expect(param.contents.streamDescriptor).toBe(streamDescriptor);
                param.enumMap = strinInCollection;
                expect(param.enumMap).toBe(strinInCollection);
                expect(param.contents.enumMap).toBe(strinInCollection);
                param.minimum = number;
                expect(param.minimum).toBe(number);
                expect(param.contents.minimum).toBe(number);
                param.maximum = number;
                expect(param.maximum).toBe(number);
                expect(param.contents.maximum).toBe(number);
                param.access = paramAccess;
                expect(param.access).toBe(paramAccess);
                expect(param.contents.access).toBe(paramAccess);
                param.format = value;
                expect(param.format).toBe(value);
                expect(param.contents.format).toBe(value);
                param.enumeration = value;
                expect(param.contents.enumeration).toBe(value);
                expect(param.enumeration).toBe(value);
                param.factor = number;
                expect(param.factor).toBe(number);
                expect(param.contents.factor).toBe(number);
                param.isOnline = true;
                expect(param.isOnline).toBeTruthy();
                expect(param.contents.isOnline).toBeTruthy();
                param.default = value;
                expect(param.default).toBe(value);
                expect(param.contents.default).toBe(value);
                param.formula = value;
                expect(param.formula).toBe(value);
                expect(param.contents.formula).toBe(value);
                param.step = number;
                expect(param.step).toBe(number);
                expect(param.contents.step).toBe(number);
                param.schemaIdentifiers = value;
                expect(param.schemaIdentifiers).toBe(value);
                expect(param.contents.schemaIdentifiers).toBe(value);
            }
        });
        it('should return undefined if no contents defined and trying to access property', () => {
            const params = [
                new Parameter(number),
                new QualifiedParameter(path)
            ];
            for (const param of params) {
                expect(param.type).not.toBeDefined();
                expect(param.value).not.toBeDefined();
                expect(param.streamIdentifier).not.toBeDefined();
                expect(param.streamDescriptor).not.toBeDefined();
                expect(param.enumMap).not.toBeDefined();
                expect(param.minimum).not.toBeDefined();
                expect(param.maximum).not.toBeDefined();
                expect(param.access).not.toBeDefined();
                expect(param.format).not.toBeDefined();
                expect(param.enumeration).not.toBeDefined();
                expect(param.factor).not.toBeDefined();
                expect(param.isOnline).not.toBeDefined();
                expect(param.default).not.toBeDefined();
                expect(param.formula).not.toBeDefined();
                expect(param.step).not.toBeDefined();
                expect(param.schemaIdentifiers).not.toBeDefined();
            }
        });
        it('should throw an error if trying to set a property and no contents defined', () => {
            const params = [
                new Parameter(number),
                new QualifiedParameter(path)
            ];
            for (const param of params) {
                testErrorReturned(
                    () => {
                        param.type = ParameterType.string;
                }, InvalidEmberNodeError);
            }
        });

    });
});
