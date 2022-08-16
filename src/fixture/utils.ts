import { FunctionArgument } from '../common/function/function-argument';
import { ParameterType } from '../common/parameter-type';
import { decodeBuffer } from '../common/common';
import { TreeNode } from '../common/tree-node';
import fs = require('fs');
import util = require('util');
import { StreamFormat } from '../common/stream/stream-format';

const readFile = util.promisify(fs.readFile);

export const testErrorReturned = (action: () => void, errorClass: any): Error => {
    let error: Error;
    try {
        action();
    } catch (e) {
        error = e;
    }
    if (errorClass == null) {
        expect(error).not.toBeDefined();
    } else {
        expect(error).toBeDefined();
        expect(error instanceof errorClass);
    }
    return error;
};

export const testErrorReturnedAsync = async (action: () => Promise<void>, errorClass: any): Promise<Error> => {
    let error: Error;
    try {
        await action();
    } catch (e) {
        error = e;
    }
    expect(error).toBeDefined();
    expect(error instanceof errorClass);
    return error;
};

export async function getRootAsync(): Promise<TreeNode>  {
        const data = await readFile('./src/fixture/embrionix.ember');
        return (decodeBuffer(data) as TreeNode);
}

export const init = (_src?: string[], _tgt?: string[]): { [index: string]: any }[] => {
    const targets = _tgt === undefined ? ['tgt1', 'tgt2', 'tgt3'] : _tgt;
    const sources = _src === undefined ? ['src1', 'src2', 'src3'] : _src;
    const defaultSources = [
        { identifier: 't-0', value: -1, access: 'readWrite' },
        { identifier: 't-1', value: 0, access: 'readWrite' },
        { identifier: 't-2', value: 0, access: 'readWrite' }
    ];
    const labels = (endpoints: string[], type: string): { identifier: string, value: string }[] => {
        const _labels = [];
        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            const l = { identifier: `${type}-${i}`, value: endpoint };
            _labels.push(l);
        }
        return _labels;
    };

    const buildConnections = (s: string[], t: string[]) => {
        const connections = [];
        for (let i = 0; i < t.length; i++) {
            connections.push({ target: `${i}` });
        }
        return connections;
    };

    return [
        {
            // path '0'
            identifier: 'scoreMaster',
            children: [
                {
                    // path '0.0'
                    identifier: 'identity',
                    children: [
                        { identifier: 'product', value: 'S-CORE Master', type: 'string' },
                        { identifier: 'company', value: 'BY_RESEARCH', access: 'readWrite' },
                        { identifier: 'version', value: '1.2.0', access: 'readWrite', streamIdentifier: 1234567 },
                        { identifier: 'author', value: 'first.last@gmail.com' },
                        { identifier: 'enumTest', value: 1, type: 'enum', enumMap: [ {key: 'KEY1', value: 1}, {key: 'KEY3', value: 3}]}
                    ]
                },
                {
                    // path '0.1'
                    identifier: 'router',
                    children: [
                        {
                            // path 0.1.0
                            identifier: 'matrix',
                            type: 'oneToN',
                            mode: 'linear',
                            targetCount: targets.length,
                            sourceCount: sources.length,
                            connections: buildConnections(sources, targets),
                            labels: [{ basePath: '0.1.1000', description: 'primary' }]
                        },
                        {
                            identifier: 'labels',
                            // path '0.1.1000'
                            number: 1000,
                            children: [
                                {
                                    identifier: 'targets',
                                    // Must be 1
                                    number: 1,
                                    children: labels(targets, 't')
                                },
                                {
                                    identifier: 'sources',
                                    // Must be 2
                                    number: 2,
                                    children: labels(sources, 's')
                                },
                                {
                                    identifier: 'group 1',
                                    children: [{ identifier: 'sdp A', value: 'A' }, { identifier: 'sdp B', value: 'B' }]
                                }
                            ]
                        },
                        {
                            identifier: 'disconnect sources',
                            number: 1001,
                            children: defaultSources
                        }
                    ]
                },
                {
                    // path '0.2'
                    identifier: 'addFunction',
                    func: (args: FunctionArgument[]): FunctionArgument[] => {
                        const res = new FunctionArgument(ParameterType.integer, args[0].value + args[1].value);
                        return [res];
                    },
                    arguments: [
                        {
                            type: ParameterType.integer,
                            value: null,
                            name: 'arg1'
                        },
                        {
                            type: ParameterType.integer,
                            value: null,
                            name: 'arg2'
                        }
                    ],
                    result: [
                        {
                            type: ParameterType.integer,
                            value: null,
                            name: 'changeCount'
                        }
                    ]
                }
            ]
        },
        {
            identifier: 'audio-streams', // path 1
            children: [
                { identifier: 'audio1', value: 123, type: 'integer', streamIdentifier: 45,
                    streamDescriptor: {format: 'signedInt16BigEndian', offset: 4} },
                { identifier: 'audio2', value: 456, type: 'integer', access: 'readWrite', streamIdentifier: 654321 },
                { identifier: 'audio3', value: 789, type: 'integer', access: 'readWrite', streamIdentifier: 1234567 },
                { identifier: 'audio4', value: 321, type: 'integer', streamIdentifier: 34 }
            ]
        },
        {
            // path '2'
            identifier: 'node-template',
            description: 'template test',
            template: {
                number: 0,
                identifier: 'identity',
                children: [
                    { identifier: 'product', value: 'S-CORE Master', type: 'string' },
                    { identifier: 'company', value: 'BY_RESEARCH', access: 'readWrite' },
                    { identifier: 'version', value: '1.2.0', access: 'readWrite', streamIdentifier: 1234567 },
                    { identifier: 'author', value: 'first.last@gmail.com' }
                ]
            }
        }

    ];
};
