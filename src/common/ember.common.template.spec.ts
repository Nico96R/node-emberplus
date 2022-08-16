import * as BER from '../ber';
import { UnimplementedEmberTypeError } from '../error/errors';
import { Parameter } from './parameter';
import { Node } from './node';
import { MatrixNode } from './matrix/matrix-node';
import { Function } from './function/function';
import { QualifiedTemplate } from './qualified-template';
import { Template } from './template';
import { testErrorReturned } from '../fixture/utils';

describe('Template', () => {
    describe('Generic', () => {
        const PATH = '0.1.2';
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(QualifiedTemplate.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    QualifiedTemplate.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should have encoder/decoder', () => {
            const qp = new QualifiedTemplate(PATH, new Node(0));
            let writer = new BER.ExtendedWriter();
            qp.encode(writer);
            let dup = QualifiedTemplate.decode(new BER.ExtendedReader(writer.buffer));
            expect(dup).toBeDefined();
            expect(dup.getPath()).toBe(PATH);
            expect(dup.element instanceof Node);

            const DESCRIPTION = 'description';
            qp.description = DESCRIPTION;
            writer = new BER.ExtendedWriter();
            qp.encode(writer);
            dup = QualifiedTemplate.decode(new BER.ExtendedReader(writer.buffer));
            expect(dup).toBeDefined();
            expect(dup.getPath()).toBe(PATH);
            expect(dup.element instanceof Node);
            expect(dup.description).toBe(DESCRIPTION);
        });

        it('should return true to isTemplate() call', () => {
            const qp = new QualifiedTemplate(PATH, new Node(0));
            expect(qp.isTemplate()).toBeTruthy();
        });
    });

    describe('Template', () => {
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(Template.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    Template.decode(new BER.ExtendedReader(writer.buffer));
                }, UnimplementedEmberTypeError);
        });

        it('should have encoder/decoder', () => {
            const qp = new Template(10, new Node(0));
            let writer = new BER.ExtendedWriter();
            qp.encode(writer);
            let dup = Template.decode(new BER.ExtendedReader(writer.buffer));
            expect(dup).toBeDefined();
            expect(dup.getNumber()).toBe(10);

            const DESCRIPTION = 'description';
            qp.description = DESCRIPTION;
            writer = new BER.ExtendedWriter();
            qp.encode(writer);
            dup = Template.decode(new BER.ExtendedReader(writer.buffer));
            expect(dup).toBeDefined();
            expect(dup.element instanceof Node);
            expect(dup.description).toBe(DESCRIPTION);

            writer = new BER.ExtendedWriter();
            qp.element = new Function(0, null);
            qp.encode(writer);
            dup = Template.decode(new BER.ExtendedReader(writer.buffer));
            expect(dup.element instanceof Function);

            writer = new BER.ExtendedWriter();
            qp.element = new Parameter(0);
            qp.encode(writer);
            dup = Template.decode(new BER.ExtendedReader(writer.buffer));
            expect(dup.element instanceof Parameter);

            writer = new BER.ExtendedWriter();
            qp.element = new MatrixNode(0);
            qp.encode(writer);
            dup = Template.decode(new BER.ExtendedReader(writer.buffer));
            expect(dup.element instanceof MatrixNode);

        });

        it('should return true to isTemplate() call', () => {
            const qp = new Template(10, new Node(0));
            expect(qp.isTemplate()).toBeTruthy();
        });

        it('should have toQualified function', () => {
            const template = new Template(10, new Node(0));
            const qp = template.toQualified();
            expect(qp.isTemplate()).toBeTruthy();
        });

        it('should have update function', () => {
            const template = new Template(10, new Node(0));
            const DUP_NUM = 5;
            const dup = new Template(10, new Node(DUP_NUM));
            template.update(dup);
            expect(template.element.getNumber()).toBe(DUP_NUM);
        });
    });
});
