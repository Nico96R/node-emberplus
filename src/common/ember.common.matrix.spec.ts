import * as BER from '../ber';
import { UnimplementedEmberTypeError, InvalidEmberNodeError, InvalidMatrixSignalError } from '../error/errors';
import { TreeNode } from './tree-node';
import { MatrixType, matrixTypeFromString } from './matrix/matrix-type';
import { MatrixMode, matrixModeFromString } from './matrix/matrix-mode';
import { Node } from './node';
import { MatrixNode } from './matrix/matrix-node';
import { MatrixContents } from './matrix/matrix-contents';
import { QualifiedMatrix } from './matrix/qualified-matrix';
import { Matrix } from './matrix/matrix';
import { MatrixConnection } from './matrix/matrix-connection';
import { Label } from './label';
import { MatrixOperation, matrixOperationFromString } from './matrix/matrix-operation';
import { childDecode } from './common';
import { testErrorReturned } from '../fixture/utils';
import { matrixDispositionFromString, MatrixDisposition } from './matrix/matrix-disposition';

describe('Matrix', () => {
    describe('ValidateConnection', () => {
        const PATH = '0.0.0';
        let matrixNode: Matrix;
        let qMatrixNode: Matrix;
        const TARGETCOUNT = 5;
        const SOURCECOUNT = 5;
        beforeEach(() => {
            matrixNode = new MatrixNode(0, 'matrix');
            qMatrixNode = new QualifiedMatrix(PATH, 'matrix', MatrixType.oneToN, MatrixMode.linear);
            matrixNode.description = 'matrix';
            matrixNode.targetCount = TARGETCOUNT;
            matrixNode.sourceCount = SOURCECOUNT;
            qMatrixNode.update(matrixNode);
        });

        it('should have encoder/decoder', () => {
            matrixNode.addChild(new Node(0));
            let writer = new BER.ExtendedWriter();
            matrixNode.encode(writer);
            let newMatrixNode: Matrix = childDecode(new BER.ExtendedReader(writer.buffer)) as Matrix;
            expect(newMatrixNode.getChildren().length).toBe(1);

            writer = new BER.ExtendedWriter();
            qMatrixNode.encode(writer);
            newMatrixNode = QualifiedMatrix.decode(new BER.ExtendedReader(writer.buffer));
            expect(newMatrixNode.path).toBe(PATH);

            matrixNode.identifier = null;
            matrixNode.type = null;
            matrixNode.mode = null;
            writer = new BER.ExtendedWriter();
            matrixNode.encode(writer);
            newMatrixNode = childDecode(new BER.ExtendedReader(writer.buffer)) as Matrix;
            expect(newMatrixNode.identifier == null).toBeTruthy();

            writer = new BER.ExtendedWriter();
            qMatrixNode.encode(writer);
            newMatrixNode = QualifiedMatrix.decode(new BER.ExtendedReader(writer.buffer));
            expect(newMatrixNode.identifier).toBe(qMatrixNode.identifier);

            (matrixNode as {[index: string]: any}).setContents(null);
            writer = new BER.ExtendedWriter();
            matrixNode.encode(writer);
            newMatrixNode = childDecode(new BER.ExtendedReader(writer.buffer)) as Matrix;
            expect(newMatrixNode.contents == null).toBeTruthy();

            (qMatrixNode as {[index: string]: any}).setContents(null);
            writer = new BER.ExtendedWriter();
            qMatrixNode.encode(writer);
            newMatrixNode = QualifiedMatrix.decode(new BER.ExtendedReader(writer.buffer));
            expect(newMatrixNode.contents == null).toBeTruthy();
        });

        it('should throw an error if target is negative', () => {
            testErrorReturned(
                () => {
                    Matrix.validateConnection(matrixNode, -1, []);
            }, InvalidMatrixSignalError);
        });

        it('should throw an error if source is negative', () => {
            testErrorReturned(
                () => {
                    Matrix.validateConnection(matrixNode, 0, [-1]);
            }, InvalidMatrixSignalError);
        });

        it('should throw an error if target higher than max target', () => {
            testErrorReturned(
                () => {
                    Matrix.validateConnection(matrixNode, TARGETCOUNT, [0]);
            }, InvalidMatrixSignalError);
        });

        it('should throw an error if target higher than max target', () => {
            testErrorReturned(
                () => {
                    Matrix.validateConnection(matrixNode, 0, [SOURCECOUNT]);
            }, InvalidMatrixSignalError);
        });

        it('should throw an error if non-Linear Matrix without targets', () => {
            matrixNode.mode = MatrixMode.nonLinear;
            testErrorReturned(
                () => {
                    Matrix.validateConnection(matrixNode, 0, [0]);
            }, InvalidEmberNodeError);
                matrixNode.mode = MatrixMode.linear;
        });

        it('should throw an error if non-Linear Matrix without sources', () => {
            matrixNode.mode = MatrixMode.nonLinear;
            matrixNode.targets = [0, 3];
            testErrorReturned(
                () => {
                    Matrix.validateConnection(matrixNode, 0, [0]);
            }, InvalidEmberNodeError);
                matrixNode.mode = MatrixMode.linear;
        });

        it('should throw an error if non-Linear Matrix and not valid target', () => {
            matrixNode.mode = MatrixMode.nonLinear;
            matrixNode.targets = [0, 3];
            matrixNode.sources = [0, 3];
            matrixNode.connections = {
                0: new MatrixConnection(0)
            };
            const min: Matrix = (matrixNode as MatrixNode).getMinimal(true) as Matrix;
            expect(min.sources).toBeDefined();
            testErrorReturned(
                () => {
                    Matrix.validateConnection(matrixNode, 1, [0]);
                }, InvalidMatrixSignalError);
            matrixNode.mode = MatrixMode.linear;
        });

        it('should have getMinimal function', () => {
            (matrixNode as {[index: string]: any}).setContents(null);
            matrixNode.connections = null;
            const min = (matrixNode as MatrixNode).getMinimal(true);
            expect(min.number).toBe(matrixNode.getNumber());
        });

        it('should throw an error if non-Linear Matrix and not valid source', () => {
            matrixNode.mode = MatrixMode.nonLinear;
            matrixNode.targets = [0, 3];
            matrixNode.sources = [0, 3];
            testErrorReturned(
                () => {
                    Matrix.validateConnection(matrixNode, 0, [1]);
            }, InvalidMatrixSignalError);
            matrixNode.mode = MatrixMode.linear;
        });

        it('should not throw an error on valid non-linear connect', () => {
            let error = null;
            matrixNode.mode = MatrixMode.nonLinear;
            matrixNode.targets = [0, 3];
            matrixNode.sources = [0, 3];
            try {
                Matrix.validateConnection(matrixNode, 0, [0]);
            } catch (e) {
                error = e;
            }
            expect(error == null).toBeTruthy();
        });

        it('should not throw an error if can\'t decode MatrixContent', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.EMBER_SET);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    MatrixContents.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });
    });

    describe('MatrixUpdate', () => {
        let matrixNode: Matrix;
        const TARGETCOUNT = 5;
        const SOURCECOUNT = 5;
        beforeEach(() => {
            matrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.linear);
            matrixNode.description = 'matrix';
            matrixNode.targetCount = TARGETCOUNT;
            matrixNode.sourceCount = SOURCECOUNT;
        });

        it('should update connections', () => {
            matrixNode.connections = {
                0: new MatrixConnection(0)
            };

            const newMatrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.nonLinear);
            newMatrixNode.description = 'matrix';
            matrixNode.connections[0].sources = [1];
            newMatrixNode.connections = {
                0: matrixNode.connections[0],
                1: new MatrixConnection(1)
            };
            Matrix.matrixUpdate(matrixNode, newMatrixNode);
            expect(matrixNode.connections[1]).toBeDefined();
            matrixNode.connections = null;
            Matrix.matrixUpdate(matrixNode, newMatrixNode);
            expect(matrixNode.connections[1]).toBeDefined();
        });

        it('should ignore empty connections request', () => {
            matrixNode.connections = {
                0: new MatrixConnection(0)
            };

            const newMatrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.nonLinear);
            newMatrixNode.description = 'matrix';
            newMatrixNode.connections = null;
            Matrix.matrixUpdate(matrixNode, newMatrixNode);
            expect(matrixNode.connections[0]).toBeDefined();
        });

        it('should throw error if invalid target inside new connections', () => {
            matrixNode.connections = {
                0: new MatrixConnection(0)
            };

            const newMatrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.nonLinear);
            newMatrixNode.description = 'matrix';
            newMatrixNode.connections = {
                7: new MatrixConnection(7)
            };
            testErrorReturned(
                () => {
                    Matrix.matrixUpdate(matrixNode, newMatrixNode);
            }, InvalidMatrixSignalError);
        });

        it('should not throw an error on valid non-linear connect', () => {
            let error = null;
            const newMatrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.nonLinear);
            newMatrixNode.targets = [0, 3];
            newMatrixNode.sources = [0, 3];
            newMatrixNode.description = 'matrix';

            matrixNode.mode = MatrixMode.nonLinear;
            matrixNode.connections = null;
            try {
                Matrix.matrixUpdate(matrixNode, newMatrixNode);
            } catch (e) {
                error = e;
            }
            expect(error == null).toBeTruthy();
            expect(matrixNode.targets).toBeDefined();
            expect(matrixNode.targets.length).toBe(newMatrixNode.targets.length);
            expect(matrixNode.sources.length).toBe(newMatrixNode.sources.length);
        });
    });

    describe('DisconnectSources', () => {
        let matrixNode: Matrix;
        const TARGETCOUNT = 5;
        const SOURCECOUNT = 5;
        beforeEach(() => {
            matrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.linear);
            matrixNode.description = 'matrix';
            matrixNode.targetCount = TARGETCOUNT;
            matrixNode.sourceCount = SOURCECOUNT;
        });

        it('should generate the connection structure if not existent', () => {
            Matrix.disconnectSources(matrixNode, 0, [1]);
        });

        it('should disconnect existing connection', () => {
            matrixNode.connections = {
                0: new MatrixConnection(0)
            };
            Matrix.connectSources(matrixNode, 0, [1]);
            Matrix.connectSources(matrixNode, 1, [1]);
            expect(matrixNode._numConnections).toBe(2);
            Matrix.disconnectSources(matrixNode, 0, [1]);
            expect(matrixNode.connections[0]).toBeDefined();
            expect(matrixNode.connections[0].sources.length).toBe(0);
            expect(matrixNode._numConnections).toBe(1);
        });

        it('should ignore disconnect with no source', () => {
            matrixNode.connections = {
                0: new MatrixConnection(0)
            };
            Matrix.connectSources(matrixNode, 0, [1]);
            expect(matrixNode._numConnections).toBe(1);
            Matrix.disconnectSources(matrixNode, 0, null);
            expect(matrixNode.connections[0]).toBeDefined();
            expect(matrixNode.connections[0].sources.length).toBe(1);
        });

        it('should ignore disconnect with not connected source', () => {
            matrixNode.connections = {
                0: new MatrixConnection(0)
            };
            Matrix.connectSources(matrixNode, 0, [1]);
            Matrix.connectSources(matrixNode, 1, [0]);
            expect(matrixNode._numConnections).toBe(2);
            Matrix.disconnectSources(matrixNode, 0, [0]);
            expect(matrixNode.connections[0]).toBeDefined();
            expect(matrixNode.connections[0].sources.length).toBe(1);
            expect(matrixNode._numConnections).toBe(2);
        });
    });

    describe('DecodeConnections', () => {
        let matrixNode: Matrix;
        const TARGETCOUNT = 5;
        const SOURCECOUNT = 5;
        beforeEach(() => {
            matrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.linear);
            matrixNode.description = 'matrix';
            matrixNode.targetCount = TARGETCOUNT;
            matrixNode.sourceCount = SOURCECOUNT;
        });

        it('should generate the connection structure if not existent', () => {
            const SOURCEID = 0;
            Matrix.connectSources(matrixNode, 0, [SOURCEID]);
            const writer = new BER.ExtendedWriter();
            matrixNode.encodeConnections(writer);
            const ber = new BER.ExtendedReader(writer.buffer);
            const seq = ber.getSequence(BER.CONTEXT(5));
            const connections = Matrix.decodeConnections(seq);
            expect(connections[0].sources).toBeDefined();
            expect(connections[0].sources.length).toBe(1);
            expect(connections[0].sources[0]).toBe(SOURCEID);
        });
    });

    describe('EncodeConnections', () => {
        it('should ignore empty/null connections', () => {
            const matrixNode = new MatrixNode(0);
            matrixNode.connections = null;
            const writer = new BER.ExtendedWriter();
            matrixNode.encodeConnections(writer);
            expect(writer.buffer.length).toBe(0);
        });
    });

    describe('CanConnect', () => {
        let matrixNode: Matrix;
        const TARGETCOUNT = 5;
        const SOURCECOUNT = 5;
        beforeEach(() => {
            matrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.linear);
            matrixNode.identifier = 'matrix';
            matrixNode.description = 'matrix';
            matrixNode.targetCount = TARGETCOUNT;
            matrixNode.sourceCount = SOURCECOUNT;
        });

        it('should consider default type as 1toN', () => {
            matrixNode.connections = null;
            matrixNode.type = null;
            matrixNode.maximumTotalConnects = 1;
            const res: boolean = Matrix.canConnect(matrixNode, 0, [0, 3]);
            expect(res).toBeFalsy();
        });

        it('should return false if more than 1 source in 1toN', () => {
            matrixNode.connections = null;
            matrixNode.maximumTotalConnects = 1;
            const res = Matrix.canConnect(matrixNode, 0, [0, 3]);
            expect(res).toBeFalsy();
        });

        it('should always return true if NtoN and no limits', () => {
            matrixNode.type = MatrixType.nToN;
            matrixNode.mode = MatrixMode.linear;
            matrixNode.connections = null;
            matrixNode.maximumConnectsPerTarget = null;
            matrixNode.maximumTotalConnects = null;
            const res = Matrix.canConnect(matrixNode, 0, [0, 3]);
            expect(res).toBeTruthy();
        });

        it('should check maximumTotalConnects in NtoN and reject on limit pass', () => {
            matrixNode.type = MatrixType.nToN;
            matrixNode.mode = MatrixMode.linear;
            matrixNode.maximumConnectsPerTarget = null;
            matrixNode.maximumTotalConnects = 2;
            Matrix.connectSources(matrixNode, 0, [1, 2]);
            const res = Matrix.canConnect(matrixNode, 1, [3]);
            expect(res).toBeFalsy();
        });

        it('should check maximumTotalConnects in NtoN and accept if below limit', () => {
            matrixNode.type = MatrixType.nToN;
            matrixNode.mode = MatrixMode.linear;
            matrixNode.connections = null;
            matrixNode.maximumConnectsPerTarget = null;
            matrixNode.maximumTotalConnects = 2;
            const res = Matrix.canConnect(matrixNode, 1, [3]);
            expect(res).toBeTruthy();
        });

        it('should check locked connection', () => {
            matrixNode.type = MatrixType.nToN;
            matrixNode.mode = MatrixMode.linear;
            matrixNode.connections = null;
            matrixNode.maximumConnectsPerTarget = null;
            matrixNode.maximumTotalConnects = 2;
            Matrix.connectSources(matrixNode, 0, [1]);
            matrixNode.connections[0].lock();
            let res = Matrix.canConnect(matrixNode, 0, [3]);
            expect(res).toBeFalsy();
            matrixNode.connections[0].unlock();
            res = Matrix.canConnect(matrixNode, 0, [3]);
            expect(res).toBeTruthy();
        });
    });

    describe('Matrix Non-Linear', () => {
        it('should have encoder / decoder', () => {
            const PATH = '0.1.2';
            const matrixNode = new MatrixNode(0, 'matrix');
            const qMatrixNode = new QualifiedMatrix(PATH, 'matrix');
            matrixNode.type = MatrixType.oneToN;
            matrixNode.mode = MatrixMode.nonLinear;
            matrixNode.gainParameterNumber = 4;
            matrixNode.identifier = 'matrix';
            matrixNode.description = 'matrix';
            matrixNode.maximumTotalConnects = 5;
            matrixNode.maximumConnectsPerTarget = 1;
            matrixNode.parametersLocation = '1.2.3';
            matrixNode.schemaIdentifiers = 'de.l-s-b.emberplus.schema1';
            matrixNode.templateReference = '0.1.2.3';
            qMatrixNode.update(matrixNode);
            matrixNode.targets = [0, 3];
            qMatrixNode.targets = matrixNode.targets;
            matrixNode.sources = [1, 2];
            qMatrixNode.sources = matrixNode.sources;
            let writer = new BER.ExtendedWriter();
            matrixNode.encode(writer);
            let newMatrixNode: Matrix = MatrixNode.decode(new BER.ExtendedReader(writer.buffer));
            expect(newMatrixNode.targets).toBeDefined();

            writer = new BER.ExtendedWriter();
            qMatrixNode.encode(writer);
            newMatrixNode = QualifiedMatrix.decode(new BER.ExtendedReader(writer.buffer));
            expect(newMatrixNode.targets).toBeDefined();

            // Should support int
            matrixNode.parametersLocation = 123;
            writer = new BER.ExtendedWriter();
            matrixNode.encode(writer);
            newMatrixNode = MatrixNode.decode(new BER.ExtendedReader(writer.buffer));
            expect(newMatrixNode.targets).toBeDefined();
            expect(newMatrixNode.parametersLocation).toBe(matrixNode.parametersLocation);
        });

        it('should have connect function', () => {
            const root = new TreeNode();
            const matrixNode = new MatrixNode(0, 'matrix', MatrixType.oneToN, MatrixMode.nonLinear);
            matrixNode.description = 'matrix';
            matrixNode.targets = [0, 3];
            matrixNode.sources = [1, 2];
            root.addChild(matrixNode);
            const connect = matrixNode.connect({ 0: new MatrixConnection(0) });
            expect(connect).toBeDefined();
        });

        it('should throw an error if can\'t decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.APPLICATION(13));
                    writer.startSequence(BER.CONTEXT(0));
                    writer.writeInt(1);
                    writer.endSequence(); // BER.CONTEXT(0)
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    MatrixNode.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });
    });

    describe('Label', () => {
        it('should throw an error if it fails to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(BER.APPLICATION(18));
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    Label.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should throw an error if no basePath', () => {
            testErrorReturned(
                () => {
                    const label = new Label(null, 'test');
                    const writer = new BER.ExtendedWriter();
                    label.encode(writer);
                }, InvalidEmberNodeError);
        });

        it('should throw an error if no description', () => {
            testErrorReturned(
                () => {
                    const label = new Label('1.2.3', null);
                    const writer = new BER.ExtendedWriter();
                    label.encode(writer);
            }, InvalidEmberNodeError);
        });

        it('should be able to encode/decode a valid label', () => {
            const label = new Label('1.2.3', 'primary');
            const writer = new BER.ExtendedWriter();
            label.encode(writer);
            const reader = new BER.ExtendedReader(writer.buffer);
            const newLabel = Label.decode(reader);
            expect(newLabel.description).toBe(label.description);
            expect(newLabel.basePath).toBe(label.basePath);
        });
    });

    describe('Generic', () => {
        it('should have a matrixOperationFromString function', () => {
            expect(matrixOperationFromString('connect')).toBe(MatrixOperation.connect);
            expect(matrixOperationFromString('absolute')).toBe(MatrixOperation.absolute);
            expect(matrixOperationFromString('disconnect')).toBe(MatrixOperation.disconnect);
        });

        it('should have a matrixTypeFromString function', () => {
            expect(matrixTypeFromString('nToN')).toBe(MatrixType.nToN);
            expect(matrixTypeFromString('oneToN')).toBe(MatrixType.oneToN);
            expect(matrixTypeFromString('oneToOne')).toBe(MatrixType.oneToOne);
        });
        it('should have a matrixDispositionFromString function', () => {
            expect(matrixDispositionFromString('tally')).toBe(MatrixDisposition.tally);
            expect(matrixDispositionFromString('locked')).toBe(MatrixDisposition.locked);
            expect(matrixDispositionFromString('modified')).toBe(MatrixDisposition.modified);
            expect(matrixDispositionFromString('pending')).toBe(MatrixDisposition.pending);
        });

        it('should have a matrixModeFromString function', () => {
            expect(matrixModeFromString('linear')).toBe(MatrixMode.linear);
            expect(matrixModeFromString('nonLinear')).toBe(MatrixMode.nonLinear);
        });
    });

    describe('QualifiedMatrix', () => {
        const PATH = '1.2.3';
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(QualifiedMatrix.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    QualifiedMatrix.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should have a subscribe/unsubscribe function', () => {
            const qMatrixNode = new QualifiedMatrix(PATH);
            const cb = () => { };
            const cmd = qMatrixNode.subscribe(cb);
            expect(cmd).toBeDefined();
            expect(cmd instanceof TreeNode);
        });
    });

    describe('MatrixConnection', () => {
        it('should have a decoder and throw error if can\'t decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(MatrixConnection.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    MatrixConnection.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should decode connection with no source', () => {
            const matrixConnection = new MatrixConnection(0);
            matrixConnection.sources = [];
            const writer = new BER.ExtendedWriter();
            matrixConnection.encode(writer);
            const newMC = MatrixConnection.decode(new BER.ExtendedReader(writer.buffer));
            expect(newMC.sources).toBeDefined();
            expect(newMC.sources.length).toBe(0);
        });

        it('should have isDifferent function to compare', () => {
            const matrixConnection = new MatrixConnection(0);
            matrixConnection.sources = [1, 2, 3];
            expect(matrixConnection.isDifferent([1, 4, 5])).toBeTruthy();
            expect(matrixConnection.isDifferent([1, 2, 3])).toBeFalsy();
            expect(matrixConnection.isDifferent([2, 1, 3])).toBeFalsy();
        });

        it('should delete existing sources if setSources called with null', () => {
            const matrixConnection = new MatrixConnection(0);
            matrixConnection.sources = [1, 2, 3];
            matrixConnection.setSources(null);
            expect(matrixConnection.sources).not.toBeDefined();
        });
    });
    describe('MatrixContent properties directly accessible from MatrixNode/QualifiedMatrix', () => {
        const path = '0.1.10';
        const value = 'zero';
        const number = 10;
        const identifier = 'identifier';
        it('should provide getter and setter for each property', () => {
            const matrixList = [
                new QualifiedMatrix(path, identifier),
                new MatrixNode(number, identifier)
            ];
            for (const matrix of matrixList) {
                matrix.schemaIdentifiers = value;
                expect(matrix.schemaIdentifiers).toBe(value);
                expect(matrix.contents.schemaIdentifiers).toBe(value);
                matrix.templateReference = value;
                expect(matrix.templateReference).toBe(value);
                expect(matrix.contents.templateReference).toBe(value);
                matrix.labels = [new Label('0.1.1000', 'label-description')];
                expect(matrix.labels.length).toBe(1);
                expect(matrix.contents.labels.length).toBe(1);
                matrix.gainParameterNumber = number;
                expect(matrix.gainParameterNumber).toBe(number);
                expect(matrix.contents.gainParameterNumber).toBe(number);
                matrix.parametersLocation = number;
                expect(matrix.parametersLocation).toBe(number);
                expect(matrix.contents.parametersLocation).toBe(number);
                matrix.maximumConnectsPerTarget = number;
                expect(matrix.maximumConnectsPerTarget).toBe(number);
                expect(matrix.contents.maximumConnectsPerTarget).toBe(number);
                matrix.maximumTotalConnects = number;
                expect(matrix.maximumTotalConnects).toBe(number);
                expect(matrix.contents.maximumTotalConnects).toBe(number);
                matrix.sourceCount = number;
                expect(matrix.sourceCount).toBe(number);
                expect(matrix.contents.sourceCount).toBe(number);
                matrix.targetCount = number;
                expect(matrix.targetCount).toBe(number);
                expect(matrix.contents.targetCount).toBe(number);
                matrix.mode = MatrixMode.nonLinear;
                expect(matrix.mode).toBe(MatrixMode.nonLinear);
                expect(matrix.contents.mode).toBe(MatrixMode.nonLinear);
                matrix.type = MatrixType.oneToOne;
                expect(matrix.type).toBe(MatrixType.oneToOne);
                expect(matrix.contents.type).toBe(MatrixType.oneToOne);
            }
        });
        it('should return undefined if no contents defined and trying to access property', () => {
            const matrixList = [
                new QualifiedMatrix(path),
                new MatrixNode(number)
            ];
            for (const matrix of matrixList) {
                expect(matrix.maximumConnectsPerTarget).not.toBeDefined();
                expect(matrix.schemaIdentifiers).not.toBeDefined();
                expect(matrix.sourceCount).not.toBeDefined();
                expect(matrix.targetCount).not.toBeDefined();
                expect(matrix.maximumTotalConnects).not.toBeDefined();
                expect(matrix.parametersLocation).not.toBeDefined();
                expect(matrix.gainParameterNumber).not.toBeDefined();
                expect(matrix.labels).not.toBeDefined();
                expect(matrix.templateReference).not.toBeDefined();
            }

        });
        it('should return default type and mode if no contents defined and trying to access property', () => {
            const matrixList = [
                new QualifiedMatrix(path),
                new MatrixNode(number)
            ];
            for (const matrix of matrixList) {
                expect(matrix.type).toBe(MatrixType.oneToN);
                expect(matrix.mode).toBe(MatrixMode.linear);
            }

        });
        it('should throw an error if trying to set a property and no contents defined', () => {
            const matrixList = [
                new QualifiedMatrix(path),
                new MatrixNode(number)
            ];
            for (const matrix of matrixList) {
                testErrorReturned(
                    () => {
                        matrix.maximumTotalConnects = number;
                }, InvalidEmberNodeError);
            }
        });
    });
    describe('toJSON', () => {
        const path = '0.1.10';
        const value = 'zero';
        const number = 10;
        const identifier = 'identifier';
        it('should include all props', () => {
            const matrix = new MatrixNode(number, 'identifier');
            matrix.sourceCount = number;
            matrix.targetCount = number;
            matrix.gainParameterNumber = number;
            matrix.schemaIdentifiers = value;
            matrix.maximumConnectsPerTarget = number;
            matrix.maximumTotalConnects = number;
            matrix.parametersLocation = path;
            matrix.labels = [new Label(path, value)];
            matrix.templateReference = value;

            const js = matrix.toJSON();
            expect(js).toBeDefined();
            expect(js.sourceCount).toBe(number);
            expect(js.targetCount).toBe(number);
            expect(js.gainParameterNumber).toBe(number);
            expect(js.maximumConnectsPerTarget).toBe(number);
            expect(js.schemaIdentifiers).toBe(value);
            expect(js.parametersLocation).toBe(path);
            expect(js.templateReference).toBe(value);
            expect(js.labels.length).toBe(1);
        });
    });

});
