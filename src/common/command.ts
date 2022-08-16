import { COMMAND_GETDIRECTORY, COMMAND_INVOKE } from './constants';
import { ExtendedReader as Reader, ExtendedWriter as Writer, CONTEXT, APPLICATION } from '../ber';
import { Invocation, IInvocation, JInvocation } from './invocation';
import { UnimplementedEmberTypeError } from '../error/errors';
import { ElementBase } from './element.base';

export enum FieldFlags {
    sparse = -2,
    all,
    default,
    identifier,
    description,
    tree,
    value,
    connections
}

export interface ICommand {
    number: number;
    fieldFlags: FieldFlags;
    invocation: IInvocation | null;
}

export interface JCommand {
    number: number;
    fieldFlags: FieldFlags;
    invocation: JInvocation | null;
}

export class Command extends ElementBase {

    public fieldFlags: FieldFlags;
    public invocation: Invocation;

    constructor(public number?: number) {
        super();
        this.fieldFlags = FieldFlags.default;

        if (number === COMMAND_GETDIRECTORY) {
            this.fieldFlags = FieldFlags.all;
        }
    }

    static decode(ber: Reader): Command {
        const c = new Command();
        ber = ber.getSequence(Command.BERID);

        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                c.number = seq.readInt();
            } else if (tag === CONTEXT(1)) {
                c.fieldFlags = seq.readInt();
            } else if (tag === CONTEXT(2)) {
                c.invocation = Invocation.decode(seq);
            } else {
                // TODO: options
                throw new UnimplementedEmberTypeError(tag);
            }
        }

        return c;
    }

    static getCommand(cmd: number, key: string, value: any): Command {
        const command = new Command(cmd);
        if (key != null && key === 'invocation') {
            command[key] = value;
        }
        return command;
    }

    static getInvocationCommand(invocation: Invocation): Command {
        return this.getCommand(COMMAND_INVOKE, 'invocation', invocation);
    }

    isCommand(): boolean {
        return true;
    }

    encode(ber: Writer): void {
        ber.startSequence(Command.BERID);

        ber.startSequence(CONTEXT(0));
        ber.writeInt(this.number);
        ber.endSequence(); // CONTEXT(0)

        if (this.number === COMMAND_GETDIRECTORY && this.fieldFlags) {
            ber.startSequence(CONTEXT(1));
            ber.writeInt(this.fieldFlags);
            ber.endSequence();
        }

        if (this.number === COMMAND_INVOKE && this.invocation) {
            ber.startSequence(CONTEXT(2));
            this.invocation.encode(ber);
            ber.endSequence();
        }
        // TODO: options

        ber.endSequence(); // BER.APPLICATION(2)
    }

    getNumber(): number {
        return this.number;
    }

    toJSON(): JCommand {
        return {
            number: this.number,
            fieldFlags: this.fieldFlags,
            invocation: this.invocation?.toJSON()
        };
    }

    static get BERID(): number {
        return APPLICATION(2);
    }
}
