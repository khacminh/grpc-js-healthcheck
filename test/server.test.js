const assert = require('assert');
const grpc = require('@grpc/grpc-js');
const health = require('../health');
const { startGrpcServer, stopGrpcServer } = require('./server_helper');
const { createGrpcClient } = require('./client_helper');

const serverAddress = '0.0.0.0:3000';
const { servingStatus } = health;

describe('testing health check for gRPC server', () => {
  let healthImpl;

  const statusMap = {
    '': servingStatus.SERVING,
    'grpc.test.TestServiceNotServing': servingStatus.NOT_SERVING,
    'grpc.test.TestServiceServing': servingStatus.SERVING,

    'grpc.test.Watch1': servingStatus.SERVICE_UNKNOWN,
    'grpc.test.Watch2': servingStatus.SERVICE_UNKNOWN,
  };

  before(async () => {
    healthImpl = new health.Implementation(statusMap);
    await startGrpcServer(serverAddress, healthImpl);
  });

  after(() => {
    stopGrpcServer();
  });

  describe('testing check method', () => {
    let client;

    before(() => {
      client = createGrpcClient(serverAddress);
    });

    it('should say an enabled service is SERVING', done => {
      const request = {
        service: '',
      };

      client.check(request, (err, response) => {
        assert.ifError(err);
        assert.strictEqual(response.status, servingStatus.SERVING);
        done();
      });
    });

    it('should say an enabled service is SERVING - empty request for service="" ', done => {
      const request = {};

      client.check(request, (err, response) => {
        assert.ifError(err);
        assert.strictEqual(response.status, servingStatus.SERVING);
        done();
      });
    });

    it('should say that a disabled service is NOT_SERVING', done => {
      const request = {
        service: 'grpc.test.TestServiceNotServing',
      };

      client.check(request, (err, response) => {
        assert.ifError(err);
        assert.strictEqual(response.status, servingStatus.NOT_SERVING);
        done();
      });
    });

    it('should say that a disabled service is SERVING', done => {
      const request = {
        service: 'grpc.test.TestServiceServing',
      };

      client.check(request, (err, response) => {
        assert.ifError(err);
        assert.strictEqual(response.status, servingStatus.SERVING);
        done();
      });
    });

    it('should get NOT_FOUND if the service is not registered', done => {
      const request = {
        service: 'not_registered',
      };

      client.check(request, err => {
        assert(err);
        assert.strictEqual(err.code, grpc.status.NOT_FOUND);
        done();
      });
    });

    it('should get a different response if the status changes', done => {
      const request = {
        service: 'transient',
      };

      client.check(request, err => {
        assert(err);
        assert.strictEqual(err.code, grpc.status.NOT_FOUND);

        healthImpl.setStatus('transient', servingStatus.SERVING);
        client.check(request, (err2, response2) => {
          assert.ifError(err2);
          assert.strictEqual(response2.status, servingStatus.SERVING);
          done();
        });
      });
    });
  });

  describe('testing watch method', () => {
    let client;

    before(() => {
      client = createGrpcClient(serverAddress);
    });

    it('should repond with serving service', done => {
      const call = client.watch({
        service: 'grpc.test.TestServiceServing',
      });
      call.on('data', request => {
        assert.strictEqual(request.status, servingStatus.SERVING);
        done();
      });
    });

    it('should receive new status', done => {
      const call1 = client.watch({ service: 'grpc.test.Watch1' });
      const call2 = client.watch({ service: 'grpc.test.Watch2' });

      call1.on('data', request => {
        assert.strictEqual(request.status, servingStatus.SERVING);
        done();
      });

      call2.on('data', () => {
        throw new Error("status didn't change");
      });

      healthImpl.setStatus('grpc.test.Watch1', servingStatus.SERVING);
    });
  });
});
