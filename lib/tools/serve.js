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
const ember_server_1 = require("../server/ember-server");
const common_1 = require("../common/common");
const tree_node_1 = require("../common/tree-node");
const logging_service_1 = require("../logging/logging.service");
const utils_1 = require("../fixture/utils");
const path_1 = require("path");
const argv = yargs.options({
    host: {
        alias: 'h',
        description: 'host name|ip',
        default: '0.0.0.0'
    },
    port: {
        alias: 'p',
        default: 9000,
        type: 'number',
        description: 'port',
        demandOption: true
    },
    file: {
        alias: 'f',
        description: 'file containing the ber (default) or json tree'
    },
    json: {
        alias: 'j',
        type: 'boolean',
        description: 'file format is json'
    },
    multi: {
        alias: 'm',
        type: 'boolean',
        description: 'indicate to load multiple json files'
    },
    debug: {
        alias: 'd',
        type: 'boolean',
        description: 'debug'
    }
}).help().argv;
const listJSONFiles = () => {
    const res = [];
    const file = path_1.parse(argv.file);
    const r = new RegExp(`${file.base}[.](\\d+([.]\\d+)*)(.*)`);
    const list = fs_1.readdirSync(file.dir === '' ? './' : file.dir);
    for (const f of list) {
        const m = f.match(r);
        if (m) {
            res.push(m);
        }
    }
    return res.sort((a, b) => {
        const pathA = a[1].split('.');
        const pathB = b[1].split('.');
        if (pathA.length !== pathB.length) {
            return pathA.length - pathB.length;
        }
        for (let i = 0; i < pathA.length; i++) {
            if (pathA[i] !== pathB[i]) {
                return Number(pathA[i]) - Number(pathB[i]);
            }
        }
        return 0;
    });
};
const multiLoad = () => __awaiter(void 0, void 0, void 0, function* () {
    const tree = new tree_node_1.TreeNode();
    const list = listJSONFiles();
    for (const l of list) {
        console.log(`Loading ${l[0]}`);
        const data = fs_1.readFileSync(l[0]);
        const jsonNode = JSON.parse(data.toString());
        const root = ember_server_1.EmberServer.createTreeFromJSON([jsonNode]);
        const node = root.getChildren()[0];
        const path = l[1].split('.').map(x => Number(x));
        if (path.length === 1) {
            tree.addChild(node);
        }
        else {
            const parentPath = path.slice(0, path.length - 1);
            const parent = tree.getElementByPath(parentPath.join('.'));
            if (parent == null) {
                console.log(`Missing files ? Can't find parent of ${l[0]}`);
                continue;
            }
            parent.addChild(node);
        }
    }
    return tree;
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    let tree;
    if (argv.multi) {
        tree = yield multiLoad();
    }
    else {
        const data = argv.file ? fs_1.readFileSync(argv.file) : undefined;
        tree = argv.json ? ember_server_1.EmberServer.createTreeFromJSON(JSON.parse(data.toString())) :
            data ? common_1.decodeBuffer(data) : ember_server_1.EmberServer.createTreeFromJSON(utils_1.init());
    }
    const options = {
        host: argv.host,
        port: argv.port,
        tree: tree
    };
    if (argv.debug) {
        options.logger = new logging_service_1.LoggingService(5);
    }
    const server = new ember_server_1.EmberServer(options);
    server.on(ember_server_1.EmberServerEvent.CONNECTION, (info) => {
        console.log(Date.now(), `Connection from ${info}`);
    });
    server.on(ember_server_1.EmberServerEvent.DISCONNECT, (info) => {
        console.log(Date.now(), `Disconnect from ${info}`);
    });
    console.log(Date.now(), 'starting server');
    try {
        server.listen();
    }
    catch (e) {
        console.log(e);
    }
});
main();
//# sourceMappingURL=serve.js.map