#!/usr/bin/env node

import { writeFile, createWriteStream, readFileSync, writeFileSync, createReadStream } from 'fs';
import { TreeNode } from '../common/tree-node';
import { ErrorMultipleError } from '../error/errors';
import { EmberClient, EmberClientOptions } from '../client/ember-client';
import { nodeLogger, jsonNodeLogger, createTreeBranch} from '../common/common';
import { LogLevel, LoggingService } from '../logging/logging.service';
import { EmberClientEvent } from '../client/ember-client.events';
import { init as jsonRoot } from '../fixture/utils';
import { EmberServer, EmberServerEvent, ClientErrorEventData, EmberServerOptions } from '../server/ember-server';
import { Matrix } from '../common/matrix/matrix';
import { resolvePtr } from 'dns';
import { FunctionArgument } from '../common/function/function-argument';
import { ParameterType } from '../common/parameter-type';
import { QualifiedNode } from '../common/qualified-node';
import * as BER from '../ber';

const LOCALHOST = '192.168.1.2';
const PORT = 9000;
const MATRIX_PATH = '0.1.0';

// const main = async () => {
//     const data = await readFileAsync('test.json');
//     const tree = EmberServer.createTreeFromJSON(data);

//     const options = new EmberServerOptions(
//         LOCALHOST,
//         PORT,
//         tree
//     );

//     const server = new EmberServer(options);
//     server.on(EmberServerEvent.CONNECTION, (info: string) => {
//         console.log(Date.now(), `Connection from ${info}`);
//     });
//     server.on(EmberServerEvent.DISCONNECT, (info: string) => {
//         console.log(Date.now(), `Disconnect from ${info}`);
//     });
//     console.log(Date.now(), 'starting server');
//     try {
//         server.listen();
//     } catch (e) {
//         console.log(e);
//     }
// };

// main();

const options: EmberClientOptions = { host: LOCALHOST, port: PORT};
options.logger = new LoggingService(LogLevel.debug);
const client = new EmberClient(options);
client.connectAsync()
.then(() => client.expandAsync())
// .then(() => {
//     const file = './test.json';
//     console.log(`saving json tree into ${file}`);
//     const wstream = createWriteStream(file);
//     let stopOnError = false;
//     wstream.on('error', (e: Error) => {
//         console.log(e);
//         stopOnError = true;
//     });
//     const log = async (x: string): Promise<void> => {
//         return new Promise((resolve, reject) => {
//             if (stopOnError) {
//                 return reject(new Error('Failed to writer'));
//             }
//             if (wstream.write(x)) {
//                 return resolve();
//             } else {
//                 wstream.once('drain', () => {
//                     resolve();
//                 });
//             }
//         });
//     };
//     return jsonNodeLogger(client.root, {log}).then(() => {
//         wstream.end();
//         console.log('json tree saved');
//     });
// })
.catch((e) => {
    console.log(e);
})
.then(() => {
    console.log(client.root);
    console.log('done.');
});
