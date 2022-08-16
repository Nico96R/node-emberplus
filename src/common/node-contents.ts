import {ExtendedReader as Reader, CONTEXT, EMBER_SET, EMBER_STRING, EMBER_RELATIVE_OID } from '../ber';
import { Writer } from 'gdnet-asn1';
import { UnimplementedEmberTypeError } from '../error/errors';

export interface JNodeContents {
    identifier?: string;
    description?: string;
    isRoot?: boolean;
    isOnline?: boolean;
    schemaIdentifiers?: string;
    templateReference?: string;
}

export class NodeContents {
    public isOnline: boolean;
    public isRoot: boolean;
    public schemaIdentifiers: string;
    public templateReference: string;

    constructor(public identifier?: string, public description?: string) {
        this.isOnline = true;
    }

    static decode(ber: Reader): NodeContents {
        const nc = new NodeContents();
        ber = ber.getSequence(EMBER_SET);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === CONTEXT(0)) {
                nc.identifier = seq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(1)) {
                nc.description = seq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(2)) {
                nc.isRoot = seq.readBoolean();
            } else if (tag === CONTEXT(3)) {
                nc.isOnline = seq.readBoolean();
            } else if (tag === CONTEXT(4)) {
                nc.schemaIdentifiers = seq.readString(EMBER_STRING);
            } else if (tag === CONTEXT(5)) {
                nc.templateReference = seq.readRelativeOID(EMBER_RELATIVE_OID);
            } else {
                throw new UnimplementedEmberTypeError(tag);
            }
        }

        return nc;
    }

    encode(ber: Writer): void {
        ber.startSequence(EMBER_SET);

        if (this.identifier != null) {
            ber.startSequence(CONTEXT(0));
            ber.writeString(this.identifier, EMBER_STRING);
            ber.endSequence(); // CONTEXT(0)
        }

        if (this.description != null) {
            ber.startSequence(CONTEXT(1));
            ber.writeString(this.description, EMBER_STRING);
            ber.endSequence(); // CONTEXT(1)
        }

        if (this.isRoot != null) {
            ber.startSequence(CONTEXT(2));
            ber.writeBoolean(this.isRoot);
            ber.endSequence(); // CONTEXT(2)
        }

        if (this.isOnline != null) {
            ber.startSequence(CONTEXT(3));
            ber.writeBoolean(this.isOnline);
            ber.endSequence(); // CONTEXT(3)
        }

        if (this.schemaIdentifiers != null) {
            ber.startSequence(CONTEXT(4));
            ber.writeString(this.schemaIdentifiers, EMBER_STRING);
            ber.endSequence(); // CONTEXT(4)
        }

        if (this.templateReference != null) {
            ber.startSequence(CONTEXT(5));
            ber.writeRelativeOID(this.templateReference, EMBER_RELATIVE_OID);
            ber.endSequence();
        }

        ber.endSequence(); // EMBER_SET
    }

    toJSON(res?: {[index: string]:  any}): JNodeContents {
        const response = res || {};
        response.identifier = this.identifier,
        response.description = this.description,
        response.isRoot = this.isRoot,
        response.isOnline = this.isOnline,
        response.schemaIdentifiers = this.schemaIdentifiers,
        response.templateReference = this.templateReference;
        return response;
    }
}
