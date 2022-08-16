import { S101Codec, S101CodecEvent } from './s101.codec';
import { SmartBuffer } from 'smart-buffer';
import { LoggingService } from '../logging/logging.service';

 S101Codec.validateFrame = (b: Buffer): boolean => true;

describe('S101Codec', () => {
    describe('handleFrame', () => {
        it('should ignore unknow frame type', () => {
            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            const frame = new SmartBuffer();
            frame.writeUInt8(0); // slot
            frame.writeUInt8(0x0E); // EMBER MSG
            frame.writeUInt8(0x88); // Invalid msg type

            let count = 0;
            mocked.logger.error = () => { count++; };
            mocked.handleFrame(frame);
            expect(count).toBe(1);
        });

        it('should ignore frame with invalid slot', () => {
            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            const frame = new SmartBuffer();
            frame.writeUInt8(0); // slot
            frame.writeUInt8(0x5E); // EMBER MSG
            frame.writeUInt8(0x1);

            let count = 0;
            mocked.logger.error = () => { count++; };
            mocked.handleFrame(frame);
            expect(count).toBe(1);
        });

        it('should ignore frame with invalid slot', () => {
            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            const frame = new SmartBuffer();
            frame.writeUInt8(1); // slot
            frame.writeUInt8(0x0E); // EMBER MSG
            frame.writeUInt8(0x1);

            let count = 0;
            mocked.logger.error = () => { count++; };
            mocked.handleFrame(frame);
            expect(count).toBe(1);
        });

        it('should emit event on KeepAlive response', () => {
            const  codec = new S101Codec();
            const mocked: {[index: string]: any} = codec;
            const frame = new SmartBuffer();
            frame.writeUInt8(0); // slot
            frame.writeUInt8(0x0E); // EMBER MSG
            frame.writeUInt8(0x02); // kal response
            let count = 0;
            mocked.emit = (event: string) => {
                if (event === S101CodecEvent.KEEP_ALIVE_RESPONSE) {
                    count++;
                }
            };
            mocked.handleFrame(frame);
            expect(count).toBe(1);
        });

        it('should emit event on KeepAlive request', () => {
            const  codec = new S101Codec();
            const mocked: {[index: string]: any} = codec;
            const frame = new SmartBuffer();
            frame.writeUInt8(0); // slot
            frame.writeUInt8(0x0E); // EMBER MSG
            frame.writeUInt8(0x01); // kal response
            let count = 0;
            mocked.emit = (event: string) => {
                if (event === S101CodecEvent.KEEP_ALIVE_REQUEST) {
                    count++;
                }
            };
            mocked.handleFrame(frame);
            expect(count).toBe(1);
        });

        it('should log error on crc error', () => {
            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            const frame = new SmartBuffer();
            frame.writeUInt8(1); // slot
            frame.writeUInt8(0x0E); // EMBER MSG
            frame.writeUInt8(0x1);
            S101Codec.validateFrame = (b: Buffer): boolean => false;
            let count = 0;
            mocked.logger.error = () => { count++; };
            mocked.handleFrame(frame);
            expect(count).toBe(1);
        });
    });
    describe('handleEmberFrame', () => {
        it('should log warn if appBytes length higher than 2', () => {
            const frame = new SmartBuffer();
            frame.writeUInt8(0x01); // VERSIO
            frame.writeUInt8(0x20); // flags - empty packet
            frame.writeUInt8(0x01); // DTD
            frame.writeUInt8(1); // appbytes len
            frame.writeUInt8(0);

            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            let count = 0;
            mocked.logger.warn = () => { count++; };
            mocked.handleEmberFrame(frame);
            expect(count).toBe(1);
        });

        it('should log warn if appBytes length higher than 2', () => {
            const frame = new SmartBuffer();
            frame.writeUInt8(0x01); // VERSIO
            frame.writeUInt8(0x20); // flags - empty packet
            frame.writeUInt8(0x01); // DTD
            frame.writeUInt8(3); // appbytes len
            frame.writeUInt8(0);
            frame.writeUInt8(0);
            frame.writeUInt8(0);

            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            let count = 0;
            mocked.logger.warn = () => { count++; };
            mocked.handleEmberFrame(frame);
            expect(count).toBe(1);
        });

        it('should log warn if unknown version', () => {
            const frame = new SmartBuffer();
            frame.writeUInt8(0x11); // VERSIO
            frame.writeUInt8(0x20); // flags - empty packet
            frame.writeUInt8(0x01); // DTD
            frame.writeUInt8(2); // appbytes len
            frame.writeUInt8(0);
            frame.writeUInt8(0);

            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            let count = 0;
            mocked.logger.warn = () => { count++; };
            mocked.handleEmberFrame(frame);
            expect(count).toBe(1);
        });

        it('should log error and ignore frame with invalid dtd', () => {
            const frame = new SmartBuffer();
            frame.writeUInt8(0x01); // VERSIO
            frame.writeUInt8(0x20); // flags - empty packet
            frame.writeUInt8(0x11); // DTD
            frame.writeUInt8(3); // appbytes len
            frame.writeUInt8(0);
            frame.writeUInt8(0);
            frame.writeUInt8(0);

            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            let count = 0;
            mocked.logger.error = () => { count++; };
            mocked.handleEmberFrame(frame);
            expect(count).toBe(1);
        });
    });
    describe('processData', () => {
        it('should simply return if already processing data', () => {
            const  codec = new S101Codec(new LoggingService());
            const mocked: {[index: string]: any} = codec;
            mocked.processing = true;
            mocked.processData();
        });
    });
});
