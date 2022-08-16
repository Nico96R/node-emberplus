import { ExtendedWriter, ExtendedReader } from '../ber';

describe('BER', () => {
    it('should handle real', () => {
        const writer = new ExtendedWriter();
        const value = 0x1FFFFFF;
        writer.writeReal(value);
        const reader = new ExtendedReader(writer.buffer);
        expect(reader.readReal()).toBe(value);
    });
    it('should handle NaN in writeReal', () => {
        const writer = new ExtendedWriter();
        const value: unknown = 'test';
        writer.writeReal(value as number);
        const reader = new ExtendedReader(writer.buffer);
        expect(reader.readLength()).toBe(1);
        expect(reader.readValue()).toBe(NaN);
    });
    it('should handle -Infinity in writeReal', () => {
        const writer = new ExtendedWriter();
        const value = -Infinity;
        writer.writeReal(value);
        const reader = new ExtendedReader(writer.buffer);
        expect(reader.readLength()).toBe(1);
        expect(reader.readValue()).toBe(value);
    });
    it('should handle Infinity in writeReal', () => {
        const writer = new ExtendedWriter();
        const value = -Infinity;
        writer.writeReal(value);
        const reader = new ExtendedReader(writer.buffer);
        expect(reader.readLength()).toBe(1);
        expect(reader.readValue()).toBe(value);
    });
});
