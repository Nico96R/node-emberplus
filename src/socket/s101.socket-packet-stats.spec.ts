import { PacketStats } from './s101.packet-stats.socket';

describe('PacketStats', () => {
    it('should have a getNewPacketStats function', () => {
        const packetStats: PacketStats[] = [
            new PacketStats()
        ];
        packetStats[0].txBytes = 1000;
        packetStats[0].txPackets = 1;
        packetStats[0].rxBytes = 2000;
        packetStats[0].rxPackets = 3;
        const dup = packetStats[0].getNewPacketStats();
        expect(dup).toBeDefined();
        expect(dup.rxBytes).toBe(packetStats[0].rxBytes);
        expect(dup.rxPackets).toBe(packetStats[0].rxPackets);
        expect(dup.txBytes).toBe(packetStats[0].txBytes);
        expect(dup.txPackets).toBe(packetStats[0].txPackets);
    });

    it('should compute rate and return 0 if bytes/packets count decreased', () => {
        const packetStats: PacketStats[] = [
            new PacketStats()
        ];
        packetStats[0].txBytes = 1000;
        packetStats[0].txPackets = 1;
        packetStats[0].rxBytes = 2000;
        packetStats[0].rxPackets = 3;
        const dup = packetStats[0].getNewPacketStats();
        dup.txBytes = packetStats[0].txBytes - 1;
        dup.txPackets = packetStats[0].txPackets - 1;
        dup.rxBytes = packetStats[0].rxBytes - 1;
        dup.rxPackets = packetStats[0].rxPackets - 1;
        dup.computeRate(packetStats[0]);
        expect(dup).toBeDefined();
        expect(dup.rxByteSecond).toBe(0);
        expect(dup.rxPacketSecond).toBe(0);
        expect(dup.txByteSecond).toBe(0);
        expect(dup.txPacketSecond).toBe(0);
    });

    it('should compute rate and consider time to be 1 second if less than 1 sec but more than 1/2 sec', () => {
        const packetStats: PacketStats[] = [
            new PacketStats()
        ];
        const BYTE_RATE = 10000;
        const PACKET_RATE = 10;
        packetStats[0].txBytes = 1000;
        packetStats[0].txPackets = 1;
        packetStats[0].rxBytes = 2000;
        packetStats[0].rxPackets = 3;
        const dup = packetStats[0].getNewPacketStats();
        dup.txBytes = packetStats[0].txBytes + BYTE_RATE;
        dup.txPackets = packetStats[0].txPackets + PACKET_RATE;
        dup.rxBytes = packetStats[0].rxBytes + BYTE_RATE;
        dup.rxPackets = packetStats[0].rxPackets + PACKET_RATE;
        dup.timestamp = dup.timestamp + 600;
        dup.computeRate(packetStats[0]);
        expect(dup).toBeDefined();
        expect(dup.rxByteSecond).toBe(BYTE_RATE);
        expect(dup.rxPacketSecond).toBe(PACKET_RATE);
        expect(dup.txByteSecond).toBe(BYTE_RATE);
        expect(dup.txPacketSecond).toBe(PACKET_RATE);
    });

    it('should chave a toJSON()', () => {
        const packetStats: PacketStats[] = [
            new PacketStats()
        ];
        const BYTE_RATE = 10000;
        const PACKET_RATE = 10;
        packetStats[0].txBytes = BYTE_RATE;
        packetStats[0].txPackets = PACKET_RATE;
        packetStats[0].rxBytes = BYTE_RATE;
        packetStats[0].rxPackets = PACKET_RATE;
        const js = packetStats[0].toJSON();
        expect(js).toBeDefined();
        expect(js.txBytes).toBe(BYTE_RATE);
        expect(js.rxBytes).toBe(BYTE_RATE);
        expect(js.txPackets).toBe(PACKET_RATE);
        expect(js.rxPackets).toBe(PACKET_RATE);
    });
});
