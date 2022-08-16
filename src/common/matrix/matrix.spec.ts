import { Matrix, MatrixConnections } from './matrix';
import { MatrixMode } from './matrix-mode';
import { MatrixType } from './matrix-type';

describe('Matrix Update', () => {
  describe('linear matrix', () => {
    let matrix: Matrix;
    beforeEach(() => {
      matrix = new Matrix('m1', MatrixType.oneToN, MatrixMode.linear);
      matrix.contents.targetCount = 5;
      matrix.contents.sourceCount = 2;
      matrix.connectSources(3, [1]);
    });
    it('update matrix connections', () => {
      const newMatrix = new Matrix('m1', MatrixType.oneToN, MatrixMode.linear);
      newMatrix.contents.targetCount = 5;
      newMatrix.contents.sourceCount = 2;
      newMatrix.connectSources(3, [0]);
      Matrix.matrixUpdate(matrix, newMatrix);
      const connections = matrix.connections as MatrixConnections;
      expect(connections).toBeDefined();
      expect(connections[3].sources).toHaveLength(1);
      const sources = connections[3].sources as number[];
      expect(sources).toBeDefined();
      expect(sources[0]).toBe(0);
    });
    it('reject invalid connections (source) during matrix update', () => {
      const newMatrix = new Matrix('m1', MatrixType.oneToN, MatrixMode.linear);
      newMatrix.contents.targetCount = 5;
      newMatrix.contents.sourceCount = 2;
      newMatrix.connectSources(3, [2]);
      expect(() => Matrix.matrixUpdate(matrix, newMatrix)).toThrow();
    });
    it('reject invalid connections (target) during matrix update', () => {
      const newMatrix = new Matrix('m1', MatrixType.oneToN, MatrixMode.linear);
      newMatrix.contents.targetCount = 5;
      newMatrix.contents.sourceCount = 2;
      newMatrix.connectSources(14, [0]);
      expect(() => Matrix.matrixUpdate(matrix, newMatrix)).toThrow();
    });
  });
  describe('non-linear matrix', () => {
    let matrix: Matrix;
    beforeEach(() => {
      matrix = new Matrix('m1', MatrixType.oneToN, MatrixMode.nonLinear);
      matrix.targets = [1, 3, 5, 6];
      matrix.sources = [0, 1, 4];
      matrix.connectSources(3, [0]);
    });
    it('update matrix connections', () => {
      const newMatrix = new Matrix('m1', MatrixType.oneToN, MatrixMode.nonLinear);
      newMatrix.targets = [1, 3, 5, 6];
      newMatrix.sources = [0, 1, 4];
      newMatrix.connectSources(3, [4]);
      Matrix.matrixUpdate(matrix, newMatrix);
      const connections = matrix.connections as MatrixConnections;
      expect(connections).toBeDefined();
      const sources = connections[3].sources as number[];
      expect(sources).toBeDefined();
      expect(sources).toHaveLength(1);
      expect(sources[0]).toBe(4);
    });
    it('reject invalid connections (source) during matrix update', () => {
      const newMatrix = new Matrix('m1', MatrixType.oneToN, MatrixMode.nonLinear);
      newMatrix.targets = [1, 3, 5, 6];
      newMatrix.sources = [0, 1, 4];
      newMatrix.connectSources(3, [2]);
      expect(() => Matrix.matrixUpdate(matrix, newMatrix)).toThrow();
    });
    it('reject invalid connections (target) during matrix update', () => {
      const newMatrix = new Matrix('m1', MatrixType.oneToN, MatrixMode.nonLinear);
      newMatrix.targets = [1, 3, 5, 6];
      newMatrix.sources = [0, 1, 4];
      newMatrix.connectSources(4, [4]);
      expect(() => Matrix.matrixUpdate(matrix, newMatrix)).toThrow();
    });
  });
});
