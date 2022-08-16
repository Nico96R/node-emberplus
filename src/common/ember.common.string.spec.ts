import * as BER from '../ber';
import { InvalidEmberNodeError  } from '../error/errors';
import { StringIntegerCollection } from './string-integer-collection';
import { StringIntegerPair } from './string-integer-pair';
import { SIGPIPE } from 'constants';
import { testErrorReturned } from '../fixture/utils';

describe('StringInteger', () => {
    const KEY = 'test';
    const VAL = 4;
    describe('StringIntegerCollection', () => {
        it('should have a toJSON', () => {

            const sic = new StringIntegerCollection();
            sic.addEntry('test', new StringIntegerPair(KEY, VAL));
            const js = sic.toJSON();
            expect(js).toBeDefined();
            expect(js.length).toBe(1);
        });
    });

    describe('StringIntegerPair', () => {
        it('should not accept null key or null value', () => {
            const stringPair = new StringIntegerPair(KEY, VAL);
            testErrorReturned(
                () => {
                    stringPair.key = null;
                }, InvalidEmberNodeError);
            testErrorReturned(
                () => {
                    stringPair.value = null;
            }, InvalidEmberNodeError);
        });
        it('should have setter and getter for key/value', () => {
            const new_key = 'new_key';
            const value = VAL * 2;
            const stringPair = new StringIntegerPair(KEY, VAL);
            stringPair.key = new_key;
            expect(stringPair.key).toBe(new_key);
            stringPair.value = value;
            expect(stringPair.value).toBe(value);
        });
    });
 });
