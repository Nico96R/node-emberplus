import yargs = require('yargs');
import { readFileSync } from 'fs';
import {decodeBuffer, nodeLogger} from '../common/common';
import { TreeNode } from '../common/tree-node';

interface Arguments {
    file: string;
}

const argv: Arguments = yargs.options({
    file: {
        alias: 'f',
        description: 'file containing the ber tree',
        demandOption: true
    }
}).help().argv as Arguments;

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
