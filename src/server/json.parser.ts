import { TreeNode } from '../common/tree-node';
import { Parameter } from '../common/parameter';
import { ParameterType, parameterTypeFromString } from '../common/parameter-type';
import { parameterAccessFromString, ParameterAccess } from '../common/parameter-access';
import { FunctionArgument } from '../common/function/function-argument';
import { MatrixNode } from '../common/matrix/matrix-node';
import { MatrixConnection } from '../common/matrix/matrix-connection';
import { Node } from '../common/node';
import { Label } from '../common/label';
import { MatrixType } from '../common/matrix/matrix-type';
import { InvalidEmberNodeError } from '../error/errors';
import { MatrixMode } from '../common/matrix/matrix-mode';
import { Function, FunctionCallBack } from '../common/function/function';
import { Template } from '../common/template';
import { StreamDescription } from '../common/stream/stream-description';
import { streamFormatFromString } from '../common/stream/stream-format';
import { StringIntegerCollection } from '../common/string-integer-collection';
import { StringIntegerPair } from '../common/string-integer-pair';
import { LoggingService } from '../logging/logging.service';

const basicFunctions: Record<string, FunctionCallBack> = {
    'sum': (args: FunctionArgument[]) => {
        let sum = 0;
        args.forEach(a => sum += Number(a.value));
        return [
            new FunctionArgument(ParameterType.integer, sum)
        ];
    }
};

export class JSONParser {
    static logger: LoggingService | null = null;
    static getJSONParser(_logger?: LoggingService): typeof JSONParser {
        this.logger = _logger;
        return this;
    }
    static parseMatrixContent(number: number, content: { [index: string]: any }): MatrixNode {
        let type = MatrixType.oneToN;
        let mode = MatrixMode.linear;
        if (content.type != null) {
            if (content.type === 'oneToN') {
                type = MatrixType.oneToN;
            } else if (content.type === 'oneToOne') {
                type = MatrixType.oneToOne;
            } else if (content.type === 'nToN') {
                type = MatrixType.nToN;
            } else {
                throw new InvalidEmberNodeError('', `Invalid matrix type ${content.type}`);
            }
            delete content.type;
        }
        if (content.mode != null) {
            if (content.mode === 'linear') {
                mode = MatrixMode.linear;
            } else if (content.mode === 'nonLinear') {
                mode = MatrixMode.nonLinear;
            } else {
                throw new InvalidEmberNodeError('', `Invalid matrix mode ${content.mode}`);
            }
            delete content.mode;
        }

        const matrix = new MatrixNode(number, content.identifier, type, mode);

        if (type === MatrixType.nToN) {
            matrix.maximumTotalConnects = content.maximumTotalConnects == null ?
                Number(content.targetCount) * Number(content.sourceCount) : Number(content.maximumTotalConnects);
            matrix.maximumConnectsPerTarget = content.maximumConnectsPerTarget == null ?
                Number(content.sourceCount) : Number(content.maximumConnectsPerTarget);
        }

        if (content.labels) {
            matrix.labels = [];
            for (let l = 0; l < content.labels.length; l++) {
                if (typeof (content.labels[l]) === 'object') {
                    matrix.labels.push(
                        new Label(
                            content.labels[l].basePath,
                            content.labels[l].description
                        )
                    );
                }
            }
            delete content.labels;
        }

        return matrix;
    }

    static parseObj(parent: TreeNode, obj: { [index: string]: any }): void {
        for (let i = 0; i < obj.length; i++) {
            let emberElement;
            const content = obj[i];
            const number = content.number != null ? Number(content.number) : i;
            delete content.number;
            delete content.path;
            delete content.nodeType;
            if (content.value != null) {
                emberElement = new Parameter(number, parameterTypeFromString(content.type || 'string'), content.value);
                // don't let the content.type erase the element content.
                if (content.access) {
                    if (typeof(content.access) === 'string') {
                        emberElement.access = parameterAccessFromString(content.access);
                    } else {
                        emberElement.access = content.access;
                    }
                } else {
                    emberElement.access = ParameterAccess.read;
                }
                if (content.streamDescriptor != null) {
                    if (content.streamDescriptor.offset == null || content.streamDescriptor.format == null) {
                        throw new Error('Missing offset or format for streamDescriptor');
                    }
                    emberElement.contents.streamDescriptor = new StreamDescription(
                        streamFormatFromString(content.streamDescriptor.format),
                        Number(content.streamDescriptor.offset));
                    delete content.streamDescriptor;
                }
                if (content.enumMap != null) {
                    emberElement.contents.enumMap = new StringIntegerCollection();
                    for (const entry of content.enumMap) {
                        emberElement.contents.enumMap.addEntry(entry.key, new StringIntegerPair(entry.key, entry.value));
                    }
                    delete content.enumMap;
                }
                delete content.type;
                delete content.access;
                delete content.value;
            } else if (content.template) {
                const tempRoot = new TreeNode();
                this.parseObj(tempRoot, [content.template]);
                const children = tempRoot.getChildren();
                if (children?.length === 1) {
                    emberElement = new Template(number, children[0] as Node);
                } else {
                    throw new Error('Invalid template format');
                }
                parent.addChild(emberElement);
                continue;
            } else if (content.func != null) {
                if (typeof(content.func) === 'string') {
                    if (basicFunctions[content.func] == null) {
                        throw new Error(`Unknown function ${content.func}`);
                    }
                    this.logger?.debug(`Using default function ${content.func}`, basicFunctions[content.func]);
                    emberElement = new Function(number, basicFunctions[content.func], content.identifier);
                } else if (typeof(content.func) === 'function') {
                    emberElement = new Function(number, content.func, content.identifier);
                } else {
                    throw new Error(`Invalid functiom type ${typeof(content.func)}`);
                }
                if (content.arguments != null) {
                    for (const argument of content.arguments) {
                        emberElement.contents.arguments.push(new FunctionArgument(
                            argument.type,
                            argument.value,
                            argument.name
                        ));
                    }
                }
                if (content.result != null) {
                    for (const argument of content.result) {
                        emberElement.contents.result.push(new FunctionArgument(
                            argument.type,
                            argument.value,
                            argument.name
                        ));
                    }
                }
                delete content.arguments;
                delete content.identifier;
                delete content.func;
                delete content.result;
            } else if (content.targetCount != null) {
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
                } else {
                    emberElement.connections = {};
                    for (let t = 0; t < content.targetCount; t++) {
                        const connection = new MatrixConnection(t);
                        emberElement.connections[t] = connection;
                    }
                }
                delete content.connections;
            } else {
                emberElement = new Node(number, content.identifier);
                delete content.identifier;
            }
            const elementContents: { [index: string]: any } = emberElement;
            for (const id in content) {
                if (content[id] == null ) {
                    continue;
                }
                if (id === 'children') {
                    this.parseObj(emberElement, content.children);
                } else {
                    elementContents[id] = content[id];
                }
            }
            parent.addChild(emberElement);
        }
    }
}
