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
  #watchers;

  constructor(statusMap) {
    this.statusMap = _.cloneDeep(statusMap);
    this.#watchers = {};
  }

  setStatus(service, status) {
    this.statusMap[service] = status;

    const serviceWatchers = this.#watchers[service] || [];

    for (let i = 0; i < serviceWatchers.length; i += 1) {
      const watcher = serviceWatchers[i];
      watcher.write({ status });
    }
  }

  check(call, callback) {
    const { service } = call.request;
    const status = _.get(this.statusMap, service, null);
    if (status === null) {
      callback({ code: grpc.status.NOT_FOUND });
    } else {
      callback(null, { status });
    }
  }

  watch(call) {
    const { service } = call.request;
    this.#addWatcher(service, call);
    call.on('cancelled', () => {
      console.log('client cancelled !!!!');
      this.#removeWatcher(service, call);
    });

    call.on('end', () => {
      console.log('client end !!!!');
      this.#removeWatcher(service, call);
    });

    const currentStatus = _.get(this.statusMap, service, null);
    if (!currentStatus) {
      call.write({ status: servingStatus.SERVICE_UNKNOWN });
      return;
    }
    call.write({ status: currentStatus });
  }

  #addWatcher(service, watcher) {
    const serviceWatchers = this.#watchers[service];
    if (serviceWatchers) {
      serviceWatchers.push(watcher);
      return;
    }
    this.#watchers[service] = [watcher];
  }

  #removeWatcher(service, watcher) {
    const serviceWatcher = this.#watchers[service];
    if (serviceWatcher) {
      _.pull(serviceWatcher, watcher);
    }
  }
}

module.exports = {
  servingStatus,
  service: GrpcService.service,
  Implementation: HealthImplementation,
};
