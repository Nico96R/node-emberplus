"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StatsCollector {
    constructor() {
        this.stats = [];
    }
    add(stats) {
        stats.timestamp = Date.now();
        if (this.stats.length > StatsCollector.intervals[StatsCollector.intervals.length - 1].interval) {
            this.stats.shift();
        }
        this.stats.push(stats);
    }
    getStats() {
        const response = {
            txPackets: 0,
            rxPackets: 0,
            txFailures: 0,
            txBytes: 0,
            rxBytes: 0,
            timestamp: 0
        };
        if (this.stats.length > 0) {
            const lastIndex = this.stats.length - 1;
            const last = this.stats[lastIndex];
            response.txPackets = last.txPackets;
            response.rxPackets = last.rxPackets;
            response.rxBytes = last.rxBytes;
            response.txBytes = last.txBytes;
            response.txFailures = last.txFailures;
            response.timestamp = last.timestamp;
            for (let i = StatsCollector.intervals.length - 1; i >= 0; i--) {
                if (this.stats.length > StatsCollector.intervals[i].interval) {
                    this.stats[lastIndex].computeRate(this.stats[lastIndex - StatsCollector.intervals[i].interval]);
                    response[StatsCollector.intervals[i].name] = {
                        rxByteSecond: this.stats[lastIndex].rxByteSecond,
                        txByteSecond: this.stats[lastIndex].txByteSecond,
                        rxPacketSecond: this.stats[lastIndex].rxPacketSecond,
                        txPacketSecond: this.stats[lastIndex].txPacketSecond
                    };
                }
                else {
                    response[StatsCollector.intervals[i].name] = {
                        rxByteSecond: 0,
                        txByteSecond: 0,
                        rxPacketSecond: 0,
                        txPacketSecond: 0
                    };
                }
            }
        }
        return response;
    }
    static get intervals() {
        return [
            { name: 'rateOneSecond', interval: 1 },
            { name: 'rateOneMinute', interval: 60 },
            { name: 'rateFiveMinute', interval: 299 }
        ];
    }
}
exports.StatsCollector = StatsCollector;
//# sourceMappingURL=stats-collector.js.map