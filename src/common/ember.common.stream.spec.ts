import * as BER from '../ber';
import { UnimplementedEmberTypeError } from '../error/errors';
import { TreeNode } from './tree-node';
import { StreamCollection } from './stream/stream-collection';
import { StreamEntry } from './stream/stream-entry';
import { StreamFormat, streamFormatFromString } from './stream/stream-format';
import { StreamDescription } from './stream/stream-description';
import { decodeBuffer } from './common';
import { testErrorReturned } from '../fixture/utils';

describe('Stream', () => {
    describe('StreamDescription', () => {
        it('should throw an error if unable to decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(StreamDescription.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.endSequence();
                    writer.endSequence();
                    StreamDescription.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });

        it('should have a toJSON', () => {
            const OFFSET = 4;
            const streamDescriptor = new StreamDescription(StreamFormat.signedInt8, OFFSET);

            let js = streamDescriptor.toJSON();
            expect(js).toBeDefined();
            expect(js.format).toBeDefined();
            expect(js.offset).toBe(OFFSET);

            streamDescriptor.format = null;
            js = streamDescriptor.toJSON();
            expect(js).toBeDefined();
            expect(js.format).toBe(null);
            expect(js.offset).toBe(OFFSET);
        });
    });

    describe('StreamFormat', () => {
        it('should have streamFormatFromString function', () => {
            expect(streamFormatFromString('ieeeFloat32BigEndian')).toBe(StreamFormat.ieeeFloat32BigEndian);
            expect(streamFormatFromString('ieeeFloat32LittleEndian')).toBe(StreamFormat.ieeeFloat32LittleEndian);
        });
    });

    describe('StreamCollection', () => {
        let streamCollection: StreamCollection;
        const ID1 = 123456;
        const ID2 = 76543;
        const VALUE1 = 'value1';
        const VALUE2 = 2;
        beforeEach(() => {
            streamCollection = new StreamCollection();
        });

        it('should have addEntry/getEntry/deleteEntry', () => {
            streamCollection.addEntry(new StreamEntry(ID1, VALUE1));
            streamCollection.addEntry(new StreamEntry(ID2, VALUE2));
            expect(streamCollection.getEntry(ID1)).toBeDefined();
            expect(streamCollection.getEntry(ID1).identifier).toBe(ID1);
            expect(streamCollection.getEntry(ID2).identifier).toBe(ID2);
            expect(streamCollection.getEntry(ID2).value).toBe(VALUE2);
            streamCollection.removeEntry(streamCollection.getEntry(ID1));
            expect(streamCollection.getEntry(ID1)).not.toBeDefined();
        });

        it('should have encoder/decoder', () => {
            streamCollection.addEntry(new StreamEntry(ID1, VALUE1));
            streamCollection.addEntry(new StreamEntry(ID2, VALUE2));
            let writer = new BER.ExtendedWriter();
            streamCollection.encode(writer);
            const decodedSC = StreamCollection.decode(new BER.ExtendedReader(writer.buffer));
            expect(decodedSC).toBeDefined();
            expect(decodedSC.getEntry(ID1)).toBeDefined();
            expect(decodedSC.getEntry(ID2)).toBeDefined();
            expect(decodedSC.getEntry(ID2).identifier).toBe(ID2);
            expect(decodedSC.getEntry(ID2).value).toBe(VALUE2);
            const root = new TreeNode();
            root.setStreams(streamCollection);
            writer = new BER.ExtendedWriter();
            root.encode(writer);
            const decodedRoot: TreeNode = decodeBuffer(writer.buffer) as TreeNode;
            expect(decodedRoot).toBeDefined();
            expect(decodedRoot.getStreams()).toBeDefined();
        });

        it('should throw an error if can\'t decode', () => {
            testErrorReturned(
                () => {
                    const writer = new BER.ExtendedWriter();
                    writer.startSequence(StreamEntry.BERID);
                    writer.startSequence(BER.CONTEXT(99));
                    writer.writeInt(1);
                    writer.endSequence();
                    writer.endSequence();
                    StreamEntry.decode(new BER.ExtendedReader(writer.buffer));
            }, UnimplementedEmberTypeError);
        });
    });
});
