import {ClientLogs} from './ember-client-logs';
import { Parameter } from '../common/parameter';
import { Node } from '../common/node';
import { Matrix } from '../common/matrix/matrix';
import { MatrixNode } from '../common/matrix/matrix-node';
import { InvocationResult } from '../common/invocation-result';

describe('Client Logs', () => {
    it('INVALID_SUBSCRIBE_REQUEST should support node or null', () => {
        let log = ClientLogs.INVALID_SUBSCRIBE_REQUEST(null);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
        log = ClientLogs.INVALID_SUBSCRIBE_REQUEST(new Parameter(0));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('UNSUBSCRIBE_REQUEST should support node or null', () => {
        let log = ClientLogs.UNSUBSCRIBE_REQUEST(null);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
        log = ClientLogs.UNSUBSCRIBE_REQUEST(new Parameter(0));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('INVALID_UNSUBSCRIBE_REQUEST should support node or null', () => {
        let log = ClientLogs.INVALID_UNSUBSCRIBE_REQUEST(null);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
        log = ClientLogs.INVALID_UNSUBSCRIBE_REQUEST(new Parameter(0));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('UNKOWN_STREAM_RECEIVED', () => {
        const log = ClientLogs.UNKOWN_STREAM_RECEIVED(1);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('UNKOWN_ELEMENT_RECEIVED', () => {
        const log = ClientLogs.UNKOWN_ELEMENT_RECEIVED('path');
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('REQUEST_FAILURE', () => {
        const log = ClientLogs.REQUEST_FAILURE(new Error('error'));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('INVALID_EMBER_MESSAGE_RECEIVED', () => {
        const log = ClientLogs.INVALID_EMBER_MESSAGE_RECEIVED(new Error('error'));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('SUBSCRIBE_REQUEST', () => {
        let log = ClientLogs.SUBSCRIBE_REQUEST(new Node(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();

        log = ClientLogs.SUBSCRIBE_REQUEST();
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('SETVALUE_REQUEST_ERROR', () => {
        const log = ClientLogs.SETVALUE_REQUEST_ERROR(new Node(2), 5);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('SETVALUE_REQUEST_SUCCESS', () => {
        const log = ClientLogs.SETVALUE_REQUEST_SUCCESS(new Node(2), 5);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('SETVALUE_REQUEST', () => {
        const log = ClientLogs.SETVALUE_REQUEST(new Node(2), 5);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('MATRIX_ABSOLUTE_CONNECTION_REQUEST', () => {
        const log = ClientLogs.MATRIX_ABSOLUTE_CONNECTION_REQUEST(new MatrixNode(2), 5, [1]);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('MATRIX_CONNECTION_REQUEST', () => {
        const log = ClientLogs.MATRIX_CONNECTION_REQUEST(new MatrixNode(2), 5, [1]);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('MATRIX_DISCONNECTION_REQUEST', () => {
        const log = ClientLogs.MATRIX_DISCONNECTION_REQUEST(new MatrixNode(2), 5, [1]);
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('GET_ELEMENT_RESPONSE', () => {
        const log = ClientLogs.GET_ELEMENT_RESPONSE(new Node(2), '1.5');
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('GET_ELEMENT_REQUEST', () => {
        const log = ClientLogs.GET_ELEMENT_REQUEST('1.5');
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('INVOCATION_ERROR', () => {
        const log = ClientLogs.INVOCATION_ERROR(new Error('error'));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('INVOCATION_RESULT_RECEIVED', () => {
        const log = ClientLogs.INVOCATION_RESULT_RECEIVED(new InvocationResult(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('INVOCATION_SENDING_QUERY', () => {
        const log = ClientLogs.INVOCATION_SENDING_QUERY(new Node(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('GETDIRECTORY_SENDING_QUERY', () => {
        const log = ClientLogs.GETDIRECTORY_SENDING_QUERY(new Node(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('GETDIRECTORY_RESPONSE', () => {
        const log = ClientLogs.GETDIRECTORY_RESPONSE(new Node(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('GETDIRECTORY_UNEXPECTED_RESPONSE', () => {
        const log = ClientLogs.GETDIRECTORY_UNEXPECTED_RESPONSE(new Node(2), new Node(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('GETDIRECTORY_ERROR', () => {
        const log = ClientLogs.GETDIRECTORY_ERROR(new Error('error'));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('EXPAND_NODE_ERROR', () => {
        const log = ClientLogs.EXPAND_NODE_ERROR(new Node(2), new Error('error'));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('EXPAND_NODE_COMPLETE', () => {
        const log = ClientLogs.EXPAND_NODE_COMPLETE(new Node(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('EXPAND_WITH_NO_CHILD', () => {
        const log = ClientLogs.EXPAND_WITH_NO_CHILD(new Node(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('EXPANDING_NODE', () => {
        const log = ClientLogs.EXPANDING_NODE(new Node(2));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('DISCONNECTING', () => {
        const log = ClientLogs.DISCONNECTING('1.1.1.1');
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('CONNECTED', () => {
        const log = ClientLogs.CONNECTED('1.1.1.1');
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('CONNECTING', () => {
        const log = ClientLogs.CONNECTING('1.1.1.1');
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
    it('CONNECTION_FAILED', () => {
        const log = ClientLogs.CONNECTION_FAILED('1.1.1.1', new Error('error'));
        expect(log.logLevel).toBeDefined();
        expect(log.createLog).toBeDefined();
        expect(log.createLog()).toBeDefined();
    });
});
