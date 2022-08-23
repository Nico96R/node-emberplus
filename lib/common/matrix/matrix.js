"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ber_1 = require("../../ber");
const matrix_mode_1 = require("./matrix-mode");
const matrix_operation_1 = require("./matrix-operation");
const matrix_type_1 = require("./matrix-type");
const matrix_contents_1 = require("./matrix-contents");
const matrix_connection_1 = require("./matrix-connection");
const tree_node_1 = require("../tree-node");
const errors_1 = require("../../error/errors");
class Matrix extends tree_node_1.TreeNode {
    constructor(identifier = null, _type = matrix_type_1.MatrixType.oneToN, _mode = matrix_mode_1.MatrixMode.linear) {
        super();
        if (_type !== matrix_type_1.MatrixType.oneToN || _mode !== matrix_mode_1.MatrixMode.linear || identifier != null) {
            this.setContents(new matrix_contents_1.MatrixContents(_type, _mode));
            this.identifier = identifier;
        }
        this._connectedSources = {};
        this._numConnections = 0;
        this.targets = null;
        this.sources = null;
        this.connections = {};
    }
    get contents() {
        return this._contents;
    }
    get type() {
        if (this.contents == null || this.contents.type == null) {
            return matrix_type_1.MatrixType.oneToN;
        }
        return this.contents.type;
    }
    set type(type) {
        if (type !== matrix_type_1.MatrixType.oneToN) {
            if (this.contents != null) {
                this.contents.type = type;
            }
        }
        else {
            this.setContent('type', type);
        }
    }
    get mode() {
        if (this.contents == null || this.contents.type == null) {
            return matrix_mode_1.MatrixMode.linear;
        }
        return this.contents.mode;
    }
    set mode(mode) {
        if (mode !== matrix_mode_1.MatrixMode.linear) {
            if (this.contents != null) {
                this.contents.mode = mode;
            }
        }
        else {
            this.setContent('mode', mode);
        }
    }
    get targetCount() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.targetCount;
    }
    set targetCount(targetCount) {
        this.setContent('targetCount', targetCount);
    }
    get sourceCount() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.sourceCount;
    }
    set sourceCount(sourceCount) {
        this.setContent('sourceCount', sourceCount);
    }
    get maximumTotalConnects() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.maximumTotalConnects;
    }
    set maximumTotalConnects(maximumTotalConnects) {
        this.setContent('maximumTotalConnects', maximumTotalConnects);
    }
    get maximumConnectsPerTarget() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.maximumConnectsPerTarget;
    }
    set maximumConnectsPerTarget(maximumConnectsPerTarget) {
        this.setContent('maximumConnectsPerTarget', maximumConnectsPerTarget);
    }
    get parametersLocation() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.parametersLocation;
    }
    set parametersLocation(parametersLocation) {
        this.setContent('parametersLocation', parametersLocation);
    }
    get gainParameterNumber() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.gainParameterNumber;
    }
    set gainParameterNumber(gainParameterNumber) {
        this.setContent('gainParameterNumber', gainParameterNumber);
    }
    get labels() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.labels;
    }
    set labels(labels) {
        this.setContent('labels', labels);
    }
    get schemaIdentifiers() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.schemaIdentifiers;
    }
    set schemaIdentifiers(schemaIdentifiers) {
        this.setContent('schemaIdentifiers', schemaIdentifiers);
    }
    get templateReference() {
        var _a;
        return (_a = this.contents) === null || _a === void 0 ? void 0 : _a.templateReference;
    }
    set templateReference(templateReference) {
        this.setContent('templateReference', templateReference);
    }
    static canConnect(matrixNode, targetID, sources, operation = matrix_operation_1.MatrixOperation.connect) {
        if (matrixNode.connections == null) {
            matrixNode.connections = {};
        }
        if (matrixNode.connections[targetID] == null) {
            matrixNode.connections[targetID] = new matrix_connection_1.MatrixConnection(targetID);
        }
        const type = matrixNode.type == null ? matrix_type_1.MatrixType.oneToN : matrixNode.type;
        const connection = matrixNode.connections[targetID];
        const oldSources = connection == null || connection.sources == null ? [] : connection.sources.slice();
        const newSources = operation === matrix_operation_1.MatrixOperation.absolute ? sources : oldSources.concat(sources);
        const sMap = new Set(newSources.map(i => Number(i)));
        if (matrixNode.connections[targetID].isLocked()) {
            return false;
        }
        if (type === matrix_type_1.MatrixType.oneToN &&
            matrixNode.maximumTotalConnects == null &&
            matrixNode.maximumConnectsPerTarget == null) {
            return sMap.size < 2;
        }
        else if (type === matrix_type_1.MatrixType.oneToN && sMap.size >= 2) {
            return false;
        }
        else if (type === matrix_type_1.MatrixType.oneToOne) {
            if (sMap.size > 1) {
                return false;
            }
            const sourceConnections = matrixNode._connectedSources[sources[0]];
            return sourceConnections == null || sourceConnections.size === 0 || sourceConnections.has(targetID);
        }
        else {
            if (matrixNode.maximumConnectsPerTarget != null &&
                newSources.length > matrixNode.maximumConnectsPerTarget) {
                return false;
            }
            if (matrixNode.maximumTotalConnects != null) {
                let count = matrixNode._numConnections - oldSources.length;
                if (newSources) {
                    count += newSources.length;
                }
                return count <= matrixNode.maximumTotalConnects;
            }
            return true;
        }
    }
    static connectSources(matrix, targetID, sources) {
        const target = Number(targetID);
        if (matrix.connections == null) {
            matrix.connections = {};
        }
        if (matrix.connections[target] == null) {
            matrix.connections[target] = new matrix_connection_1.MatrixConnection(target);
        }
        matrix.connections[target].connectSources(sources);
        if (sources != null) {
            for (const source of sources) {
                if (matrix._connectedSources[source] == null) {
                    matrix._connectedSources[source] = new Set();
                }
                if (!matrix._connectedSources[source].has(target)) {
                    matrix._connectedSources[source].add(target);
                    matrix._numConnections++;
                }
            }
        }
    }
    static decodeTargets(ber) {
        const targets = [];
        ber = ber.getSequence(ber_1.EMBER_SEQUENCE);
        while (ber.remain > 0) {
            let seq = ber.getSequence(ber_1.CONTEXT(0));
            seq = seq.getSequence(ber_1.APPLICATION(14));
            seq = seq.getSequence(ber_1.CONTEXT(0));
            targets.push(seq.readInt());
        }
        return targets;
    }
    static decodeSources(ber) {
        const sources = [];
        ber = ber.getSequence(ber_1.EMBER_SEQUENCE);
        while (ber.remain > 0) {
            let seq = ber.getSequence(ber_1.CONTEXT(0));
            seq = seq.getSequence(ber_1.APPLICATION(15));
            seq = seq.getSequence(ber_1.CONTEXT(0));
            sources.push(seq.readInt());
        }
        return sources;
    }
    static decodeConnections(ber) {
        const connections = {};
        const seq = ber.getSequence(ber_1.EMBER_SEQUENCE);
        while (seq.remain > 0) {
            const conSeq = seq.getSequence(ber_1.CONTEXT(0));
            const con = matrix_connection_1.MatrixConnection.decode(conSeq);
            connections[con.target] = (con);
        }
        return connections;
    }
    static disconnectSources(matrix, targetID, sources) {
        const target = Number(targetID);
        if (matrix.connections[target] == null) {
            matrix.connections[target] = new matrix_connection_1.MatrixConnection(target);
        }
        matrix.connections[target].disconnectSources(sources);
        if (sources != null) {
            for (const source of sources) {
                if (matrix._connectedSources[source] == null) {
                    continue;
                }
                if (matrix._connectedSources[source].has(target)) {
                    matrix._connectedSources[source].delete(target);
                    matrix._numConnections--;
                }
            }
        }
    }
    static getSourceConnections(matrix, source) {
        const targets = matrix._connectedSources[source];
        if (targets) {
            return [...targets];
        }
        return [];
    }
    static matrixUpdate(matrix, newMatrix) {
        let modified = false;
        if (newMatrix.targets != null) {
            matrix.targets = newMatrix.targets;
            modified = true;
        }
        if (newMatrix.sources != null) {
            matrix.sources = newMatrix.sources;
            modified = true;
        }
        if (newMatrix.connections != null) {
            if (matrix.connections == null) {
                matrix.connections = {};
                modified = true;
            }
            for (const id in newMatrix.connections) {
                if (newMatrix.connections.hasOwnProperty(id)) {
                    const connection = newMatrix.connections[id];
                    this.validateConnection(matrix, connection.target, connection.sources);
                    if (matrix.connections[connection.target] == null) {
                        matrix.connections[connection.target] = new matrix_connection_1.MatrixConnection(connection.target);
                        modified = true;
                    }
                    if (matrix.connections[connection.target].isDifferent(connection.sources)) {
                        matrix.connections[connection.target].setSources(connection.sources);
                        modified = true;
                    }
                }
            }
        }
        return modified;
    }
    static setSources(matrix, targetID, sources) {
        const currentSource = matrix.connections[targetID] == null || matrix.connections[targetID].sources == null ?
            [] : matrix.connections[targetID].sources;
        if (currentSource.length > 0) {
            this.disconnectSources(matrix, targetID, currentSource);
        }
        Matrix.connectSources(matrix, targetID, sources);
    }
    static validateConnection(matrixNode, targetID, sources) {
        if (targetID < 0) {
            throw new errors_1.InvalidMatrixSignalError(targetID, 'target');
        }
        if (sources) {
            for (let i = 0; i < sources.length; i++) {
                if (sources[i] < 0) {
                    throw new errors_1.InvalidMatrixSignalError(sources[i], `Source at index ${i}`);
                }
            }
        }
        if (matrixNode.mode === matrix_mode_1.MatrixMode.linear) {
            if (targetID >= matrixNode.targetCount) {
                throw new errors_1.InvalidMatrixSignalError(targetID, `Target higher than max value ${matrixNode.targetCount}`);
            }
            if (sources) {
                for (let i = 0; i < sources.length; i++) {
                    if (sources[i] >= matrixNode.sourceCount) {
                        throw new errors_1.InvalidMatrixSignalError(sources[i], `Source at index ${i} higher than max ${matrixNode.sourceCount}`);
                    }
                }
            }
        }
        else if ((matrixNode.targets == null) || (matrixNode.sources == null)) {
            throw new errors_1.InvalidEmberNodeError(matrixNode.getPath(), 'Non-Linear matrix should have targets and sources');
        }
        else {
            if (!matrixNode.targets.includes(targetID)) {
                throw new errors_1.InvalidMatrixSignalError(targetID, 'Not part of existing targets');
            }
            for (let i = 0; i < sources.length; i++) {
                if (!matrixNode.sources.includes(sources[i])) {
                    throw new errors_1.InvalidMatrixSignalError(sources[i], `Unknown source at index ${i}`);
                }
            }
        }
    }
    isMatrix() {
        return true;
    }
    canConnect(targetID, sources, operation) {
        return Matrix.canConnect(this, targetID, sources, operation);
    }
    connect(connections) {
        const r = this.getTreeBranch();
        const m = r.getElementByPath(this.getPath());
        m.connections = connections;
        return r;
    }
    connectSources(targetID, sources) {
        return Matrix.connectSources(this, targetID, sources);
    }
    disconnectSources(targetID, sources) {
        return Matrix.disconnectSources(this, targetID, sources);
    }
    encodeConnections(ber) {
        if (this.connections != null) {
            ber.startSequence(ber_1.CONTEXT(5));
            ber.startSequence(ber_1.EMBER_SEQUENCE);
            for (const id in this.connections) {
                if (this.connections.hasOwnProperty(id)) {
                    ber.startSequence(ber_1.CONTEXT(0));
                    this.connections[id].encode(ber);
                    ber.endSequence();
                }
            }
            ber.endSequence();
            ber.endSequence();
        }
    }
    encodeSources(ber) {
        if (this.sources != null) {
            ber.startSequence(ber_1.CONTEXT(4));
            ber.startSequence(ber_1.EMBER_SEQUENCE);
            for (let i = 0; i < this.sources.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                ber.startSequence(ber_1.APPLICATION(15));
                ber.startSequence(ber_1.CONTEXT(0));
                ber.writeInt(this.sources[i]);
                ber.endSequence();
                ber.endSequence();
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
    }
    encodeTargets(ber) {
        if (this.targets != null) {
            ber.startSequence(ber_1.CONTEXT(3));
            ber.startSequence(ber_1.EMBER_SEQUENCE);
            for (let i = 0; i < this.targets.length; i++) {
                ber.startSequence(ber_1.CONTEXT(0));
                ber.startSequence(ber_1.APPLICATION(14));
                ber.startSequence(ber_1.CONTEXT(0));
                ber.writeInt(this.targets[i]);
                ber.endSequence();
                ber.endSequence();
                ber.endSequence();
            }
            ber.endSequence();
            ber.endSequence();
        }
    }
    getSourceConnections(source) {
        return Matrix.getSourceConnections(this, source);
    }
    setSources(targetID, sources) {
        return Matrix.setSources(this, targetID, sources);
    }
    toJSON() {
        var _a, _b, _c;
        const res = {
            number: this.getNumber(),
            path: this.getPath(),
            type: matrix_type_1.matrixTypeToString(this.type),
            mode: matrix_mode_1.matrixModeToString(this.mode),
            targets: (_a = this.targets) === null || _a === void 0 ? void 0 : _a.slice(0),
            sources: (_b = this.sources) === null || _b === void 0 ? void 0 : _b.slice(0)
        };
        if (this.connections) {
            res.connections = {};
            for (const target in this.connections) {
                if (this.connections.hasOwnProperty(target)) {
                    const t = Number(target);
                    res.connections[t] = { target: t, sources: [] };
                    if (this.connections[t].sources) {
                        res.connections[t].sources = this.connections[t].sources.slice(0);
                    }
                }
            }
        }
        (_c = this.contents) === null || _c === void 0 ? void 0 : _c.toJSON(res);
        return res;
    }
    update(other) {
        const res = super.update(other);
        return Matrix.matrixUpdate(this, other) || res;
    }
    validateConnection(targetID, sources) {
        Matrix.validateConnection(this, targetID, sources);
    }
}
exports.Matrix = Matrix;
//# sourceMappingURL=matrix.js.map