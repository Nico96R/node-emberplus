
# Ember+Lib Review Report

This is the second review of the Ember+Lib

First I want to say that I'm very impressed by the amount of code you produced in a reduced amount of time. 

You perfectly integrated the changes / enhancements we proposed.

Your code is really more easy to understand.

I'm very happy with what you provide.

I can start now building the `Ember+ Connector` and `Common` Libraries for a future reactive integration in the gateway.

---

## POSITIVE POINTS

* (+++) Tests
  * Jest Mocking is used
  * Impressive code coverage (See badges)
  * A lot of new small test files
  * A lot of new tests added

* (+++) Code (more clear)
  * Async/Await is used 
  * Logging everywhere instead of console
  * Data hiding, variables/methods visibility correctly implemented
  * Respect of naming convention

---

## ENHANCEMENTS

I propose some enhancements that can be used to increase the performance of the Lib (mainly related to the logging).

I make also some remarks that should facilitate your job.

* Package.json
* Logging - `ClientLog`, `ServerLog` as function and `LoggingService` as a singleton
* Unit tests - small remarks 
* Naming convention

---
## MISSING

* Configuration - Options to be passed to the `EmberClient` and `EmberServer` ctor.
  
---

## Package.json

* is the `rewire` package used? 
* If not remove it from dependencies
  
---

## Configuration - IMPORTANT

* Provide as parameter in the `EmberClient` and `EmberServer` an options object (`EmberClientOptions` and `EmberServerOptions`) with all the settings used by those classes.
* Move the `static readonly settings` to those classes (default, timeout, ...)

---

## Logging - IMPORTANT

### CLient / Server Log

* Using `ClientLog/ServerLog` is a common and good practice (this does not pollute your code with logging message, but centralize those one in classes
* But for performance reason the `ClientLog/ServerLog` must be created only when it is needed.
* The `LoggingService` received as parameter in its ctor the current `logLevel`
* In each logging method the logLevel of the log event is compares to the logLevel of the `LoggingService` to see if a log must be written.
* If your application calls a lot of time the log() functions and the logLevel of the  `LoggingService` is set to critical, you will instantiate a lot of log events for nothing because of skipped by the `LoggingService`

* The solution is to use a function to create the log event, only when needed.

* Update the `LoggingEvent` ctor signature
  * `loglevel` is `public` 
  * `type` is a `string`

* `ClientLog` 

  * remove completely the `export const enum Types { ...}` 
  * the `tyype`i s infered from the `static property name` 
  * remove the `loglevel` from the ctor
  * change the `type` to `string` in the ctor`
  * update the static property to function

* `LoggingService`
  * rename the `log()` method to `private internalLog()`
  * create a new `log()` method
    * expect the `logLevel` as parameter
    * expect a function that returns a `LogEvent` instance as parameter
    * remove the test on LogLevel from logging function (`critical()`, `warn()`, ...)
    * instantiate the `LogEvent` only when needed 
    * update the `LogEvent's loglevel`
    * call the `internalLog()` method with the `LogEvent` as before
 
```typescript
export class LoggingEvent implements LoggingEventInterface {

    constructor(private message: string | Error, public logLevel: LogLevel, readonly type: string, ...args: any[]) {
        this.args = args;
        this._timestamp = Date.now();
    }
}

export class ClientLogs extends LoggingEvent {

    constructor(message: string | Error, type: string, ...args: any[]) {
        super(message, LogLevel.debug, type, ...args);
    }

    static CONNECTING = (address: string): ClientLogs => new ClientLogs(`Connection to ${address}`, ClientLogs.CONNECTING.name);
    ... same for the other
}

export class LoggingService {

    ...

    critic(msg: string, ...args: any[]): void {
        this._log(`${Date.now()} - CRITIC - ${msg}`, ...args);
    }
    
    ...

    log(logLevel: LogLevel, msgFct: () => LoggingEventInterface): void {
        if (this.logLevel >= logLevel) {
            const msg = msgFct();
            msg.logLevel = logLevel;
            this.logInternal(msg);
        }
    }
    
    logInternal(msg: LoggingEventInterface): void {
        ..
    }
}

// Usage

this.logger.log(LogLevel.critical, () => ClientLogs.CONNECTED(this.socket.remoteAddress));

```

### LoggingService Singleton

* The `LoggignService` is instantiated all the time through the `new` 
* For performance reason, you can use a singleton where you reference all the time the same instance created only once
* The same can be done for other services where singleton is relevant 
* For your info, in the Connector we will use the DI/IOC (by using the package `typedi` and `reflect-metadata` that realise those tasks for us. Not necessary to use those packages in the current library)
  
 ```typescript
export class LoggingService {
    static INSTANCE = new LoggingService();
    static LOG_LEVEL = LogLevel.info;

    private constructor(private logLevel = LoggingService.LOG_LEVEL) {
    }

    log(): void {
        console.log('test');
    }
}


// Usage

// At the start of the program for example)
LoggingService.LOG_LEVEL = LogLevel.debug;

// Instead of instantiating all the tile a new LoggingService(),
// Use the unique instance of it 
LoggingService.INSTANCE.log( ... );
```
  
---

## Unit tests

* Wait the end of async operation before exiting the test
    
    * in a lot of tests, the latest instruction is a call to an Async method (returning a promise)
    * it is better to add an `await` before, to be sure that when the test exits before the the disconnect is done

* try / catch

    * Jest provides code that simplifies coding 

Eg. see following code snippet
```typescript
try {
    await client.expandAsync();
} catch (e) {
    error = e;
}
expect(error).not.toBeDefined();

// can be done like this

const p = client.expandAsync();
await expect(p).rejects.toThrowError(Error);
```

---

## Emum event instead of string

* Use event `Enum` inside tests instead of `string` like `error` and `clientError`

Eg. see following code snippet


```typescript
server.on('error', e => {
    console.log('Server Error', e);
});
server.on('clientError', info => {
    console.log('clientError', info.error);
});
```

---

## Simplification when using async/await 

```typescript
async matrixConnectAsync(matrixNode: Matrix, targetID: number, sources: number[]): Promise<Matrix> {
    this.logger.log(ClientLogs.MATRIX_CONNECTION_REQUEST(matrixNode, targetID, sources));
    const matrix = await this.matrixOperationAsync(matrixNode, targetID, sources, MatrixOperation.connect);
    return matrix;
}

// Can code like this

matrixConnectAsync(matrixNode: Matrix, targetID: number, sources: number[]): Promise<Matrix> {
    this.logger.log(ClientLogs.MATRIX_CONNECTION_REQUEST(matrixNode, targetID, sources));
    return this.matrixOperationAsync(matrixNode, targetID, sources, MatrixOperation.connect);
}
```

---

## Naming Convention

* You define interfaces to define the scope of a javascript object. 
* Perfect. But in this case this is not necessary to suffix the interface name with `Interface`.
* You can just use the name 

Eg. `InvocationResultInterface` becomes `InvocationResult`

* If you use an interface as scope for a Class that must implement it.
* In that case we prefix the interface name with `uppercase I`

Eg. `EmberServerInterface` becomes `IEmberServer`

---

## strictNullChecks

Normally to be more strict and avoid null pointer exception, we use the following ts compiler option `"strictNullChecks": true`. This enforce you to use `type guard`.
This introduce more constraints but make your code more safe.

---

## Elvis operator 

* Try t use the `?.` operator when possible

Eg. in the method
```typescript
toJSON(): MatrixContentsInterface{
    ... // Use Elvis operator
}
```

---

## Null vs Undefined

Be careful when using `null` of `undefined`