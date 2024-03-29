# grpc-js-health-check

Implementation for gRPC health check using [@grpc/grpc-js](https://www.npmjs.com/package/@grpc/grpc-js)

This package is drop-in replacement for [grpc-health-check](https://www.npmjs.com/package/grpc-health-check)

## Example

```js
const { servingStatus, Implementation, service } = require('grpc-js-health-check');

const statusMap = {
  '': servingStatus.SERVING,
  'ServiceFoo': servingStatus.NOT_SERVING,
  'ServiceBar': servingStatus.SERVING,
};
const healthImpl = new Implementation(statusMap);

// add to gRPC server
server.addService(service, healthImpl);

// set service status
healthImpl.setStatus('ServiceFoo', servingStatus.SERVING);
```

> For more example, please take a look on the [test](https://github.com/khacminh/grpc-js-healthcheck/tree/main/test)

## Change notes

### Version 1.2.x

- Implement `watch` method
- Update the dependencies
- Dependencies:
  - @grpc/grpc-js: 1.9.13
  - @grpc/proto-loader: 0.7.10

### Version 1.1.x

- Update the dependencies
- Dependencies:
  - @grpc/grpc-js: 1.8.12
  - @grpc/proto-loader: 0.7.5

### Version 1.0.x

- First release, this package is drop-in replacement for [grpc-health-check](https://www.npmjs.com/package/grpc-health-check)
- Dependencies:
  - @grpc/grpc-js: 1.2.2
  - @grpc/proto-loader: 0.5.5
