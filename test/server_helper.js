/* eslint-disable no-console */
const grpc = require('@grpc/grpc-js');
const { service } = require('../health');

const server = new grpc.Server();

function startGrpcServer(host, healthImpl) {
  server.addService(service, healthImpl);
  return new Promise((resolve, reject) => {
    server.bindAsync(host, grpc.ServerCredentials.createInsecure(), (error, port) => {
      if (error) {
        console.log('grpc binding error', error);
        reject();
      }

      server.start();
      // console.log(`Running on port ${port}`);
      resolve();
    });
  });
}

function stopGrpcServer() {
  server.tryShutdown(error => {
    // do nothing
  });
}

module.exports = {
  startGrpcServer,
  stopGrpcServer,
};
