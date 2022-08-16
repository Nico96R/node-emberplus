export interface PacketStatsInterface {
    txPackets: number;
    rxPackets: number;
    txFailures: number;
    txBytes: number;
    rxBytes: number;
    rxByteSecond: number;
    txByteSecond: number;
    txPacketSecond: number;
    rxPacketSecond: number;
    timestamp: number;
}

export class PacketStats implements PacketStatsInterface {
    public txPackets: number;
    public rxPackets: number;
    public txFailures: number;
    public txBytes: number;
    public rxBytes: number;
    public rxPacketSecond: number;
    public txPacketSecond: number;
    public rxByteSecond: number;
    public txByteSecond: number;
    public timestamp: number;

    constructor() {
        this.reset();
    }

    computeRate(stats: PacketStats): void {
        const msTime = this.timestamp - stats.timestamp;
        this.rxByteSecond = this.computeByteRate(stats.rxBytes, this.rxBytes, msTime);
        this.txByteSecond = this.computeByteRate(stats.txBytes, this.txBytes, msTime);
        this.rxPacketSecond = this.computePacketRate(stats.rxPackets, this.rxPackets, msTime);
        this.txPacketSecond = this.computePacketRate(stats.txPackets, this.txPackets, msTime);
    }

    getNewPacketStats(): PacketStats {
        const stats = new PacketStats();
        stats.txPackets = this.txPackets;
        stats.rxPackets = this.rxPackets;
        stats.txFailures = this.txFailures;
        stats.txBytes = this.txBytes;
        stats.rxBytes = this.rxBytes;
        stats.rxByteSecond = this.rxByteSecond;
        stats.txByteSecond = this.txByteSecond;
        stats.rxPacketSecond = this.rxPacketSecond;
        stats.txPacketSecond = this.txPacketSecond;
        stats.timestamp = this.timestamp;
        return stats;
    }

    reset(): void {
        this.txPackets = 0;
        this.rxPackets = 0;
        this.txFailures = 0;
        this.txBytes = 0;
        this.rxBytes = 0;
        this.rxByteSecond = 0;
        this.txByteSecond = 0;
        this.rxPacketSecond = 0;
        this.txPacketSecond = 0;
        this.timestamp = 0;
    }

    toJSON(): PacketStatsInterface {
        return {
            txPackets: this.txPackets,
            rxPackets: this.rxPackets,
            txFailures: this.txFailures,
            txBytes: this.txBytes,
            rxBytes: this.rxBytes,
            rxByteSecond: this.rxByteSecond,
            txByteSecond: this.txByteSecond,
            rxPacketSecond: this.rxPacketSecond,
            txPacketSecond: this.txPacketSecond,
            timestamp: this.timestamp
        };
    }

    private computeByteRate(startByte: number, endByte: number, msTime: number): number {
        if (endByte <= startByte || msTime <= 500) {
            // Error or did we wrap around ??? Let's return 0 for now
            return 0;
        }
        if (msTime < 1000) {
            return endByte - startByte;
        }
        return Math.round((endByte - startByte) / (msTime / 1000));
    }

    private computePacketRate(startPacket: number, endPacket: number, msTime: number): number {
        if (endPacket <= startPacket || msTime <= 500) {
            return 0;
        }
        if (msTime < 1000) {
            return endPacket - startPacket;
        }
        return Math.round((endPacket - startPacket) / (msTime / 1000));
    }
}
