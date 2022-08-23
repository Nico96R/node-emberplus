#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ember_client_1 = require("../client/ember-client");
const logging_service_1 = require("../logging/logging.service");
const LOCALHOST = '192.168.1.2';
const PORT = 9000;
const MATRIX_PATH = '0.1.0';
const options = { host: LOCALHOST, port: PORT };
options.logger = new logging_service_1.LoggingService(5);
const client = new ember_client_1.EmberClient(options);
client.connectAsync()
    .then(() => client.expandAsync())
    .catch((e) => {
    console.log(e);
})
    .then(() => {
    console.log(client.root);
    console.log('done.');
});
//# sourceMappingURL=debug.js.map