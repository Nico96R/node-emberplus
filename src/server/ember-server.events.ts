export enum Types {
    UNKNOWN = 0,
    SETVALUE,
    GETDIRECTORY,
    SUBSCRIBE,
    UNSUBSCRIBE,
    INVOKE,
    MATRIX_CONNECTION
}

export class ServerEvents {

    get timestamp(): number {
        return this._timestamp;
    }
    private _timestamp: number;
    constructor(private txt: string, readonly type: Types= Types.UNKNOWN) {
        this._timestamp = Date.now();
    }

    static SETVALUE(identifier: string, path: string, src: string): ServerEvents {
        return new ServerEvents(`set value for ${identifier}(path: ${path}) from ${src}`, Types.SETVALUE);
    }

    static GETDIRECTORY(identifier: string, path: string, src: string): ServerEvents {
        return new ServerEvents(`getdirectory to ${identifier}(path: ${path}) from ${src}`, Types.GETDIRECTORY);
    }

    static SUBSCRIBE(identifier: string, path: string, src: string): ServerEvents {
        return new ServerEvents(`subscribe to ${identifier}(path: ${path}) from ${src}`, Types.SUBSCRIBE);
    }

    static UNSUBSCRIBE(identifier: string, path: string, src: string): ServerEvents {
        return new ServerEvents(`unsubscribe to ${identifier}(path: ${path}) from ${src}`, Types.UNSUBSCRIBE);
    }

    static INVOKE(identifier: string, path: string, src: string): ServerEvents {
        return new ServerEvents(`invoke to ${identifier}(path: ${path}) from ${src}`, Types.INVOKE);
    }

    static MATRIX_CONNECTION(identifier: string, path: string, src: string, target: number, sources: number[]): ServerEvents {
        const sourcesInfo = sources == null || sources.length === 0 ? 'empty' : sources.toString();
        return new ServerEvents(
            `Matrix connection to ${identifier}(path: ${path}) target ${target} connections: ${sourcesInfo} from ${src}`,
            Types.MATRIX_CONNECTION
        );
    }

    toString(): string {
        return this.txt;
    }
}
