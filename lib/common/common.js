"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../ber");
const tree_node_1 = require("./tree-node");
const element_1 = require("./element");
const command_1 = require("./command");
const invocation_result_1 = require("./invocation-result");
const stream_collection_1 = require("./stream/stream-collection");
const parameter_1 = require("./parameter");
const parameter_type_1 = require("./parameter-type");
const parameter_access_1 = require("./parameter-access");
const node_1 = require("./node");
const matrix_node_1 = require("./matrix/matrix-node");
const template_1 = require("./template");
const qualified_matrix_1 = require("./matrix/qualified-matrix");
const qualified_parameter_1 = require("./qualified-parameter");
const qualified_node_1 = require("./qualified-node");
const qualified_function_1 = require("./function/qualified-function");
const qualified_template_1 = require("./qualified-template");
const errors_1 = require("../error/errors");
const function_1 = require("./function/function");
const function_argument_1 = require("./function/function-argument");
const label_1 = require("./label");
const string_integer_collection_1 = require("./string-integer-collection");
const string_integer_pair_1 = require("./string-integer-pair");
const invocation_1 = require("./invocation");
const stream_description_1 = require("./stream/stream-description");
const stream_entry_1 = require("./stream/stream-entry");
const stream_format_1 = require("./stream/stream-format");
exports.rootDecode = (ber) => {
    const r = new tree_node_1.TreeNode();
    let tag;
    while (ber.remain > 0) {
        tag = ber.peek();
        if (tag === ber_1.APPLICATION(0)) {
            ber = ber.getSequence(ber_1.APPLICATION(0));
            tag = ber.peek();
            if (tag === ber_1.APPLICATION(11)) {
                const seq = ber.getSequence(ber_1.APPLICATION(11));
                while (seq.remain > 0) {
                    const rootReader = seq.getSequence(ber_1.CONTEXT(0));
                    while (rootReader.remain > 0) {
                        const element = exports.childDecode(rootReader);
                        r.addElement(element);
                    }
                }
            }
            else if (tag === invocation_result_1.InvocationResult.BERID) {
                return invocation_result_1.InvocationResult.decode(ber);
            }
            else if (tag === stream_collection_1.StreamCollection.BERID) {
                r.setStreams(stream_collection_1.StreamCollection.decode(ber));
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        else if (tag === ber_1.CONTEXT(0)) {
            try {
                const rootReader = ber.getSequence(ber_1.CONTEXT(0));
                return exports.childDecode(rootReader);
            }
            catch (e) {
                return r;
            }
        }
        else {
            throw new errors_1.UnimplementedEmberTypeError(tag);
        }
    }
    return r;
};
exports.createTreeBranch = (root, path) => {
    const aPath = path.split('.');
    let node = root;
    let pos = 0;
    while (pos < aPath.length) {
        const number = Number(aPath[pos]);
        let child = node.getElement(number);
        if (child == null) {
            child = new node_1.Node(number);
            node.addChild(child);
        }
        node = child;
        pos++;
    }
    return node.toQualified();
};
const jsonContentLogger = (contents, logger, spaces = ' ', stepSpaces = ' ') => __awaiter(void 0, void 0, void 0, function* () {
    const childSpaces = `${spaces}${stepSpaces}`;
    for (const prop of Object.keys(contents)) {
        if (prop === 'number' || prop === 'path' || contents[prop] === undefined) {
            continue;
        }
        const type = typeof contents[prop];
        if (type === 'string') {
            yield logger.log(`,\n${spaces}"${prop}": "${contents[prop]}"`);
        }
        else if (type === 'number') {
            yield logger.log(`,\n${spaces}"${prop}": ${contents[prop]}`);
        }
        else if (type === 'boolean') {
            yield logger.log(`,\n${spaces}"${prop}": ${contents[prop] ? 'true' : 'false'}`);
        }
        else if (contents[prop] != null && contents[prop].toJSON != null) {
            yield logger.log(`,\n${spaces}"${prop}":${JSON.stringify(contents[prop], null, childSpaces)}`);
        }
        else if (Array.isArray(contents[prop]) && contents[prop].length > 0 && contents[prop][0].toJSON != null) {
            yield logger.log(`,\n${spaces}"${prop}":${JSON.stringify(contents[prop].map((x) => x.toJSON()), null, childSpaces)}`);
        }
        else {
            yield logger.log(`,\n${spaces}"${prop}":${JSON.stringify(contents[prop], null, childSpaces)}`);
        }
    }
});
const jsonChildrenLogger = (node, logger, spaces = ' ', stepSpaces = ' ') => __awaiter(void 0, void 0, void 0, function* () {
    const elements = node.getChildren();
    if (elements != null) {
        const childSpaces = `${spaces}${stepSpaces}`;
        yield logger.log(`,\n${spaces}"children": [\n`);
        let first = true;
        for (const element of elements) {
            if (first) {
                first = false;
            }
            else {
                yield logger.log(`,\n`);
            }
            yield exports.jsonFullNodeLogger(element, logger, childSpaces, stepSpaces);
        }
        yield logger.log(`\n${spaces}]`);
    }
});
const jsonNodeContentLogger = (node, logger, spaces = ' ', stepSpaces = ' ') => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const propsSpaces = `${spaces}${stepSpaces}`;
    const childSpaces = `${propsSpaces}${stepSpaces}`;
    yield logger.log(`${propsSpaces}"number": ${node.getNumber()},\n`);
    yield logger.log(`${propsSpaces}"path": "${node.getPath()}"`);
    if (node.isTemplate()) {
        yield logger.log(`,\n${propsSpaces}"template": `);
        yield exports.jsonFullNodeLogger(node.element, logger, childSpaces, stepSpaces);
    }
    else {
        const contents = node.isMatrix() ? node.toJSON() : (_a = node.contents) === null || _a === void 0 ? void 0 : _a.toJSON();
        if (node.isFunction()) {
            yield logger.log(`,\n${propsSpaces}"func": null`);
        }
        if (contents) {
            yield jsonContentLogger(contents, logger, propsSpaces, stepSpaces);
        }
    }
});
const jsonRootLogger = (node, logger, spaces = ' ', stepSpaces = ' ') => __awaiter(void 0, void 0, void 0, function* () {
    yield logger.log(`${spaces}[\n`);
    const elements = node.getChildren();
    if (elements != null) {
        const elementSpaces = `${spaces}${stepSpaces}`;
        let first = true;
        for (const element of elements) {
            if (first) {
                first = false;
            }
            else {
                yield logger.log(`,\n`);
            }
            yield exports.jsonFullNodeLogger(element, logger, elementSpaces, stepSpaces);
        }
    }
    yield logger.log(`\n${spaces}]\n`);
});
exports.jsonFullNodeLogger = (node, logger, spaces = ' ', stepSpaces = ' ') => __awaiter(void 0, void 0, void 0, function* () {
    yield logger.log(`${spaces}{\n`);
    const propsSpaces = `${spaces}${stepSpaces}`;
    yield jsonNodeContentLogger(node, logger, propsSpaces, stepSpaces);
    yield jsonChildrenLogger(node, logger, propsSpaces, stepSpaces);
    yield logger.log(`\n${spaces}}`);
});
exports.jsonNodeLogger = (node, logger, spaces = ' ', stepSpaces = ' ') => __awaiter(void 0, void 0, void 0, function* () {
    yield logger.log(`${spaces}{\n`);
    const propsSpaces = `${spaces}${stepSpaces}`;
    yield jsonNodeContentLogger(node, logger, propsSpaces, stepSpaces);
    yield logger.log(`\n${spaces}}`);
});
exports.jsonTreeLogger = (node, logger, spaces = ' ', stepSpaces = ' ') => __awaiter(void 0, void 0, void 0, function* () {
    if (node.getNumber() == null) {
        yield jsonRootLogger(node, logger, spaces, stepSpaces);
    }
    else {
        yield exports.jsonFullNodeLogger(node, logger, spaces, stepSpaces);
    }
});
exports.nodeLogger = (node, logger, spaces = ' ', stepSpaces = ' ') => __awaiter(void 0, void 0, void 0, function* () {
    if (node.isRoot()) {
        yield logger.log(`${spaces}- Root\n`);
        spaces = `${spaces}${stepSpaces}`;
        if (node.getResult() != null) {
            yield logger.log(`{$spaces}result: ${JSON.stringify(node.getResult().toJSON())}\n`);
        }
        if (node.getStreams() != null) {
            yield logger.log(`{$spaces}streams: ${JSON.stringify(node.getStreams().toJSON())}\n`);
        }
        const elements = node.getChildren();
        if (elements != null) {
            yield logger.log(`${spaces} Elements:\n`);
            spaces = `${spaces}${stepSpaces}`;
            for (const element of elements) {
                yield exports.nodeLogger(element, logger, spaces, stepSpaces);
            }
        }
    }
    else {
        yield logger.log(`${spaces}- ${node.constructor.name}\n`);
        spaces = `${spaces}${stepSpaces}`;
        yield logger.log(`${spaces} number: ${node.getNumber()}\n`);
        yield logger.log(`${spaces} path: ${node.getPath()}\n`);
        if (node.contents) {
            const contents = node.contents;
            for (const prop of Object.keys(contents)) {
                const type = typeof contents[prop];
                if (type === 'string' || type === 'number') {
                    yield logger.log(`${spaces} ${prop}:${contents[prop]}\n`);
                }
                else if (contents[prop] != null && contents[prop].toJSON != null) {
                    yield logger.log(`${spaces} ${prop}:${JSON.stringify(contents[prop], null, ' ')}\n`);
                }
                else if (Array.isArray(contents[prop]) && contents[prop].length > 0 && contents[prop][0].toJSON != null) {
                    yield logger.log(`${spaces} ${prop}:${JSON.stringify(contents[prop].map((x) => x.toJSON()), null, ' ')}\n`);
                }
                else {
                    yield logger.log(`${spaces} ${prop}:${JSON.stringify(contents[prop], null, ' ')}\n`);
                }
            }
        }
        const elements = node.getChildren();
        if (elements != null) {
            yield logger.log(`${spaces} Children:\n`);
            spaces = `${spaces}${stepSpaces}`;
            for (const element of elements) {
                yield exports.nodeLogger(element, logger, spaces, stepSpaces);
            }
        }
    }
});
const TreeNodeDecoders = {
    [parameter_1.Parameter.BERID]: parameter_1.Parameter.decode,
    [node_1.Node.BERID]: node_1.Node.decode,
    [command_1.Command.BERID]: command_1.Command.decode,
    [matrix_node_1.MatrixNode.BERID]: matrix_node_1.MatrixNode.decode,
    [function_1.Function.BERID]: function_1.Function.decode,
    [template_1.Template.BERID]: template_1.Template.decode,
    [qualified_matrix_1.QualifiedMatrix.BERID]: qualified_matrix_1.QualifiedMatrix.decode,
    [qualified_parameter_1.QualifiedParameter.BERID]: qualified_parameter_1.QualifiedParameter.decode,
    [qualified_node_1.QualifiedNode.BERID]: qualified_node_1.QualifiedNode.decode,
    [qualified_function_1.QualifiedFunction.BERID]: qualified_function_1.QualifiedFunction.decode,
    [qualified_template_1.QualifiedTemplate.BERID]: qualified_template_1.QualifiedTemplate.decode
};
exports.childDecode = function (ber) {
    const tag = ber.peek();
    const decode = TreeNodeDecoders[tag];
    if (decode == null) {
        throw new errors_1.UnimplementedEmberTypeError(tag);
    }
    else {
        return decode(ber);
    }
};
tree_node_1.TreeNode.decode = exports.childDecode;
exports.decodeBuffer = (packet) => {
    const ber = new ber_1.ExtendedReader(packet);
    return exports.rootDecode(ber);
};
exports.EmberLib = {
    decodeBuffer: exports.decodeBuffer,
    TreeNode: tree_node_1.TreeNode,
    Element: element_1.Element,
    Node: node_1.Node,
    Parameter: parameter_1.Parameter,
    ParameterType: parameter_type_1.ParameterType,
    ParameterAccess: parameter_access_1.ParameterAccess,
    Function: function_1.Function,
    FunctionArgument: function_argument_1.FunctionArgument,
    MatrixNode: matrix_node_1.MatrixNode,
    Invocation: invocation_1.Invocation,
    InvocationResult: invocation_result_1.InvocationResult,
    StreamCollection: stream_collection_1.StreamCollection,
    Template: template_1.Template,
    Command: command_1.Command,
    QualifiedFunction: qualified_function_1.QualifiedFunction,
    QualifiedMatrix: qualified_matrix_1.QualifiedMatrix,
    QualifiedNode: qualified_node_1.QualifiedNode,
    QualifiedParameter: qualified_parameter_1.QualifiedParameter,
    QualifiedTemplate: qualified_template_1.QualifiedTemplate,
    Label: label_1.Label,
    StreamDescription: stream_description_1.StreamDescription,
    StreamEntry: stream_entry_1.StreamEntry,
    StreamFormat: stream_format_1.StreamFormat,
    StringIntegerPair: string_integer_pair_1.StringIntegerPair,
    StringIntegerCollection: string_integer_collection_1.StringIntegerCollection
};
//# sourceMappingURL=common.js.map