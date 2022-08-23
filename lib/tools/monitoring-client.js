#!/usr/bin/env node
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
const errors_1 = require("../error/errors");
const ember_client_1 = require("../client/ember-client");
const common_1 = require("../common/common");
const logging_service_1 = require("../logging/logging.service");
const ember_client_events_1 = require("../client/ember-client.events");
const wait = (timesecond) => {
    return new Promise(resolve => {
        setTimeout(() => { resolve(); }, timesecond * 1000);
    });
};
const argv = yargs.options({
    loglevel: {
        alias: 'l',
        type: 'number',
        description: 'enable log level',
        min: 1,
        max: 5
    },
    host: {
        alias: 'h',
        description: 'host name|ip',
        demandOption: true
    },
    path: {
        description: 'path to monitor'
    },
    port: {
        alias: 'p',
        default: 9000,
        description: 'port'
    },
    file: {
        alias: 'f',
        description: 'file name to save discovered tree'
    },
    json: {
        alias: 'j',
        description: 'file name to save json tree'
    },
    split: {
        type: 'number',
        description: 'split into multiple files'
    },
    stats: {
        alias: 's',
        type: 'boolean',
        description: 'display stats'
    }
}).help().argv;
const logEvent = (node) => {
    console.log('New Update', node);
};
const nodeSaveJSON = (node, full) => __awaiter(void 0, void 0, void 0, function* () {
    const file = `${argv.json}.${node.getPath()}.json`;
    console.log(`saving json node into ${file}`);
    const wstream = fs_1.createWriteStream(file);
    let stopOnError = false;
    wstream.on('error', (e) => {
        console.log(e);
        stopOnError = true;
    });
    const log = (x) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (stopOnError) {
                return reject(new Error('Failed to writer'));
            }
            if (wstream.write(x)) {
                return resolve();
            }
            else {
                wstream.once('drain', () => {
                    resolve();
                });
            }
        });
    });
    if (full) {
        yield common_1.jsonFullNodeLogger(node, { log });
    }
    else {
        yield common_1.jsonNodeLogger(node, { log });
    }
    wstream.end();
    console.log('json node saved');
});
const splitSaveJSON = (node) => __awaiter(void 0, void 0, void 0, function* () {
    const splitLevel = argv.split;
    const path = node.getPath();
    const level = node.isRoot() ? 0 : path.split('.').length;
    console.log(`Level: ${level}/${splitLevel} at ${path}`);
    if (level >= splitLevel) {
        return nodeSaveJSON(node, true);
    }
    else {
        if (node.getNumber() != null) {
            yield nodeSaveJSON(node, false);
        }
        const children = node.getChildren();
        if (children == null) {
            return;
        }
        for (const child of children) {
            yield splitSaveJSON(child);
        }
    }
});
const saveJSON = (root) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`saving json tree into ${argv.json}`);
    const wstream = fs_1.createWriteStream(argv.json);
    let stopOnError = false;
    wstream.on('error', (e) => {
        console.log(e);
        stopOnError = true;
    });
    const log = (x) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (stopOnError) {
                return reject(new Error('Failed to writer'));
            }
            if (wstream.write(x)) {
                return resolve();
            }
            else {
                wstream.once('drain', () => {
                    resolve();
                });
            }
        });
    });
    yield common_1.jsonTreeLogger(root, { log });
    wstream.end();
    console.log('json tree saved');
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const options = { host: argv.host, port: argv.port };
    if (argv.loglevel) {
        options.logger = new logging_service_1.LoggingService(argv.loglevel);
    }
    const client = new ember_client_1.EmberClient(options);
    client.on(ember_client_events_1.EmberClientEvent.ERROR, (error) => {
        console.log('Got new Error', error);
    });
    client.on(ember_client_events_1.EmberClientEvent.DISCONNECTED, () => { console.log('disconnected.', process.exit(0)); });
    client.on(ember_client_events_1.EmberClientEvent.CONNECTED, () => { console.log(`connected to ${argv.host}:${argv.port}`); });
    yield client.connectAsync();
    console.log(Date.now(), 'retrieving complete tree');
    let running = true;
    const logStats = () => {
        if (running) {
            console.log('\x1bc');
            console.log(client.getStats());
            setTimeout(logStats, 1000);
        }
    };
    try {
        if (argv.stats) {
            logStats();
        }
        if (argv.path) {
            console.log(`Request for path : ${argv.path}`);
            const node = yield client.getElementByPathAsync(`${argv.path}`, logEvent);
            yield client.expandAsync(node, logEvent);
        }
        else {
            yield client.expandAsync();
        }
        running = false;
        console.log(Date.now(), 'Full tree received');
        if (argv.file != null) {
            console.log(`saving tree into ${argv.file}`);
            client.saveTree((buffer) => {
                fs_1.writeFile(argv.file, buffer, (error) => {
                    if (error) {
                        console.log('Failed to save tree', error);
                    }
                    else {
                        console.log('file saved');
                    }
                });
            });
        }
        if (argv.json != null) {
            if (argv.split == null || argv.split < 1) {
                yield saveJSON(client.root);
            }
            else {
                yield splitSaveJSON(client.root);
            }
        }
    }
    catch (e) {
        console.log(e);
        if (e instanceof errors_1.ErrorMultipleError) {
            console.log(e.errors);
        }
    }
});
main();
//# sourceMappingURL=monitoring-client.js.map