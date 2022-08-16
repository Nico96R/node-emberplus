import { EmberServer } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { TreeNode } from '../common/tree-node';
import { MatrixContents } from '../common/matrix/matrix-contents';
import { MatrixType } from '../common/matrix/matrix-type';
import { InvalidEmberNodeError } from '../error/errors';

describe('createTreeFromJSON', () => {
    let jsonTree: { [index: string]: any }[];
    beforeEach(() => {
        jsonTree = jsonRoot();
    });

    it('should generate an ember tree from json', () => {
        const root = EmberServer.createTreeFromJSON(jsonTree);
        expect(root).toBeDefined();
        expect(root.elements).toBeDefined();
        expect(root.elements.size).toBe(jsonTree.length);
        expect((root.getElementByNumber(0) as TreeNode).contents.identifier).toBe('scoreMaster');
        expect((root.getElementByNumber(0) as TreeNode).elements.size).toBe(jsonTree[0].children.length);
    });

    it('should throw an error if invalid matrix mode', () => {
        jsonTree[0].children[1].children[0].mode = 'invalid';
        let error;
        try {
            const root = EmberServer.createTreeFromJSON(jsonTree);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof InvalidEmberNodeError);
    });

    it('should support matrix type nToN nonLinear', () => {
        jsonTree[0].children[1].children[0].type = 'nToN';
        jsonTree[0].children[1].children[0].mode = 'nonLinear';
        jsonTree[0].children[1].children[0].maximumConnectsPerTarget = 10;
        jsonTree[0].children[1].children[0].maximumTotalConnects = 100;
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const matrix = root.getElementByPath('0.1.0');
        expect(matrix).toBeDefined();
        expect((matrix.contents as MatrixContents).maximumConnectsPerTarget)
            .toBe(jsonTree[0].children[1].children[0].maximumConnectsPerTarget);
        expect((matrix.contents as MatrixContents).maximumTotalConnects).toBe(jsonTree[0].children[1].children[0].maximumTotalConnects);
    });

    it('should support matrix type oneToOne', () => {
        jsonTree[0].children[1].children[0].type = 'oneToOne';
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const matrix = root.getElementByPath('0.1.0');
        expect(matrix).toBeDefined();
        expect((matrix.contents as MatrixContents).type).toBe(MatrixType.oneToOne);
    });

    it('should throw an error if invalid matrix type', () => {
        jsonTree[0].children[1].children[0].type = 'invalid';
        let error;
        try {
            const root = EmberServer.createTreeFromJSON(jsonTree);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof InvalidEmberNodeError);
    });
});
