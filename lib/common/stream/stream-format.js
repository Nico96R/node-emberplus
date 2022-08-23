"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StreamFormat;
(function (StreamFormat) {
    StreamFormat[StreamFormat["unsignedInt8"] = 0] = "unsignedInt8";
    StreamFormat[StreamFormat["unsignedInt16BigEndian"] = 2] = "unsignedInt16BigEndian";
    StreamFormat[StreamFormat["unsignedInt16LittleEndian"] = 3] = "unsignedInt16LittleEndian";
    StreamFormat[StreamFormat["unsignedInt32BigEndian"] = 4] = "unsignedInt32BigEndian";
    StreamFormat[StreamFormat["unsignedInt32LittleEndian"] = 5] = "unsignedInt32LittleEndian";
    StreamFormat[StreamFormat["unsignedInt64BigEndian"] = 6] = "unsignedInt64BigEndian";
    StreamFormat[StreamFormat["unsignedInt64LittleENdian"] = 7] = "unsignedInt64LittleENdian";
    StreamFormat[StreamFormat["signedInt8"] = 8] = "signedInt8";
    StreamFormat[StreamFormat["signedInt16BigEndian"] = 9] = "signedInt16BigEndian";
    StreamFormat[StreamFormat["signedInt16LittleEndian"] = 10] = "signedInt16LittleEndian";
    StreamFormat[StreamFormat["signedInt32BigEndian"] = 11] = "signedInt32BigEndian";
    StreamFormat[StreamFormat["signedInt32LittleEndian"] = 12] = "signedInt32LittleEndian";
    StreamFormat[StreamFormat["signedInt64BigEndian"] = 13] = "signedInt64BigEndian";
    StreamFormat[StreamFormat["signedInt64LittleEndian"] = 14] = "signedInt64LittleEndian";
    StreamFormat[StreamFormat["ieeeFloat32BigEndian"] = 15] = "ieeeFloat32BigEndian";
    StreamFormat[StreamFormat["ieeeFloat32LittleEndian"] = 16] = "ieeeFloat32LittleEndian";
    StreamFormat[StreamFormat["ieeeFloat64BigEndian"] = 17] = "ieeeFloat64BigEndian";
    StreamFormat[StreamFormat["ieeeFloat64LittleEndian"] = 18] = "ieeeFloat64LittleEndian";
})(StreamFormat = exports.StreamFormat || (exports.StreamFormat = {}));
function streamFormatFromString(s) {
    return StreamFormat[s];
}
exports.streamFormatFromString = streamFormatFromString;
//# sourceMappingURL=stream-format.js.map