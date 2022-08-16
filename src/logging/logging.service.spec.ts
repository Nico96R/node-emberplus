import { LoggingService, LogLevel, LoggingEvent, LogEventConstructor } from './logging.service';

describe('LoggingService', () => {

    it('should log debug by using console.log()', () => {

        // Arrange
        const message = 'NODE-TS is started...';
        let res: string;
        console.log = jest.fn((m: string) => {
            res = m;
        });

        // Act
        new LoggingService(LogLevel.debug).debug(message);

        // Assert
        expect(console.log).toHaveBeenCalled();
        expect(res).toContain(message);
    });
    it('should log critic by using console.log()', () => {

        // Arrange
        const message = 'NODE-TS is started...';
        let res: string;
        console.log = jest.fn((m: string) => {
            res = m;
        });

        // Act
        new LoggingService(LogLevel.debug).critic(message);

        // Assert
        expect(console.log).toHaveBeenCalled();
        expect(res).toContain(message);
    });
    it('should log info by using console.log()', () => {

        // Arrange
        const message = 'NODE-TS is started...';
        let res: string;
        console.log = jest.fn((m: string) => {
            res = m;
        });

        // Act
        new LoggingService().info(message);

        // Assert
        expect(console.log).toHaveBeenCalled();
        expect(res).toContain(message);
    });
    it('should log error by using console.log()', () => {

        // Arrange
        const message = 'NODE-TS is started...';
        let res: string;
        console.log = jest.fn((m: string) => {
            res = m;
        });

        // Act
        new LoggingService().error(message);

        // Assert
        expect(console.log).toHaveBeenCalled();
        expect(res).toContain(message);
    });
    it('should log error by using console.log() when message is an Error', () => {

        // Arrange
        const message = 'NODE-TS is started...';
        let res: string;
        console.log = jest.fn((m: string) => {
            res = m;
        });

        // Act
        new LoggingService().error(new Error(message));

        // Assert
        expect(console.log).toHaveBeenCalled();
        expect(res).toContain(message);
    });

    it('should log warn by using console.log()', () => {

        // Arrange
        const message = 'NODE-TS is started...';
        let res: string;
        console.log = jest.fn((m: string) => {
            res = m;
        });

        // Act
        new LoggingService().warn(message);

        // Assert
        expect(console.log).toHaveBeenCalled();
        expect(res).toContain(message);
    });

    it('should log warn by using console.log() when passing Error', () => {

        // Arrange
        const message = 'NODE-TS is started...';
        let res: string;
        console.log = jest.fn((m: string) => {
            res = m;
        });

        // Act
        new LoggingService().warn(new Error(message));

        // Assert
        expect(console.log).toHaveBeenCalled();
        expect(res).toContain(message);
    });

    it('should log LogEventConstructor with any level', () => {
        // Arrange
        const test = (level: number) => {
            const message = 'NODE-TS is started...';
            const createLog = jest.fn(() => {
                return new LoggingEvent(message, level, 'TEST');
            });
            const logEvent: LogEventConstructor = {
                logLevel: level,
                createLog: createLog
            };
            let res: string;
            console.log = jest.fn((...args: string[]) => {
                res = args.join(',');
            });

            // Act
            new LoggingService(LogLevel.debug).log(logEvent);

            // Assert
            expect(createLog).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalled();
            expect(res).toContain(message);
        };
        for (let i = LogLevel.critical; i <= LogLevel.debug; i++) {
            test(i);
        }
    });

    it('should log LogEventConstructor that contains an error', () => {
        // Arrange
        const message = 'NODE-TS is started...';
        const createLog = jest.fn(() => {
            return new LoggingEvent(new Error(message), LogLevel.warn, 'TEST');
        });
        const logEvent: LogEventConstructor = {
            logLevel: LogLevel.warn,
            createLog: createLog
        };
        let res: string;
        console.log = jest.fn((...args: string[]) => {
            res = args.join(',');
        });

        // Act
        new LoggingService(LogLevel.debug).log(logEvent);

        // Assert
        expect(createLog).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalled();
        expect(res).toContain(message);
    });
    it('should not log LogEventConstructor if log level too high', () => {
        // Arrange
        const message = 'NODE-TS is started...';
        const createLog = jest.fn(() => {
            return new LoggingEvent(message, LogLevel.debug, 'TEST');
        });
        const logEvent: LogEventConstructor = {
            logLevel: LogLevel.debug,
            createLog: createLog
        };
        let res: string;
        console.log = jest.fn((m: string) => {
            res = m;
        });

        // Act
        new LoggingService(LogLevel.critical).log(logEvent);

        // Assert
        expect(console.log).not.toHaveBeenCalled();
        expect(createLog).not.toHaveBeenCalled();
    });
});

describe('LogginEvent', () => {
    it('should have a toString() function which returns the Error.message on Error', () => {
        const internalError = new Error('internal error');
        const event = new LoggingEvent(internalError, LogLevel.error, 'TEST');
        expect(event.toString()).toBe(internalError.message);
    });
    it('should have a error properties which returns the Error or a message embedded in an error', () => {
        const internalError = new Error('internal error');
        let event = new LoggingEvent(internalError, LogLevel.error, 'TEST');
        expect(event.error).toBe(internalError);

        event = new LoggingEvent(internalError.message, LogLevel.error, 'TEST');
        expect(event.error instanceof Error).toBeTruthy();
        expect(event.error.message).toBe(internalError.message);
    });
});
