"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const fs_1 = require("fs");
const common_1 = require("../common/common");
const argv = yargs.options({
    file: {
        alias: 'f',
        description: 'file containing the ber tree',
        demandOption: true
    }
}).help().argv;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const berData = fs_1.readFileSync(argv.file);
    const tree = common_1.decodeBuffer(berData);
    const log = (...args) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(...args);
    });
    try {
        common_1.nodeLogger(tree, { log });
    }
    catch (e) {
        console.log(e);
    }
    console.log('done.');
});
main();
//# sourceMappingURL=jsontree.js.map