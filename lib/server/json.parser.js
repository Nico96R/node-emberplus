"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tree_node_1 = require("../common/tree-node");
const parameter_1 = require("../common/parameter");
const parameter_type_1 = require("../common/parameter-type");
const parameter_access_1 = require("../common/parameter-access");
const function_argument_1 = require("../common/function/function-argument");
const matrix_node_1 = require("../common/matrix/matrix-node");
const matrix_connection_1 = require("../common/matrix/matrix-connection");
const node_1 = require("../common/node");
const label_1 = require("../common/label");
const matrix_type_1 = require("../common/matrix/matrix-type");
const errors_1 = require("../error/errors");
const matrix_mode_1 = require("../common/matrix/matrix-mode");
const function_1 = require("../common/function/function");
const template_1 = require("../common/template");
const stream_description_1 = require("../common/stream/stream-description");
const stream_format_1 = require("../common/stream/stream-format");
const string_integer_collection_1 = require("../common/string-integer-collection");
const string_integer_pair_1 = require("../common/string-integer-pair");
class JSONParser {
    static parseMatrixContent(number, content) {
        let type = matrix_type_1.MatrixType.oneToN;
        let mode = matrix_mode_1.MatrixMode.linear;
        if (content.type != null) {
            if (content.type === 'oneToN') {
                type = matrix_type_1.MatrixType.oneToN;
            }
            else if (content.type === 'oneToOne') {
                type = matrix_type_1.MatrixType.oneToOne;
            }
            else if (content.type === 'nToN') {
                type = matrix_type_1.MatrixType.nToN;
            }
            else {
                throw new errors_1.InvalidEmberNodeError('', `Invalid matrix type ${content.type}`);
            }
            delete content.type;
        }
        if (content.mode != null) {
            if (content.mode === 'linear') {
                mode = matrix_mode_1.MatrixMode.linear;
            }
            else if (content.mode === 'nonLinear') {
                mode = matrix_mode_1.MatrixMode.nonLinear;
            }
            else {
                throw new errors_1.InvalidEmberNodeError('', `Invalid matrix mode ${content.mode}`);
            }
            delete content.mode;
        }
        const matrix = new matrix_node_1.MatrixNode(number, content.identifier, type, mode);
        if (type === matrix_type_1.MatrixType.nToN) {
            matrix.maximumTotalConnects = content.maximumTotalConnects == null ?
                Number(content.targetCount) * Number(content.sourceCount) : Number(content.maximumTotalConnects);
            matrix.maximumConnectsPerTarget = content.maximumConnectsPerTarget == null ?
                Number(content.sourceCount) : Number(content.maximumConnectsPerTarget);
        }
        if (content.labels) {
            matrix.labels = [];
            for (let l = 0; l < content.labels.length; l++) {
                if (typeof (content.labels[l]) === 'object') {
                    matrix.labels.push(new label_1.Label(content.labels[l].basePath, content.labels[l].description));
                }
            }
            delete content.labels;
        }
        return matrix;
    }
    static parseObj(parent, obj) {
        var _a;
        for (let i = 0; i < obj.length; i++) {
            let emberElement;
            const content = obj[i];
            const number = content.number != null ? Number(content.number) : i;
            delete content.number;
            delete content.path;
            delete content.nodeType;
            if (content.value != null) {
                emberElement = new parameter_1.Parameter(number, parameter_type_1.parameterTypeFromString(content.type || 'string'), content.value);
                if (content.access) {
                    if (typeof (content.access) === 'string') {
                        emberElement.access = parameter_access_1.parameterAccessFromString(content.access);
                    }
                    else {
                        emberElement.access = content.access;
                    }
                }
                else {
                    emberElement.access = parameter_access_1.ParameterAccess.read;
                }
                if (content.streamDescriptor != null) {
                    if (content.streamDescriptor.offset == null || content.streamDescriptor.format == null) {
                        throw new Error('Missing offset or format for streamDescriptor');
                    }
                    emberElement.contents.streamDescriptor = new stream_description_1.StreamDescription(stream_format_1.streamFormatFromString(content.streamDescriptor.format), Number(content.streamDescriptor.offset));
                    delete content.streamDescriptor;
                }
                if (content.enumMap != null) {
                    emberElement.contents.enumMap = new string_integer_collection_1.StringIntegerCollection();
                    for (const entry of content.enumMap) {
                        emberElement.contents.enumMap.addEntry(entry.key, new string_integer_pair_1.StringIntegerPair(entry.key, entry.value));
                    }
                    delete content.enumMap;
                }
                delete content.type;
                delete content.access;
                delete content.value;
            }
            else if (content.template) {
                const tempRoot = new tree_node_1.TreeNode();
                this.parseObj(tempRoot, [content.template]);
                const children = tempRoot.getChildren();
                if (((_a = children) === null || _a === void 0 ? void 0 : _a.length) === 1) {
                    emberElement = new template_1.Template(number, children[0]);
                }
                else {
                    throw new Error('Invalid template format');
                }
                parent.addChild(emberElement);
                continue;
            }
            else if (content.func != null) {
                emberElement = new function_1.Function(number, content.func, content.identifier);
                if (content.arguments != null) {
                    for (const argument of content.arguments) {
                        emberElement.contents.arguments.push(new function_argument_1.FunctionArgument(argument.type, argument.value, argument.name));
                    }
                }
                if (content.result != null) {
                    for (const argument of content.result) {
                        emberElement.contents.result.push(new function_argument_1.FunctionArgument(argument.type, argument.value, argument.name));
                    }
                }
                delete content.arguments;
                delete content.identifier;
                delete content.func;
                delete content.result;
            }
            else if (content.targetCount != null) {
                emberElement = this.parseMatrixContent(number, content);
                if (content.connections != null) {
                    emberElement.connections = {};
                    for (const c in content.connections) {
                        if (!content.connections.hasOwnProperty(c)) {
                            continue;
                        }
                        const t = content.connections[c].target != null ? content.connections[c].target : 0;
                        emberElement.setSources(t, content.connections[c].sources);
                    }
                    delete content.connections;
                }
                else {
                    emberElement.connections = {};
                    for (let t = 0; t < content.targetCount; t++) {
                        const connection = new matrix_connection_1.MatrixConnection(t);
                        emberElement.connections[t] = connection;
                    }
                }
                delete content.connections;
            }
            else {
                emberElement = new node_1.Node(number, content.identifier);
                delete content.identifier;
            }
            const elementContents = emberElement;
            for (const id in content) {
                if (content[id] == null) {
                    continue;
                }
                if (id === 'children') {
                    this.parseObj(emberElement, content.children);
                }
                else {
                    elementContents[id] = content[id];
                }
            }
            parent.addChild(emberElement);
        }
    }
}
exports.JSONParser = JSONParser;
//# sourceMappingURL=json.parser.js.map