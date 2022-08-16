import { EmberServer, EmberServerOptions } from './ember-server';
import { init as jsonRoot } from '../fixture/utils';
import { LoggingService, LogLevel } from '../logging/logging.service';

const LOCALHOST = '127.0.0.1';
const PORT = 9009;

describe('EmberServer toJSON / createTreeFromJSON', () => {
    it('should have a toJSON', () => {
        const PARAMETER_PATH = '0.0.1';
        const jsonTree = jsonRoot();
        const root = EmberServer.createTreeFromJSON(jsonTree);
        const serverOptions: EmberServerOptions = {
            host: LOCALHOST, port: PORT, tree: root
        };
        const server = new EmberServer(serverOptions);
        const js = server.toJSON();
        expect(js[0].children[0].children[1].path).toBe(PARAMETER_PATH);

        const tree = EmberServer.createTreeFromJSON(js);
    });

    it('should have a toJSON and return empty array if no tree', () => {
        const serverOptions: EmberServerOptions = {
            host: LOCALHOST, port: PORT, tree: null
        };
        const server = new EmberServer(serverOptions);
        const js = server.toJSON();
        expect(js).toBeDefined();
        expect(js.length).toBe(0);
    });
});
