"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const ber_1 = require("../ber");
const invocation_1 = require("./invocation");
const errors_1 = require("../error/errors");
const element_base_1 = require("./element.base");
var FieldFlags;
(function (FieldFlags) {
    FieldFlags[FieldFlags["sparse"] = -2] = "sparse";
    FieldFlags[FieldFlags["all"] = -1] = "all";
    FieldFlags[FieldFlags["default"] = 0] = "default";
    FieldFlags[FieldFlags["identifier"] = 1] = "identifier";
    FieldFlags[FieldFlags["description"] = 2] = "description";
    FieldFlags[FieldFlags["tree"] = 3] = "tree";
    FieldFlags[FieldFlags["value"] = 4] = "value";
    FieldFlags[FieldFlags["connections"] = 5] = "connections";
})(FieldFlags = exports.FieldFlags || (exports.FieldFlags = {}));
class Command extends element_base_1.ElementBase {
    constructor(number) {
        super();
        this.number = number;
        this.fieldFlags = FieldFlags.default;
        if (number === constants_1.COMMAND_GETDIRECTORY) {
            this.fieldFlags = FieldFlags.all;
        }
    }
    static decode(ber) {
        const c = new Command();
        ber = ber.getSequence(Command.BERID);
        while (ber.remain > 0) {
            const tag = ber.peek();
            const seq = ber.getSequence(tag);
            if (tag === ber_1.CONTEXT(0)) {
                c.number = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(1)) {
                c.fieldFlags = seq.readInt();
            }
            else if (tag === ber_1.CONTEXT(2)) {
                c.invocation = invocation_1.Invocation.decode(seq);
            }
            else {
                throw new errors_1.UnimplementedEmberTypeError(tag);
            }
        }
        return c;
    }
    static getCommand(cmd, key, value) {
        const command = new Command(cmd);
        if (key != null && key === 'invocation') {
            command[key] = value;
        }
        return command;
    }
    static getInvocationCommand(invocation) {
        return this.getCommand(constants_1.COMMAND_INVOKE, 'invocation', invocation);
    }
    isCommand() {
        return true;
    }
    encode(ber) {
        ber.startSequence(Command.BERID);
        ber.startSequence(ber_1.CONTEXT(0));
        ber.writeInt(this.number);
        ber.endSequence();
        if (this.number === constants_1.COMMAND_GETDIRECTORY && this.fieldFlags) {
            ber.startSequence(ber_1.CONTEXT(1));
            ber.writeInt(this.fieldFlags);
            ber.endSequence();
        }
        if (this.number === constants_1.COMMAND_INVOKE && this.invocation) {
            ber.startSequence(ber_1.CONTEXT(2));
            this.invocation.encode(ber);
            ber.endSequence();
        }
        ber.endSequence();
    }
    getNumber() {
        return this.number;
    }
    toJSON() {
        var _a;
        return {
            number: this.number,
            fieldFlags: this.fieldFlags,
            invocation: (_a = this.invocation) === null || _a === void 0 ? void 0 : _a.toJSON()
        };
    }
    static get BERID() {
        return ber_1.APPLICATION(2);
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map