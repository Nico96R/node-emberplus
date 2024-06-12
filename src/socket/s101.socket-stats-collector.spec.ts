import { PacketStats } from './s101.packet-stats.socket';
import { StatsCollector } from './stats-collector';

describe('StatsCollector', () => {
    let statsCollector: StatsCollector;
    beforeEach(() => {
        statsCollector = new StatsCollector();
    });

    it('should have add function to collect stats', () => {
        statsCollector.add(new PacketStats());
    });

    it('should have getStats function with minimum set of values', () => {
        statsCollector.add(new PacketStats());
        const stats = statsCollector.getStats();
        expect(stats).toBeDefined();
        expect(stats.txPackets).toBe(0);
        expect(stats.rxPackets).toBe(0);
        expect(stats.txFailures).toBe(0);
        expect(stats.txBytes).toBe(0);
        expect(stats.rxBytes).toBe(0);
        expect(stats.timestamp).toBeDefined();
    });

    it('should have getStats function with minimum set of values even if no stats added yet', () => {
        const stats = statsCollector.getStats();
        expect(stats).toBeDefined();
        expect(stats.txPackets).toBe(0);
        expect(stats.rxPackets).toBe(0);
        expect(stats.txFailures).toBe(0);
        expect(stats.txBytes).toBe(0);
        expect(stats.rxBytes).toBe(0);
        expect(stats.timestamp).toBeDefined();
    });

    it('should be able to compute rate with 2 samples of stats', () => {
        const stat1 = new PacketStats();
        const stat2 = new PacketStats();
        const BYTE_RATE = 10000;
        const PACKET_RATE = 10;
        statsCollector.add(stat1);
        statsCollector.add(stat2);
        stat2.timestamp = stat1.timestamp + 1000; // set 1 second
        stat1.txBytes = 1000;
        stat2.txBytes = stat1.txBytes + BYTE_RATE;
        stat1.txPackets = 1;
        stat2.txPackets = stat1.txPackets + PACKET_RATE;
        stat1.rxBytes = 2000;
        stat2.rxBytes = stat1.rxBytes + 2 * BYTE_RATE;
        stat1.rxPackets = 3;
        stat2.rxPackets = stat1.rxPackets + 2 * PACKET_RATE;
        const stats = statsCollector.getStats();
        const rateOneSecond = (stats.rateOneSecond as { rxByteSecond: number, txByteSecond: number, rxPacketSecond: number, txPacketSecond: number });
        expect(rateOneSecond.txByteSecond).toBe(BYTE_RATE);
        expect(rateOneSecond.rxByteSecond).toBe(2 * BYTE_RATE);
        expect(rateOneSecond.txPacketSecond).toBe(PACKET_RATE);
        expect(rateOneSecond.rxPacketSecond).toBe(2 * PACKET_RATE);
    });

    it('should be able to compute rate with x samples of stats', () => {
        const BYTE_RATE = 10000;
        const PACKET_RATE = 10;
        const STAT_INC = 5; // Try to add more stats to test shifting
        const packetStats: PacketStats[] = [
            new PacketStats()
        ];
        packetStats[0].txBytes = 1000;
        packetStats[0].txPackets = 1;
        packetStats[0].rxBytes = 2000;
        packetStats[0].rxPackets = 3;
        statsCollector.add(packetStats[0]);
        for (let i = 1; i <= StatsCollector.intervals[StatsCollector.intervals.length - 1].interval + STAT_INC; i++) {
            const packetStat = new PacketStats();
            packetStats.push(packetStat);
            statsCollector.add(packetStat);
            packetStat.timestamp = packetStats[i - 1].timestamp + 1000; // set 1 second
            packetStat.txBytes = packetStats[i - 1].txBytes + BYTE_RATE;
            packetStat.txPackets = packetStats[i - 1].txPackets + PACKET_RATE;
            packetStat.rxBytes = packetStats[i - 1].rxBytes + 2 * BYTE_RATE;
            packetStat.rxPackets = packetStats[i - 1].rxPackets + 2 * PACKET_RATE;
        }
        const stats = statsCollector.getStats();
        for (let i = 0; i < StatsCollector.intervals.length; i++) {
            const rate = (stats[StatsCollector.intervals[i].name] as
                { rxByteSecond: number, txByteSecond: number, rxPacketSecond: number, txPacketSecond: number });
            expect(rate.txByteSecond).toBe(BYTE_RATE);
            expect(rate.rxByteSecond).toBe(2 * BYTE_RATE);
            expect(rate.txPacketSecond).toBe(PACKET_RATE);
            expect(rate.rxPacketSecond).toBe(2 * PACKET_RATE);
        }
    });
});
