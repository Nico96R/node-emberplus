const yargs = require('yargs/yargs');
import { readFileSync, readdirSync } from 'fs';
import {EmberServer, EmberServerOptions, EmberServerEvent} from '../server/ember-server';
import {decodeBuffer} from '../common/common';
import { TreeNode } from '../common/tree-node';
import { LoggingService, LogLevel } from '../logging/logging.service';
import { init } from '../fixture/utils';
import {parse} from 'path';

interface Arguments {
    host: string;
    port: number;
    file: string;
    json: boolean;
    multi: boolean;
    debug: boolean;
}

const argv: {
    [x: string]: unknown;
    p: number;
    h: string;
    path?: string;
    host?: string;
    file?: string;
    json?: boolean;
    port?: number;
    multi?: boolean;
    debug?: boolean;
    _: string[];
    $0: string;
} = yargs(process.argv)
    .usage('Usage: $0 [options]')
    .alias('h', 'host')
    .default('h', '127.0.0.1')
    .describe('h', 'host name|ip')
    .alias('p', 'port')
    .describe('p', 'port - default 9000')
    .default('p', 9000)
    .alias('f', 'file')
    .describe('f', 'filename to save ember tree')
    .alias('j', 'json')
    .describe('j', 'filename to save json tree')
    .alias('d', 'debug')
    .describe('d', 'debug')
    .demandOption(['h'])
    .alias('m', 'multi')
    .describe('path', 'path')
    .describe('m', 'indicate to load multiple json files')
    .string(['h', 'f', 'path'])
    .boolean(['d', 'm', 'j'])
    .argv;

const listJSONFiles = (): RegExpMatchArray[] => {
    const res: RegExpMatchArray[] = [];
    const file = parse(argv.file);
    const r = new RegExp(`${file.base}[.](\\d+([.]\\d+)*)(.*)`);
    const list = readdirSync(file.dir === '' ? './' : file.dir);
    for (const f of list) {
        const m = f.match(r);
        if (m) {
            res.push(m);
        }
    }
    return res.sort((a: RegExpMatchArray, b: RegExpMatchArray): number => {
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

const multiLoad = async (): Promise<TreeNode> => {
    const tree = new TreeNode();
    const list = listJSONFiles();
    for (const l of list) {
        console.log(`Loading ${l[0]}`);
        const data = readFileSync(l[0]);
        const jsonNode = JSON.parse(data.toString());
        const root = EmberServer.createTreeFromJSON([jsonNode]);
        const node = root.getChildren()[0];
        const path = l[1].split('.').map(x => Number(x));
        if (path.length === 1) {
            tree.addChild(node as TreeNode);
        } else {
            const parentPath = path.slice(0, path.length - 1);
            const parent = tree.getElementByPath(parentPath.join('.'));
            if (parent == null) {
                console.log(`Missing files ? Can't find parent of ${l[0]}`);
                continue;
            }
            parent.addChild(node as TreeNode);
        }
    }
    return tree;
};

const main = async () => {
    const options: EmberServerOptions = {
        host: argv.host,
        port: argv.port,
        tree: new TreeNode()
    };
    if (argv.debug) {
        options.logger = new LoggingService(LogLevel.debug);
    }
    if (argv.multi) {
        options.tree = await multiLoad();
    } else if (argv.file) {
        console.log('Converting tree from file', argv.file);
        const data = readFileSync(argv.file);
        options.tree = argv.json ? EmberServer.createTreeFromJSON(JSON.parse(data.toString()), options.logger) :
            decodeBuffer(data) as TreeNode;
    } else {
        console.log('Load default tree');
        options.tree = EmberServer.createTreeFromJSON(init(), options.logger);
    }

    const server = new EmberServer(options);
    server.on(EmberServerEvent.CONNECTION, (info: string) => {
        console.log(Date.now(), `Connection from ${info}`);
    });
    server.on(EmberServerEvent.DISCONNECT, (info: string) => {
        console.log(Date.now(), `Disconnect from ${info}`);
    });
    console.log(Date.now(), 'starting server');
    try {
        server.listen();
    } catch (e) {
        console.log(e);
    }
};

main();
