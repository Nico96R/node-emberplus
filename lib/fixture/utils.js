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
const function_argument_1 = require("../common/function/function-argument");
const parameter_type_1 = require("../common/parameter-type");
const common_1 = require("../common/common");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);
exports.testErrorReturned = (action, errorClass) => {
    let error;
    try {
        action();
    }
    catch (e) {
        error = e;
    }
    if (errorClass == null) {
        expect(error).not.toBeDefined();
    }
    else {
        expect(error).toBeDefined();
        expect(error instanceof errorClass);
    }
    return error;
};
exports.testErrorReturnedAsync = (action, errorClass) => __awaiter(void 0, void 0, void 0, function* () {
    let error;
    try {
        yield action();
    }
    catch (e) {
        error = e;
    }
    expect(error).toBeDefined();
    expect(error instanceof errorClass);
    return error;
});
function getRootAsync() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield readFile('./src/fixture/embrionix.ember');
        return common_1.decodeBuffer(data);
    });
}
exports.getRootAsync = getRootAsync;
exports.init = (_src, _tgt) => {
    const targets = _tgt === undefined ? ['tgt1', 'tgt2', 'tgt3'] : _tgt;
    const sources = _src === undefined ? ['src1', 'src2', 'src3'] : _src;
    const defaultSources = [
        { identifier: 't-0', value: -1, access: 'readWrite' },
        { identifier: 't-1', value: 0, access: 'readWrite' },
        { identifier: 't-2', value: 0, access: 'readWrite' }
    ];
    const labels = (endpoints, type) => {
        const _labels = [];
        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            const l = { identifier: `${type}-${i}`, value: endpoint };
            _labels.push(l);
        }
        return _labels;
    };
    const buildConnections = (s, t) => {
        const connections = [];
        for (let i = 0; i < t.length; i++) {
            connections.push({ target: `${i}` });
        }
        return connections;
    };
    return [
        {
            identifier: 'scoreMaster',
            children: [
                {
                    identifier: 'identity',
                    children: [
                        { identifier: 'product', value: 'S-CORE Master', type: 'string' },
                        { identifier: 'company', value: 'BY_RESEARCH', access: 'readWrite' },
                        { identifier: 'version', value: '1.2.0', access: 'readWrite', streamIdentifier: 1234567 },
                        { identifier: 'author', value: 'first.last@gmail.com' },
                        { identifier: 'enumTest', value: 1, type: 'enum', enumMap: [{ key: 'KEY1', value: 1 }, { key: 'KEY3', value: 3 }] }
                    ]
                },
                {
                    identifier: 'router',
                    children: [
                        {
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
                            number: 1000,
                            children: [
                                {
                                    identifier: 'targets',
                                    number: 1,
                                    children: labels(targets, 't')
                                },
                                {
                                    identifier: 'sources',
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
                    identifier: 'addFunction',
                    func: (args) => {
                        const res = new function_argument_1.FunctionArgument(parameter_type_1.ParameterType.integer, args[0].value + args[1].value);
                        return [res];
                    },
                    arguments: [
                        {
                            type: parameter_type_1.ParameterType.integer,
                            value: null,
                            name: 'arg1'
                        },
                        {
                            type: parameter_type_1.ParameterType.integer,
                            value: null,
                            name: 'arg2'
                        }
                    ],
                    result: [
                        {
                            type: parameter_type_1.ParameterType.integer,
                            value: null,
                            name: 'changeCount'
                        }
                    ]
                }
            ]
        },
        {
            identifier: 'audio-streams',
            children: [
                { identifier: 'audio1', value: 123, type: 'integer', streamIdentifier: 45,
                    streamDescriptor: { format: 'signedInt16BigEndian', offset: 4 } },
                { identifier: 'audio2', value: 456, type: 'integer', access: 'readWrite', streamIdentifier: 654321 },
                { identifier: 'audio3', value: 789, type: 'integer', access: 'readWrite', streamIdentifier: 1234567 },
                { identifier: 'audio4', value: 321, type: 'integer', streamIdentifier: 34 }
            ]
        },
        {
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
//# sourceMappingURL=utils.js.map