import { ErrorMultipleError, InvalidEmberResponseError, ASN1Error, UnimplementedEmberTypeError, PathDiscoveryFailureError, InvalidEmberNodeError, InvalidBERFormatError } from '../error/errors';

describe('Errors', () => {
    it('should have ErrorMultiple to combine errors', () => {
        const errors = [
            new Error('error1'),
            new Error('error2')
        ];
        const error = new ErrorMultipleError(errors);
        expect(error).toBeDefined();
        expect(error.errors).toBeDefined();
        expect(error.errors.length).toBe(errors.length);
    });

    it('should have InvalidEmberResponse', () => {
        const error = new InvalidEmberResponseError('req');
        expect(error).toBeDefined();
    });

    it('should have ASN1Error error', () => {
        const error = new ASN1Error('not good');
        expect(error).toBeDefined();
    });

    it('should have UnimplementedEmberTypeError error', () => {
        const error = new UnimplementedEmberTypeError(0);
        expect(error).toBeDefined();
    });

    it('should have PathDiscoveryFailure error', () => {
        const error = new PathDiscoveryFailureError('1.2.3');
        error.setPath('4.5.6');
        expect(error).toBeDefined();
    });

    it('should have InvalidEmberNode error', () => {
        expect(new InvalidEmberNodeError('1.2.3', 'info')).toBeDefined();
        expect(new InvalidEmberNodeError('1.2.3')).toBeDefined();
        expect(new InvalidEmberNodeError()).toBeDefined();
    });

    it('should have InvalidBERFormat error', () => {
        expect(new InvalidBERFormatError('info')).toBeDefined();
        expect(new InvalidBERFormatError()).toBeDefined();
    });
});
