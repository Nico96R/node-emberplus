"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const parameter_1 = require("./parameter");
const matrix_node_1 = require("./matrix/matrix-node");
const node_1 = require("./node");
const errors_1 = require("../error/errors");
const function_1 = require("../common/function/function");
class TemplateElement {
    static decode(ber) {
        const tag = ber.peek();
        if (tag === ber_1.APPLICATION(1)) {
            return parameter_1.Parameter.decode(ber);
        }
        else if (tag === ber_1.APPLICATION(3)) {
            return node_1.Node.decode(ber);
        }
        else if (tag === ber_1.APPLICATION(19)) {
            return function_1.Function.decode(ber);
        }
        else if (tag === ber_1.APPLICATION(13)) {
            return matrix_node_1.MatrixNode.decode(ber);
        }
        else {
            throw new errors_1.UnimplementedEmberTypeError(tag);
        }
    }
    static decodeContent(template, tag, ber) {
        if (tag === ber_1.CONTEXT(1)) {
            template.element = TemplateElement.decode(ber);
        }
        else if (tag === ber_1.CONTEXT(2)) {
            template.description = ber.readString(ber_1.EMBER_STRING);
        }
        else {
            throw new errors_1.UnimplementedEmberTypeError(tag);
        }
    }
    static encodeContent(template, ber) {
        if (template.element != null) {
            ber.startSequence(ber_1.CONTEXT(1));
            template.element.encode(ber);
            ber.endSequence();
        }
        if (template.description != null) {
            ber.startSequence(ber_1.CONTEXT(2));
            ber.writeString(template.description, ber_1.EMBER_STRING);
            ber.endSequence();
        }
    }
}
exports.TemplateElement = TemplateElement;
//# sourceMappingURL=template-element.js.map