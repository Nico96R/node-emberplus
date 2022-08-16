import { EmberServer, EmberServerOptions } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { UnknownElementError, MissingElementContentsError } from '../error/errors';
import { MatrixType } from '../common/matrix/matrix-type';
import { Matrix } from '../common/matrix/matrix';

const LOCALHOST = '127.0.0.1';
const PORT = 9009;

describe('Matrix', () => {
    const MATRIX_PATH = '0.1.0';
    let server: EmberServer;
    let jsonTree: { [index: string]: any }[];
    beforeEach(() => {
        jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions = new EmberServerOptions(
            LOCALHOST, PORT, root
        );
        server = new EmberServer(serverOptions);
        server.on('error', () => {
            // ignore
        });
        server.on('clientError', () => {
            // ignore
        });
        return server.listen();
    });
    afterEach(() => {
        return server.closeAsync();
    });

    it('should generate connections structure if none provided when calling JSONtoStree', () => {
        const js = jsonRoot();
        js[0].children[1].children[0].connections = null;
        const tree = EmberServer.createTreeFromJSON(js);
        const matrix = tree.getElementByPath(MATRIX_PATH) as Matrix;
        expect(matrix.connections).toBeDefined();
        for (let i = 0; i < matrix.contents.targetCount; i++) {
            expect(matrix.connections[i]).toBeDefined();
            expect(matrix.connections[i].target).toBe(i);
        }
    });

    it('should have a matrixConnect function', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        matrix.connections[0].setSources([]);
        server.matrixConnect(MATRIX_PATH, 0, [1]);
        expect(matrix.connections[0].sources).toBeDefined();
        expect(matrix.connections[0].sources.length).toBe(1);
        expect(matrix.connections[0].sources[0]).toBe(1);
    });

    it('should throw an error if can\'t find matrix', () => {
        try {
            server.matrixConnect('0.99.0', 0, [1]);
            throw new Error('Should not succeed');
        } catch (error) {
            expect(error instanceof UnknownElementError);
        }
    });

    it('should throw an error if invalid matrix', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH);
        (matrix as {[index: string]: any}).setContents(null);
        try {
            server.matrixConnect(MATRIX_PATH, 0, [1]);
            throw new Error('Should not succeed');
        } catch (error) {
            expect(error instanceof MissingElementContentsError);
        }
    });

    it('should have a matrixSet operation on matrix', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        matrix.connections[0].setSources([0]);
        server.matrixSet(MATRIX_PATH, 0, [1]);
        expect(matrix.connections[0].sources).toBeDefined();
        expect(matrix.connections[0].sources.length).toBe(1);
        expect(matrix.connections[0].sources[0]).toBe(1);
    });

    it('should have a matrixDisconnect operation on matrix', () => {
        const matrix = server.tree.getElementByPath(MATRIX_PATH) as Matrix;
        matrix.contents.type = MatrixType.nToN;
        matrix.connections[0].setSources([1]);
        server.matrixDisconnect(MATRIX_PATH, 0, [1]);
        expect(matrix.connections[0].sources).toBeDefined();
        expect(matrix.connections[0].sources.length).toBe(0);
    });
});
