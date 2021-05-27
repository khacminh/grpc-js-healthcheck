const assert = require('assert');
const grpc = require('@grpc/grpc-js');
const health = require('../health');
const { startGrpcServer, stopGrpcServer } = require('./server_helper');
const { createGrpcClient } = require('./client_helper');

const serverAddress = '0.0.0.0:3000';
const { servingStatus } = health;

describe('testing health check for gRPC server', () => {
  let client;
  let healthImpl;

  const statusMap = {
    '': servingStatus.SERVING,
    'grpc.test.TestServiceNotServing': servingStatus.NOT_SERVING,
    'grpc.test.TestServiceServing': servingStatus.SERVING,
  };

  before(async () => {
    healthImpl = new health.Implementation(statusMap);
    await startGrpcServer(serverAddress, healthImpl);
    client = createGrpcClient(serverAddress);
  });

  after(() => {
    stopGrpcServer();
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
