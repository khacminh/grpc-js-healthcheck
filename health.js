const _ = require('lodash');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageName = 'grpc.health.v1';
const serviceName = 'Health';
const protoPath = path.join(__dirname, 'healthcheck.proto');

const protoDefinition = protoLoader.loadSync(protoPath, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const packageDefinition = _.get(grpc.loadPackageDefinition(protoDefinition), packageName);
const GrpcService = packageDefinition[serviceName];

const servingStatus = {
  UNKNOWN: 'UNKNOWN',
  SERVING: 'SERVING',
  NOT_SERVING: 'NOT_SERVING',
  SERVICE_UNKNOWN: 'SERVICE_UNKNOWN', // Used only by the Watch method.
};

class HealthImplementation {
  constructor(statusMap) {
    this.statusMap = _.cloneDeep(statusMap);
  }

  setStatus(service, status) {
    this.statusMap[service] = status;
  }

  check(call, callback) {
    // callback(null, )
    const { service } = call.request;
    const status = _.get(this.statusMap, service, null);
    if (status === null) {
      callback({ code: grpc.status.NOT_FOUND });
    } else {
      callback(null, { status });
    }
  }
}

module.exports = {
  servingStatus,
  service: GrpcService.service,
  Implementation: HealthImplementation,
};
