#!/usr/bin/env node

import yargs = require('yargs');
import { writeFile, createWriteStream } from 'fs';
import { TreeNode } from '../common/tree-node';
import { ErrorMultipleError } from '../error/errors';
import { EmberClient, EmberClientOptions } from '../client/ember-client';
import { jsonNodeLogger, jsonTreeLogger, jsonFullNodeLogger} from '../common/common';
import { LogLevel, LoggingService } from '../logging/logging.service';
import { EmberClientEvent } from '../client/ember-client.events';

const wait = (timesecond: number): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {resolve(); }, timesecond * 1000);
    });
};

interface Arguments {
    host: string;
    port: number;
    file: string;
    json: string;
    path: string;
    loglevel: number;
    split: number;
    stats: boolean;
}

const argv: Arguments = yargs.options({
    loglevel: {
        alias: 'l',
        type: 'number',
        description: 'enable log level',
        min: LogLevel.critical,
        max: LogLevel.debug
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
}).help().argv as Arguments;

const logEvent = (node: TreeNode) => {
    console.log('New Update', node);
};

const nodeSaveJSON = async (node: TreeNode, full: boolean) => {
    const file = `${argv.json}.${node.getPath()}.json`;
    console.log(`saving json node into ${file}`);
    const wstream = createWriteStream(file);
    let stopOnError = false;
    wstream.on('error', (e: Error) => {
        console.log(e);
        stopOnError = true;
    });
    const log = async (x: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (stopOnError) {
                return reject(new Error('Failed to writer'));
            }
            if (wstream.write(x)) {
                return resolve();
            } else {
                wstream.once('drain', () => {
                    resolve();
                });
            }
        });
    };
    if (full) {
        await jsonFullNodeLogger(node, {log});
    } else {
        await jsonNodeLogger(node, {log});
    }
    wstream.end();
    console.log('json node saved');
};

const splitSaveJSON = async (node: TreeNode) => {
    const splitLevel = argv.split;
    const path = node.getPath();
    const level = node.isRoot() ? 0 : path.split('.').length;
    console.log(`Level: ${level}/${splitLevel} at ${path}`);
    if (level >= splitLevel) {
        return nodeSaveJSON(node, true);
    } else {
        if (node.getNumber() != null) {
            await nodeSaveJSON(node, false);
        }
        const children = node.getChildren();
        if (children == null) {
            return;
        }
        for (const child of children) {
            await splitSaveJSON(child as TreeNode);
        }
    }
};

const saveJSON = async (root: TreeNode) => {
    console.log(`saving json tree into ${argv.json}`);
    const wstream = createWriteStream(argv.json);
    let stopOnError = false;
    wstream.on('error', (e: Error) => {
        console.log(e);
        stopOnError = true;
    });
    const log = async (x: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (stopOnError) {
                return reject(new Error('Failed to writer'));
            }
            if (wstream.write(x)) {
                return resolve();
            } else {
                wstream.once('drain', () => {
                    resolve();
                });
            }
        });
    };
    await jsonTreeLogger(root, {log});
    wstream.end();
    console.log('json tree saved');
};

const main = async () => {
    const options: EmberClientOptions = {host: argv.host, port: argv.port};
    if (argv.loglevel) {
        options.logger = new LoggingService(argv.loglevel);
    }
    const client = new EmberClient(options);
    client.on(EmberClientEvent.ERROR, (error: Error) => {
        console.log('Got new Error', error);
    });
    client.on(EmberClientEvent.DISCONNECTED, () => { console.log('disconnected.', process.exit(0)); });
    client.on(EmberClientEvent.CONNECTED, () => { console.log(`connected to ${argv.host}:${argv.port}`); });
    await client.connectAsync();
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
            const node = await client.getElementByPathAsync(`${argv.path}`, logEvent);
            await client.expandAsync(node, logEvent);
        } else {
            await client.expandAsync();
        }
        running = false;
        console.log(Date.now(), 'Full tree received');
        // save the tree
        if (argv.file != null) {
            console.log(`saving tree into ${argv.file}`);
            client.saveTree((buffer: Buffer) => {
                writeFile(argv.file, buffer, (error: Error) => {
                    if (error) {
                        console.log('Failed to save tree', error);
                    } else {
                        console.log('file saved');
                    }
                });
            });
        }
        if (argv.json != null) {
            if (argv.split == null || argv.split < 1) {
                await saveJSON(client.root);
            } else {
                await splitSaveJSON(client.root);
            }
        }
    } catch (e) {
        console.log(e);
        if (e instanceof ErrorMultipleError) {
            console.log(e.errors);
        }
    }
};

main();
