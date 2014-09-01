# ngHttpFactory

A module that wraps Angular's `$http` for easy creation of services that talk to an API.

```
bower install gocardless/ng-http-factory
```

## Example

```js
angular.app('app', [
  'gc.httpFactory'
]).factory('BillService', function(HttpFactory) {
  var BillHttp = HttpFactory.create({
    method: 'GET',
    url: '/api/bills/:id'
  }, {
    find: {
      interceptor: {
        response: function(response) {
          return response.data;
        },
        responseError: function(responseError) {
          return responseError.data;
        }
      }
    },
    entries: {
      method: 'GET',
      url: '/api/submissions/:id/entries'
    }
  });

  return BillHttp;
});

// in a controller
BillHttp.find({params: { id: 1 }})
  .then(function(responseData) {
    // do something with data
  });
 //=> GET /api/bills/1
```

## Usage

Any of the configuration you can pass to `$http`, you can pass to the `create` method of `HttpFactory`.

## Interceptors

`HttpFactory` supports both async and sync interceptors, which is useful if you need an interceptor to make a request to get some data. Just return either a value or a promise in an interceptor, and `HttpFactory` takes care of the rest.
