import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION, EMBER_SEQUENCE } from '../../ber';
import { MatrixMode, matrixModeToString } from './matrix-mode';
import { MatrixOperation } from './matrix-operation';
import { MatrixType, matrixTypeToString } from './matrix-type';
import { MatrixContents, JMatrixContents } from './matrix-contents';
import { MatrixConnection, JMatrixConnection } from './matrix-connection';
import { TreeNode } from '../tree-node';
import { Parameter } from '../parameter';
import { InvalidMatrixSignalError, InvalidEmberNodeError } from '../../error/errors';
import { Label, LabelInterface } from '../label';

export interface MatrixConnections {[index: number]: MatrixConnection; }

export interface JMatrix {
    number: number;
    path: string;
    type: string;
    mode: string;
    targets?: number[];
    sources?: number[];
    connections?: {[index: number]: JMatrixConnection };
    /////// matrix.contents
    identifier?: string;
    description?: string;
    targetCount?: number;
    sourceCount?: number;
    maximumTotalConnects?: number;
    maximumConnectsPerTarget?: number;
    parametersLocation?: number|string;
    gainParameterNumber?: number;
    labels?: LabelInterface[];
    schemaIdentifiers?: string;
    templateReference?: string;
}

export class Matrix extends TreeNode {
    get contents(): MatrixContents {
        return this._contents as MatrixContents;
    }

    get type(): MatrixType {
        if (this.contents == null || this.contents.type == null) {
            return MatrixType.oneToN;
        }
        return this.contents.type;
    }

    set type(type: MatrixType) {
        if (type !== MatrixType.oneToN) {
            if (this.contents != null)  {
                this.contents.type = type;
            }
        } else {
            this.setContent('type', type);
        }
    }

    get mode(): MatrixMode {
        if (this.contents == null || this.contents.type == null) {
            return MatrixMode.linear;
        }
        return this.contents.mode;
    }

    set mode(mode: MatrixMode) {
        if (mode !== MatrixMode.linear) {
            if (this.contents != null)  {
                this.contents.mode = mode;
            }
        } else {
            this.setContent('mode', mode);
        }
    }

    get targetCount(): number| null {
        return this.contents?.targetCount;
    }

    set targetCount(targetCount: number) {
        this.setContent('targetCount', targetCount);
    }

    get sourceCount(): number| null {
        return this.contents?.sourceCount;
    }

    set sourceCount(sourceCount: number) {
        this.setContent('sourceCount', sourceCount);
    }

    get maximumTotalConnects(): number| null {
        return this.contents?.maximumTotalConnects;
    }

    set maximumTotalConnects(maximumTotalConnects: number) {
        this.setContent('maximumTotalConnects', maximumTotalConnects);
    }

    get maximumConnectsPerTarget(): number| null {
        return this.contents?.maximumConnectsPerTarget;
    }

    set maximumConnectsPerTarget(maximumConnectsPerTarget: number) {
        this.setContent('maximumConnectsPerTarget', maximumConnectsPerTarget);
    }

    get parametersLocation(): string| number| null {
        return this.contents?.parametersLocation;
    }

    set parametersLocation(parametersLocation: number|string) {
        this.setContent('parametersLocation', parametersLocation);
    }

    get gainParameterNumber(): number| null {
        return this.contents?.gainParameterNumber;
    }

    set gainParameterNumber(gainParameterNumber: number) {
        this.setContent('gainParameterNumber', gainParameterNumber);
    }

    get labels(): Label[] | null {
        return this.contents?.labels;
    }

    set labels(labels: Label[]) {
        this.setContent('labels', labels);
    }

    get schemaIdentifiers(): string|null {
        return this.contents?.schemaIdentifiers;
    }

    set schemaIdentifiers(schemaIdentifiers: string) {
        this.setContent('schemaIdentifiers', schemaIdentifiers);
    }

    get templateReference(): string|null {
        return this.contents?.templateReference;
    }

    set templateReference(templateReference: string) {
        this.setContent('templateReference', templateReference);
    }

    public _connectedSources: { [index: number]: Set<number> };
    public _numConnections: number;
    public targets?: number[];
    public sources?: number[];
    public connections?: MatrixConnections;
    public defaultSources?: Parameter[];  // not part of specs.
    constructor(identifier: string = null, _type: MatrixType = MatrixType.oneToN, _mode: MatrixMode = MatrixMode.linear) {
        super();
        if (_type !== MatrixType.oneToN || _mode !== MatrixMode.linear || identifier != null) {
            this.setContents(new MatrixContents(_type, _mode));
            this.identifier = identifier;
        }
        this._connectedSources = {};
        this._numConnections = 0;
        this.targets = null;
        this.sources = null;
        this.connections = {};
    }

