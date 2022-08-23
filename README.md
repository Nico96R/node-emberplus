# node-emberplus

![Coverage:branches](./badges/badge-branches.svg)
![Coverage:functions](./badges/badge-functions.svg)
![Coverage:lines](./badges/badge-lines.svg)
![Coverage:statements](./badges/badge-statements.svg)

This is version 3 of Ember+ library.
An implementation of [Lawo's Ember+](https://github.com/Lawo/ember-plus) control protocol for Node.  

One of Node's great strengths is the ready availability of frameworks for various
communication protocols and user interfaces. This module allows those to be integrated with Ember+ somewhat more easily than the reference libember C++ implementation.

This version support following ember objects : `Node`, `Parameter`, `Matrix`, `QualifiedNode`, `QualifiedParameter`, `QualifiedMatrix`, `QualifiedFunction`.

It has been tested with `EVS XT4k` and `Embrionix` IP solutions.

The current version has added new features to the initial commit but it also modified the way the lib is used so that now it uses Promise.

Server has been added in version 1.6.0.

## Tools

2 simple tools are provided.  One client and one server.

### serve.ts

```bash
$ node lib/tools/serve.js
Options:
  --version    Show version number                                     [boolean]
  --host, -h   host name|ip                                 [default: "0.0.0.0"]
  --port, -p   port                          [number] [required] [default: 9000]
  --file, -f   file containing the ber (default) or json tree         [required]
  --json, -j   file format is json                                     [boolean]
  --debug, -d  debug                                                   [boolean]
  --help       Show help                                               [boolean]

$ node lib/tools/serve.js --file ./by.json -j --port 9000 -d
1582212364764 'starting server'
1582212364776 - INFO - LISTENING Server listening
1582212366773 - INFO - CONNECTION New connection from 192.168.1.4:54025
1582212369799 - DEBUG - EMBER_REQUEST New request from 192.168.1.4:54025
1582212369801 - DEBUG - HANDLE_QUALIFIED_NODE Handling qualified node 0.0
```

### monitoring-client.js

```bash
node lib/tools/monitoring-client.js  --host 127.0.0.1 --json /tmp/by.json
```

## Example usage

### Client

Get Full tree:

```javascript
const {EmberClient, EmberClientEvent, LoggingService} = require('node-emberplus');
const client = new EmberClient({host: '192.168.1.2', port: 9000, logger: new LoggingService(5)});
client.on(EmberClientEvent.ERROR, e => {
   console.log(e);
});

await client.connectAsync();
// Get Root info
await client.getDirectoryAsync();
// Get a Specific Node
let node: TreeNode = await client.getElementByPathAsync("0.0.2");
console.log(node);
// Get a node by its path identifiers
node = await client.getElementByPathAsync("path/to/node");
console.log(node);
// Expand entire tree
try {
   await client.expandAsync();
}catch(e) {
   console.log(e.stack);
};
```

Subsribe to changes

```javascript
const {EmberClient, EmberLib, Ember} = require('node-emberplus');
const options = {host: HOST, port: PORT};


const client = new EmberClient(options);
await client.connectAsync();
await client.getDirectoryAsync();
console.log(JSON.stringify(client.root.toJSON(), null, 4));
let node: TreeNode = await client.getElementByPathAsync("scoreMaster/router/labels/group 1");
await client.subscribeAsync(
   node, 
   update => {
         console.log(udpate);
   });
node = await client.getElementByPathAsync("0.2");

// You can also provide a callback to the getElementByPath or getDirectoryAsync
// Be carefull that subscription will be done for all elements in the path
await client.getDirectoryAsync(
   node,
   update => {
         console.log(udpate);
   });

await client.getElementByPathAsync("0.3", update => {console.log(update);});
```

### Invoking Function

```javascript
const {EmberClient, EmberLib} = require('node-emberplus');

const client = new EmberClient(options);
await client.connectAsync();
await client.getDirectoryAsync();
console.log(JSON.stringify(client.root.toJSON(), null, 4));
await client.expandAsync(client.root.getElementByNumber(0));
console.log(JSON.stringify(client.root.getElementByNumber(0).toJSON(), null, 4));
const funcNode = client.root.getElementByNumber(0).getElementByNumber(5).getElementByNumber(0);
await client.invokeFunctionAsync(
   funcNode,
   [
      new ember.FunctionArgument(EmberLib.ParameterType.integer, 1),
      new ember.FunctionArgument(EmberLib.ParameterType.integer, 7)
   ]);
```

### Matrix Connection

```javascript
const {EmberClient, EmberLib} = require('node-emberplus');


const client = new EmberClient(options);
await client.connectAsync();
await client.getDirectoryAsync();
let matrix: Matrix = await client.getElementByPathAsync("0.1.0");
console.log("Connecting source 1 to target 0");
await client.matrixConnectAsync(matrix, 0, [1]);
await client.matrixDisconnectAsync(matrix, 0, [1]))
matrix = await client.matrixSetConnectionAsync(matrix, 0, [0,1]))
await client.getElementByPathAsync(matrix.getPath()))
await client.disconnectAsync();

```

### Packet decoder

```javascript
// Simple packet decoder
const Decoder = require('node-emberplus');.Decoder;
const fs = require("fs");

fs.readFile("tree.ember", (e,data) => {
   var root = Decoder(data);
});
```

### Server

```javascript
// Server
const EmberServer = require('node-emberplus');.EmberServer;
const server = new EmberServer({host: "127.0.0.1", port: 9000, tree: root});
server.on(EmberServerEvent.ERROR, e => {
   console.log("Server Error", e);
});
server.on(EmberServerEvent.CLIENT_ERROR, info => {
   console.log("clientError", info);
});
server.on(EmberServerEvent.MATRIX_DISCONNECT, info => {
   console.log(`Client ${info.client} disconnected ${info.target} and ${info.sources}`);
}
server.on(EmberServerEvent.MATRIX_CONNECT, info => {
   console.log(`Client ${info.client} connected ${info.target} and ${info.sources}`);
}
server.on(EmberServerEvent.MATRIX_CHANGE, info => {
   console.log(`Client ${info.client} changed ${info.target} and ${info.sources}`);
}
server.on(EmberServerEvent.EVENT, txt => {
   console.log("event: " + txt);
})
server.listen().then(() => { console.log("listening"); }).catch((e) => { console.log(e.stack); });
```

### Construct Tree

```javascript
const EmberServer = require("emberlibrary").EmberServer;
const {ParameterType, FunctionArgument} = require('node-emberplus');.EmberLib;

const targets = [ "tgt1", "tgt2", "tgt3" ];
const sources = [ "src1", "src2", "src3" ];
const defaultSources = [
   {identifier: "t-0", value: -1, access: "readWrite" },
   {identifier: "t-1", value: 0, access: "readWrite"},
   {identifier: "t-2", value: 0, access: "readWrite"}
];
const labels = function(endpoints, type) {
   let labels = [];
   for (let i = 0; i < endpoints.length; i++) {
      let endpoint = endpoints[i];
      let l = { identifier: `${type}-${i}` };
      if (endpoint) {
            l.value = endpoint;
      }
      labels.push(l);
   }
   return labels;
};

const buildConnections = function(s, t) {
   let connections = [];
   for (let i = 0; i < t.length; i++) {
      connections.push({target: `${i}`});
   }
   return connections;
};
const jsonTree = [
   {
      // path "0"
      identifier: "Sample Tree",
      children: [
            {
               // path "0.0"
               identifier: "identity",
               children: [
                  {identifier: "product", value: "Sample core"},
                  {identifier: "company", value: "Sample", access: "readWrite"},
                  {identifier: "version", value: "1.2.0"},
                  {identifier: "author", value: "first.last@gmail.com"},
               ]
            },
            {
               // path "0.1"
               identifier: "router",
               children: [
                  {
                        // path 0.1.0
                        identifier: "matrix",
                        type: "oneToN",
                        mode: "linear",
                        targetCount: targets.length,
                        sourceCount: sources.length,
                        connections: buildConnections(sources, targets),
                        labels: [{basePath: "0.1.1000", description: "primary"}]
                  },
                  {
                        identifier: "labels",
                        // path "0.1.1000"
                        number: 1000,
                        children: [
                           {
                              identifier: "targets",
                              // Must be 1
                              number: 1,
                              children: labels(targets, "t")
                           },
                           {
                              identifier: "sources",
                              // Must be 2
                              number: 2,
                              children: labels(sources, "s")
                           },
                           {
                           identifier: "group 1",
                              children: [ {identifier: "sdp A", value: "A"}, {identifier: "sdp B", value: "B"}]
                        }
                        ]
                  },
                  {
                     identifier: "disconnect sources",
                     // must be labels + 1
                     number: 1001,
                     children: defaultSources
                  }
               ]
            },
            {
               // path "0.2"
               identifier: "addFunction",
               func: args => {
                  const res = new FunctionArgument();
                  res.type = ParameterType.integer;
                  res.value = args[0].value + args[1].value;
                  return [res];
               },
               arguments: [
                  {
                        type: ParameterType.integer,
                        value: null,
                        name: "arg1"
                  },
                  {
                        type: ParameterType.integer,
                        value: null,
                        name: "arg2"
                  }
               ],
               result: [
                  {
                        type: ParameterType.integer,
                        value: null,
                        name: "changeCount"
                  }
               ]
            },
            {
               identifier: 'audio-streams',
               children: [
                  { identifier: 'audio1', value: 123, type: 'integer', streamIdentifier: 45, streamDescriptor: {format: "signedInt16BigEndian", offset: 4} },
                  { identifier: 'audio2', value: 456, type: 'integer', access: 'readWrite', streamIdentifier: 654321 },
                  { identifier: 'audio3', value: 789, type: 'integer', access: 'readWrite', streamIdentifier: 1234567 },
                  { identifier: 'audio4', value: 321, type: 'integer', streamIdentifier: 34 }
               ]
            ,
            {
               identifier: "template1",
               description: "Parameter template example",
               template: {
                  value: 0,
                  minimum: -1,
                  maximum: 10
               }
            }
      ]
   }
];
const root = EmberServer.createTreeFromJSON(jsonTree);
```
