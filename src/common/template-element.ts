import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION, EMBER_STRING } from '../ber';
import { Template } from './template';
import { Parameter } from './parameter';
import { MatrixNode } from './matrix/matrix-node';
import { Node } from './node';
import { QualifiedTemplate } from './qualified-template';
import { UnimplementedEmberTypeError } from '../error/errors';
import { Function } from '../common/function/function';

/*
TemplateElement ::=
    CHOICE {
        parameter Parameter,
        node Node,
        matrix Matrix,
        function Function
    }
*/
export abstract class TemplateElement {
    static decode(ber: Reader): Parameter | Node | Function | MatrixNode {
        const tag = ber.peek();
        if (tag === APPLICATION(1)) {
            return Parameter.decode(ber);
        } else if (tag === APPLICATION(3)) {
            return Node.decode(ber);
        } else if (tag === APPLICATION(19)) {
            return Function.decode(ber);
        } else if (tag === APPLICATION(13)) {
            return MatrixNode.decode(ber);
        } else {
            throw new UnimplementedEmberTypeError(tag);
        }
    }

    static decodeContent(template: Template | QualifiedTemplate, tag: number, ber: Reader): void {
        if (tag === CONTEXT(1)) {
            template.element = TemplateElement.decode(ber);
        } else if (tag === CONTEXT(2)) {
            template.description = ber.readString(EMBER_STRING);
        } else {
            throw new UnimplementedEmberTypeError(tag);
        }
    }

    static encodeContent(template: Template | QualifiedTemplate, ber: Writer): void {
        if (template.element != null) {
            ber.startSequence(CONTEXT(1));
            template.element.encode(ber);
            ber.endSequence();
        }

        if (template.description != null) {
            ber.startSequence(CONTEXT(2));
            ber.writeString(template.description, EMBER_STRING);
            ber.endSequence();
        }
    }
}
