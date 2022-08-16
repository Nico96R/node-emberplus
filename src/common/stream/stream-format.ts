export enum StreamFormat {
    unsignedInt8 = 0,
    unsignedInt16BigEndian = 2,
    unsignedInt16LittleEndian,
    unsignedInt32BigEndian,
    unsignedInt32LittleEndian,
    unsignedInt64BigEndian,
    unsignedInt64LittleENdian,
    signedInt8,
    signedInt16BigEndian,
    signedInt16LittleEndian,
    signedInt32BigEndian,
    signedInt32LittleEndian,
    signedInt64BigEndian,
    signedInt64LittleEndian,
    ieeeFloat32BigEndian,
    ieeeFloat32LittleEndian,
    ieeeFloat64BigEndian,
    ieeeFloat64LittleEndian
}

type StreamFormatStrings = keyof typeof StreamFormat;
export function streamFormatFromString(s: StreamFormatStrings): StreamFormat {
    return StreamFormat[s];
}
