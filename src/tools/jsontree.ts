const yargs = require('yargs/yargs');
import { readFileSync } from 'fs';
import {decodeBuffer, nodeLogger} from '../common/common';
import { TreeNode } from '../common/tree-node';

const argv: {
    [x: string]: unknown;
    f: string;
    file?: string;
    _: string[];
    $0: string;
} = yargs(process.argv)
    .alias('f', 'file')
    .describe('f', 'file containing the ber tree')
    .demandOption('f')
    .string('f')
    .argv;

const main = async () => {
    const berData = readFileSync(argv.file);
    const tree: TreeNode = decodeBuffer(berData) as TreeNode;
    const log = async (...args: any[]): Promise<void> => {
        console.log(...args);
    };
    try {
        nodeLogger(tree, {log});
    } catch (e) {
        console.log(e);
    }
    console.log('done.');
};

main();
