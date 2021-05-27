/* eslint-disable no-console */
const _ = require('lodash');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

function createGrpcClient(host) {
  if (!host) {
    console.log('Grpc Client host is not provided');
    return null;
  }

  const packageName = 'grpc.health.v1';
  const serviceName = 'Health';
  const protoPath = path.join(__dirname, '../healthcheck.proto');

  const packageDefinition = protoLoader.loadSync(
    protoPath,
    {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
  );
  const GrpcService = _.get(grpc.loadPackageDefinition(packageDefinition), packageName)[serviceName];
  return new GrpcService(host, grpc.credentials.createInsecure());
}

function createCallOptions(timeoutMs = 60000) {
  return {
    deadline: new Date(Date.now() + timeoutMs),
  };
}

module.exports = {
  createGrpcClient,
  createCallOptions,
};