    static canConnect(matrixNode: Matrix, targetID: number, sources: number[], operation: MatrixOperation = MatrixOperation.connect): boolean {
        if (matrixNode.connections == null) {
            matrixNode.connections = {};
        }
        if (matrixNode.connections[targetID] == null) {
            matrixNode.connections[targetID] = new MatrixConnection(targetID);
        }
        const type = matrixNode.type == null ? MatrixType.oneToN : matrixNode.type;
        const connection = matrixNode.connections[targetID];
        const oldSources = connection == null || connection.sources == null ? [] : connection.sources.slice();
        const newSources = operation === MatrixOperation.absolute ? sources : oldSources.concat(sources);
        const sMap = new Set(newSources.map(i => Number(i)));

        if (matrixNode.connections[targetID].isLocked()) {
            return false;
        }
        if (type === MatrixType.oneToN &&
            matrixNode.maximumTotalConnects == null &&
            matrixNode.maximumConnectsPerTarget == null) {
            return sMap.size < 2;
        } else if (type === MatrixType.oneToN && sMap.size >= 2) {
            return false;
        } else if (type === MatrixType.oneToOne) {
            if (sMap.size > 1) {
                return false;
            }
            const sourceConnections = matrixNode._connectedSources[sources[0]];
            return sourceConnections == null || sourceConnections.size === 0 || sourceConnections.has(targetID);
        } else {
            // N to N
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

    static connectSources(matrix: Matrix, targetID: number, sources: number[]): void {
        const target = Number(targetID);
        if (matrix.connections == null) {
            matrix.connections = {};
        }
        if (matrix.connections[target] == null) {
            matrix.connections[target] = new MatrixConnection(target);
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

    static decodeTargets(ber: Reader): number[] {
        const targets = [];
        ber = ber.getSequence(EMBER_SEQUENCE);
        while (ber.remain > 0) {
            let seq = ber.getSequence(CONTEXT(0));
            seq = seq.getSequence(APPLICATION(14));
            seq = seq.getSequence(CONTEXT(0));
            targets.push(seq.readInt());
        }
        return targets;
    }

    static decodeSources(ber: Reader): number[] {
        const sources = [];
        ber = ber.getSequence(EMBER_SEQUENCE);
        while (ber.remain > 0) {
            let seq = ber.getSequence(CONTEXT(0));
            seq = seq.getSequence(APPLICATION(15));
            seq = seq.getSequence(CONTEXT(0));
            sources.push(seq.readInt());
        }
        return sources;
    }

    static decodeConnections(ber: Reader): MatrixConnections {
        const connections: MatrixConnections = {};
        const seq = ber.getSequence(EMBER_SEQUENCE);
        while (seq.remain > 0) {
            const conSeq = seq.getSequence(CONTEXT(0));
            const con = MatrixConnection.decode(conSeq);
            connections[con.target] = (con);
        }
        return connections;
    }

    static disconnectSources(matrix: Matrix, targetID: number, sources: number[]): void {
        const target = Number(targetID);
        if (matrix.connections[target] == null) {
            matrix.connections[target] = new MatrixConnection(target);
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

    static getSourceConnections(matrix: Matrix, source: number): number[] {
        const targets = matrix._connectedSources[source];
        if (targets) {
            return [...targets];
        }
        return [];
    }

    static matrixUpdate(matrix: Matrix, newMatrix: Matrix): boolean {
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
                        matrix.connections[connection.target] = new MatrixConnection(connection.target);
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

    static setSources(matrix: Matrix, targetID: number, sources: number[]): void {
        const currentSource = matrix.connections[targetID] == null || matrix.connections[targetID].sources == null ?
            [] : matrix.connections[targetID].sources;
        if (currentSource.length > 0) {
            this.disconnectSources(matrix, targetID, currentSource);
        }
        Matrix.connectSources(matrix, targetID, sources);
    }

    static validateConnection(matrixNode: Matrix, targetID: number, sources?: number[]): void {
        if (targetID < 0) {
            throw new InvalidMatrixSignalError(targetID, 'target');
        }
        if (sources) {
            for (let i = 0; i < sources.length; i++) {
                if (sources[i] < 0) {
                    throw new InvalidMatrixSignalError(sources[i], `Source at index ${i}`);
                }
            }
        }
        if (matrixNode.mode === MatrixMode.linear) {
            if (targetID >= matrixNode.targetCount) {
                throw new InvalidMatrixSignalError(targetID, `Target higher than max value ${matrixNode.targetCount}`);
            }
            if (sources) {
            for (let i = 0; i < sources.length; i++) {
                    if (sources[i] >= matrixNode.sourceCount) {
                        throw new InvalidMatrixSignalError(sources[i], `Source at index ${i} higher than max ${matrixNode.sourceCount}`);
                    }
                }
            }
        } else if ((matrixNode.targets == null) || (matrixNode.sources == null)) {
            throw new InvalidEmberNodeError(matrixNode.getPath(), 'Non-Linear matrix should have targets and sources');
        } else {
            if (!matrixNode.targets.includes(targetID)) {
                throw new InvalidMatrixSignalError(targetID, 'Not part of existing targets');
            }
            for (let i = 0; i < sources.length; i++) {
                if (!matrixNode.sources.includes(sources[i])) {
                    throw new InvalidMatrixSignalError(sources[i], `Unknown source at index ${i}`);
                }
            }
        }
    }

    isMatrix(): boolean {
        return true;
    }

    canConnect(targetID: number, sources: number[], operation: MatrixOperation): boolean {
        return Matrix.canConnect(this, targetID, sources, operation);
    }

    connect(connections: MatrixConnections): TreeNode {
        const r = this.getTreeBranch();
        const m: Matrix = r.getElementByPath(this.getPath()) as Matrix;
        m.connections = connections;
        return r;
    }

    connectSources(targetID: number, sources: number[]): void {
        return Matrix.connectSources(this, targetID, sources);
    }

    disconnectSources(targetID: number, sources: number[]): void {
        return Matrix.disconnectSources(this, targetID, sources);
    }

    encodeConnections(ber: Writer): void {
        if (this.connections != null) {
            ber.startSequence(CONTEXT(5));
            ber.startSequence(EMBER_SEQUENCE);

            for (const id in this.connections) {
                if (this.connections.hasOwnProperty(id)) {
                    ber.startSequence(CONTEXT(0));
                    this.connections[id].encode(ber);
                    ber.endSequence();
                }
            }
            ber.endSequence();
            ber.endSequence();
        }
    }

    encodeSources(ber: Writer): void {
        if (this.sources != null) {
            ber.startSequence(CONTEXT(4));
            ber.startSequence(EMBER_SEQUENCE);

            for (let i = 0; i < this.sources.length; i++) {
                ber.startSequence(CONTEXT(0));
                ber.startSequence(APPLICATION(15));
                ber.startSequence(CONTEXT(0));
                ber.writeInt(this.sources[i]);
                ber.endSequence();
                ber.endSequence();
                ber.endSequence();
            }

            ber.endSequence();
            ber.endSequence();
        }
    }

    encodeTargets(ber: Writer): void {
        if (this.targets != null) {

            ber.startSequence(CONTEXT(3));
            ber.startSequence(EMBER_SEQUENCE);

            for (let i = 0; i < this.targets.length; i++) {
                ber.startSequence(CONTEXT(0));
                ber.startSequence(APPLICATION(14));
                ber.startSequence(CONTEXT(0));
                ber.writeInt(this.targets[i]);
                ber.endSequence();
                ber.endSequence();
                ber.endSequence();
            }

            ber.endSequence();
            ber.endSequence();
        }
    }

    getSourceConnections(source: number): number[] {
        return Matrix.getSourceConnections(this, source);
    }

    setSources(targetID: number, sources: number[]): void {
        return Matrix.setSources(this, targetID, sources);
    }

    toJSON(): JMatrix {
        const res: JMatrix = {
            number: this.getNumber(),
            path: this.getPath(),
            type: matrixTypeToString(this.type),
            mode: matrixModeToString(this.mode),
            targets: this.targets?.slice(0),
            sources: this.sources?.slice(0)
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
        this.contents?.toJSON(res);
        return res;
    }

    update(other: Matrix): boolean {
        const res = super.update(other);
        return Matrix.matrixUpdate(this, other) || res;
    }

    validateConnection(targetID: number, sources: number[]): void {
        Matrix.validateConnection(this, targetID, sources);
    }
}
