# gc-http-factory

A module that wraps Angular's `$http` for easy creation of services that talk to an API.

```
bower install gc-http-factory
```

## Example

```js
angular.app('app', [
  'gc.httpFactory'
]).factory('BillService', function(HttpFactory) {
  var BillHttp = HttpFactory.create({
    url: '/api/bills/:id'
  }, {
    findOne: { method: 'GET' },
    findAll: { method: 'GET' },
    create: { method: 'POST' }
  });

  return BillHttp;
});

// elsewhere in your application
BillHttp.findOne({params: { id: 1 }}).then(function(data) {...});
//=> GET /api/bills/1

BillHttp.findAll().then(function(data) {...});
//=> GET /api/bills

BillHttp.create({
  data: {
    amount: 200
  }
}); //=> POST /api/bills with { amount: 200 }
```

## Configuration

Any configuration options you can pass to `$http`, you can pass to the `create` method of `HttpFactory`, with some notable exceptions, all of which are documented below.

`HttpFactory.create` expects two arguments:

1. an object of configuration options
2. an object of methods that you would like defined, where each is an object of configuration options for that particular method.


#### Configuration Precedence

It is important to know that you can pass in configuration options in three places:

1. In the first object you pass to `HttpFactory.create`
2. In the object for each method you ask HttpFactory to create
3. When you call a method HttpFactory created

Any configuration passed will override any previous configuration. For example, if you create a service with caching turned on:

```js
angular.app('app', [
  'gc.httpFactory'
]).factory('BillService', function(HttpFactory) {
  var BillHttp = HttpFactory.create({
    url: '/api/bills/:id',
    cache: true
  }, {
    find: { method: 'GET' }
  });

  return BillHttp;
});
```

But then call the method like so:

```js
BillService.find({ cache: false });
```

The cache _will not_ be used. This enables you to provide defaults but override them in special cases easily enough.

## Passing Parameters and Data

If a method takes parameters, pass in a `params` object when you call it:

```js
angular.app('app', ['gc.httpFactory']).factory('BillService', function(HttpFactory) {
  return HttpFactory.create({
    // options here
  }, {
    findOne: {
      url: '/api/bills/:id'
    }
  }
});

// called like so:
BillService.findOne({ params: { id: 2 } });
```

If a method makes a `POST` and expects data, pass in a `data` object:

```js
angular.app('app', ['gc.httpFactory']).factory('BillService', function(HttpFactory) {
  return HttpFactory.create({
    // options here
  }, {
    create: {
      url: '/api/bills/'
    }
  }
});

// called like so:

BillService.create({ data: {...} });
```

## Interceptors

Our support for interceptors builds on top of what `$http` supports.

Request interceptors can be synchronous or asynchronous and, unlike `$http`, you can pass in an array. Make sure each interceptor function returns either a single value or a promise:

```js
angular.app('app', [
  'gc.httpFactory',
  'gc.service.user'
]).factory('BillService', function(HttpFactory, UserService) {
  var BillHttp = HttpFactory.create({
    url: '/api/bills/:id',
    cache: true,
    interceptor: {
      request: [
        // this interceptor is sync
        function(request) {
          request.headers['X-Foo'] = 2;
          return request;
        },
        // this interceptor is async
        function(request) {
          return UserService.get().then(function(user) {
            request.headers['X-User-Id'] = user.id;
            return request;
          });
        }
      ]
    }
  }, {
    find: { method: 'GET' }
  });

  return BillHttp;
});
```

Interceptors will be executed one after the other in series, in the order they are passed in. Even if they are async, it will wait for the previous interceptor to resolve before executing the next one.
