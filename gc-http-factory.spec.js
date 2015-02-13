'use strict';

describe('HttpFactory', function(){
  beforeEach(module('gc.httpFactory'));

  var HttpFactory, $httpBackend, $rootScope, callback, $q;

  beforeEach(inject(function ($injector) {
    HttpFactory = $injector.get('HttpFactory');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    callback = jasmine.createSpy();
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  function factory(configDefaults, actions) {
    return HttpFactory.create(configDefaults, actions);
  }

  function queryFactory(url, configDefaults, actions) {
    actions = _.extend({
      query: {
        method: 'GET'
      },
      get: {
        method: 'GET'
      },
      save: {
        method: 'POST'
      }
    }, actions);

    var query = factory(_.extend({
      url: url
    }, configDefaults), actions);
    var queryFn = query.query;

    // Poor mans decorator
    query.query = function(config) {
      var resp;
      queryFn.call(query, config).then(function(responseData) {
        resp = responseData;
      });
      $httpBackend.flush();
      return resp;
    };

    return query;
  }

  describe('create', function() {
    it('should build actions', function() {
      var actions = factory({
        get: {
          method: 'GET'
        },
        save: {
          method: 'POST'
        }
      });

      expect(actions).toEqual(jasmine.any(Object));
      expect(actions.get).toEqual(jasmine.any(Function));
      expect(actions.save).toEqual(jasmine.any(Function));
    });

    describe('config', function() {
      afterEach(function() {
        $httpBackend.flush();
      });

      it('configDefaults', function() {
        $httpBackend.expectGET('/test').respond(200);

        var http = factory({
          url: '/test'
        }, {
          find: { method: 'GET' }
        });

        http.find();
      });

      describe('actions config', function () {
        var http;
        beforeEach(function () {
          http = factory({
            find: { method: 'GET', url: '/other' },
          });
        });

        it('action default', function() {
          $httpBackend.expectGET('/other').respond(200);
          http.find();
        });

        it('action method', function() {
          $httpBackend.expectGET('/some').respond(200);
          http.find({
            url: '/some'
          });
        });

        it('overwrites action config', function() {
          $httpBackend.expectGET('/other?page=1').respond(200);
          $httpBackend.expectGET('/other?status=active').respond(200);
          $httpBackend.expectGET('/what/api').respond(200);
          http.find({
            params: {
              page: 1
            }
          });
          http.find({
            params: {
              status: 'active'
            }
          });
          http.find({
            url: '/what/api'
          });
        });
      });
    });

    describe('interceptor', function() {
      function syncSetBananas(config) {
        config.headers = config.headers || {};
        config.headers['X-Bananas'] = 'yus';
        return config;
      }

      function syncSetPineapples(config) {
        config.headers = config.headers || {};
        config.headers['X-Pineapples'] = 'nope';
        return config;
      }

      function asyncSetBananas(config) {
        var deferred = $q.defer();

        config.headers = config.headers || {};
        config.headers['X-Bananas'] = 'yus';

        deferred.resolve(config);
        return deferred.promise;
      }

      function asyncSetPineapples(config) {
        var deferred = $q.defer();

        config.headers = config.headers || {};
        config.headers['X-Pineapples'] = 'nope';

        deferred.resolve(config);
        return deferred.promise;
      }

      describe('given one interceptor', function() {
        describe('which is synchronous', function() {
          it('intercepts request', function() {
            $httpBackend.expectGET('', {
              'X-Bananas': 'yus',
              'Accept':'application/json, text/plain, */*'
            }).respond(200);

            factory({
              find: { method: 'GET', interceptor: { request: syncSetBananas } }
            }).find();

            $httpBackend.flush();
          });
        });

        describe('which is asynchronous', function() {
          it('intercepts request', function() {
            $httpBackend.expectGET('', {
              'X-Bananas': 'yus',
              'Accept':'application/json, text/plain, */*'
            }).respond(200);

            factory({
              find: { method: 'GET', interceptor: { request: asyncSetBananas } }
            }).find();

            $httpBackend.flush();
          });
        });
      });

      describe('given multiple interceptors', function() {
        describe('which are both synchronous', function() {
          it('intercepts request', function() {
            $httpBackend.expectGET('', {
              'X-Bananas': 'yus',
              'X-Pineapples': 'nope',
              'Accept':'application/json, text/plain, */*'
            }).respond(200);

            var interceptors = [syncSetBananas, syncSetPineapples];

            factory({
              find: { method: 'GET', interceptor: { request: interceptors } }
            }).find();

            $httpBackend.flush();
          });

          it('runs the interceptors in the order they were passed', function() {
            $httpBackend.expectGET('', {
              'X-Bananas': 'nope',
              'Accept':'application/json, text/plain, */*'
            }).respond(200);

            var interceptors = [syncSetBananas, function syncResetBananas(config) {
              config.headers['X-Bananas'] = 'nope';
              return config;
            }];

            factory({
              find: { method: 'GET', interceptor: { request: interceptors } }
            }).find();

            $httpBackend.flush();
          });
        });

        describe('which are both asynchronous', function() {
          it('intercepts request', function() {
            $httpBackend.expectGET('', {
              'X-Bananas': 'yus',
              'X-Pineapples': 'nope',
              'Accept':'application/json, text/plain, */*'
            }).respond(200);

            var interceptors = [asyncSetBananas, asyncSetPineapples];

            factory({
              find: { method: 'GET', interceptor: { request: interceptors } }
            }).find();

            $httpBackend.flush();
          });
        });

        describe('which are mixed synchronous and asynchronous', function() {
          it('intercepts request', function() {
            $httpBackend.expectGET('', {
              'X-Bananas': 'yus',
              'X-Pineapples': 'nope',
              'Accept':'application/json, text/plain, */*'
            }).respond(200);

            var interceptors = [syncSetBananas, asyncSetPineapples];

            factory({
              find: { method: 'GET', interceptor: { request: interceptors } }
            }).find();

            $httpBackend.flush();
          });
        });
      });

      it('intercepts response', function() {
        var resp;
        $httpBackend.expectGET('').respond(200, { value: 1 });

        factory({
          find: {
            method: 'GET',
            interceptor: {
              response: function (response) {
                response.data.value += 1;
                return response.data;
              }
            }
          }
        }).find().then(function(response) {
          resp = response;
        });

        $httpBackend.flush();

        expect(resp.value).toEqual(2);
      });

      it('intercepts responseError', function() {
        var resp;
        $httpBackend.expectGET('').respond(500, { value: 1 });

        factory({
          find: {
            method: 'GET',
            interceptor: {
              responseError: function (responseError) {
                responseError.data.value += 1;
                return $q.reject(responseError.data);
              }
            }
          }
        }).find().catch(function(rejection) {
          resp = rejection;
        });

        $httpBackend.flush();

        expect(resp.value).toEqual(2);
      });
    });
  });

  describe('request', function() {
    it('passes unchanged config to interceptor', function() {
      $httpBackend.expectGET('/test?enabled=true').respond(500);
      $httpBackend.expectGET('/new?enabled=true').respond(200);

      var config = {
        method: 'GET',
        url: '/test',
        params: {
          enabled: true
        },
        interceptor: {
          responseError: function(response) {
            response.config.url = '/new';
            return HttpFactory.request(response.config)
          }
        }
      };

      HttpFactory.request(config);

      $httpBackend.flush();
    });
  });

  it('should ignore slashes of undefinend parameters', function() {
    var actions = queryFactory('/Path/:a/:b/:c');

    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/0').respond('{}');
    $httpBackend.when('GET', '/Path/false').respond('{}');
    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/').respond('{}');
    $httpBackend.when('GET', '/Path/1').respond('{}');
    $httpBackend.when('GET', '/Path/2/3').respond('{}');
    $httpBackend.when('GET', '/Path/4/5').respond('{}');
    $httpBackend.when('GET', '/Path/6/7/8').respond('{}');

    actions.get({ params: {} });
    actions.get({ params: {a:0} });
    actions.get({ params: {a:false} });
    actions.get({ params: {a:null} });
    actions.get({ params: {a:undefined} });
    actions.get({ params: {a:''} });
    actions.get({ params: {a:1} });
    actions.get({ params: {a:2, b:3} });
    actions.get({ params: {a:4, c:5} });
    actions.get({ params: {a:6, b:7, c:8} });
  });

  it('leaves leading slashes of undefinend params', function() {
    var actions = queryFactory('/Path/:a.foo/:b.bar/:c.baz');

    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/0.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/false.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/1.foo/.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/2.foo/3.bar.baz').respond('{}');
    $httpBackend.when('GET', '/Path/4.foo/.bar/5.baz').respond('{}');
    $httpBackend.when('GET', '/Path/6.foo/7.bar/8.baz').respond('{}');

    actions.get({});
    actions.get({a:0});
    actions.get({a:false});
    actions.get({a:null});
    actions.get({a:undefined});
    actions.get({a:''});
    actions.get({a:1});
    actions.get({a:2, b:3});
    actions.get({a:4, c:5});
    actions.get({a:6, b:7, c:8});
  });

  it('should support escaping colons in url template', function() {
    var actions = queryFactory('http://localhost\\:8080/Path/:a/\\:' +
      'stillPath/:b');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/:stillPath/bar')
      .respond();
    actions.get({ params: {a: 'foo', b: 'bar'} });
    $httpBackend.flush();
  });

  it('should support an unescaped url', function() {
    var actions = queryFactory('http://localhost:8080/Path/:a');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo').respond();
    actions.get({ params: {a: 'foo'} });
    $httpBackend.flush();
  });

  it('should correctly encode url params', function() {
    var actions = queryFactory('/Path/:a');

    $httpBackend.expect('GET', '/Path/foo%231').respond('{}');
    $httpBackend.expect('GET', '/Path/doh!@foo?bar=baz%231').respond('{}');

    actions.get({ params: {a: 'foo#1'} });
    actions.get({ params: {a: 'doh!@foo', bar: 'baz#1'} });
    $httpBackend.flush();
  });

  it('should not encode @ in url params', function() {
    //encodeURIComponent is too agressive and doesn't follow
    //http://www.ietf.org/rfc/rfc3986.txt
    //with regards to the character set (pchar) allowed in path segments
    //so we need this test to make sure that we don't over-encode the params
    //and break stuff like buzz api which uses @self

    var actions = queryFactory('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh@fo%20o?!do%26h=g%3Da+h&:bar=$baz@1')
     .respond('{}');
    actions.get({
      params: {a: 'doh@fo o', ':bar': '$baz@1', '!do&h': 'g=a h'}
    });
    $httpBackend.flush();
  });

  it('should encode array params', function() {
    var actions = queryFactory('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz1&bar=baz2').respond('{}');
    actions.get({ params: {a: 'doh&foo', bar: ['baz1', 'baz2']} });
    $httpBackend.flush();
  });

  it('should not encode string "null" to "+" in url params', function() {
    var actions = queryFactory('/Path/:a');
    $httpBackend.expect('GET', '/Path/null').respond('{}');
    actions.get({ params: {a: 'null'} });
    $httpBackend.flush();
  });

  it('should allow relative paths in resource url', function () {
    var actions = queryFactory(':relativePath');
    $httpBackend.expect('GET', 'data.json').respond('{}');
    actions.get({ params: { relativePath: 'data.json' } });
    $httpBackend.flush();
  });

  it('should handle + in url params', function () {
    var url = '/api/myapp/:my?from=:from&to=:to&len=:len';
    var exp = '/api/myapp/pear+apple?from=2012-04-01&to=2013&len=3';
    var actions = queryFactory(url);
    $httpBackend.expect('GET', exp).respond('{}');
    actions.get({
      params: { my: 'pear+apple', from: '2012-04-01', to: '2013', len: 3  }
    });
    $httpBackend.flush();
  });

  it('should encode & in url params', function() {
    var actions = queryFactory('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz%261').respond('{}');
    actions.get({ params: {a: 'doh&foo', bar: 'baz&1'} });
    $httpBackend.flush();
  });

  it('should build resource with default param', function() {
    $httpBackend.expect('GET', '/Order/123/Line/456.visa?minimum=0.05')
    .respond({id: 'abc'});
    var LineItem = queryFactory('/Order/:orderId/Line/:id:verb', {
      params: {orderId: '123', verb:'.visa', minimum: 0.05}
    });
    var item = LineItem.query({ params: {id: 456} });
    expect(item).toEqual({id:'abc'});
  });

  it('should not pass default params between actions', function() {
    var actions = queryFactory('/Path', {}, {
      get: {method: 'GET', params: {objId: '1'}},
      perform: {method: 'GET'}
    });

    $httpBackend.expect('GET', '/Path?objId=1').respond('{}');
    $httpBackend.expect('GET', '/Path').respond('{}');

    actions.get({});
    actions.perform({});

    $httpBackend.flush();
  });

  it('should not throw TypeError on null default params', function() {
    $httpBackend.expect('GET', '/Path').respond('{}');
    var actions = queryFactory('/Path', {params: {param: null} });
    expect(function() {
      actions.get({});
    }).not.toThrow();
  });

  it('should handle multiple params with same name', function() {
    var actions = queryFactory('/:id/:id');
    $httpBackend.expect('GET', '/1/1').respond(200);
    actions.get({ params: { id:1 } });
    $httpBackend.flush();
  });

  describe('suffix param', function() {
    describe('query', function() {
      it('should add a suffix', function() {
        $httpBackend.expect('GET', '/users.json')
          .respond([{id: 1, name: 'user1'}]);

        var UserService = queryFactory('/users/:id.json');

        var user = UserService.query();
        expect(user).toEqual([{id: 1, name: 'user1'}]);
      });

      it('should not require it if not provided', function(){
        $httpBackend.expect('GET', '/users.json')
          .respond([{id: 1, name: 'user1'}]);
        var UserService = queryFactory('/users.json');
        var user = UserService.query();
        expect(user).toEqual([{id: 1, name: 'user1'}]);
      });

      it('should work when query params are supplied', function() {
        $httpBackend.expect('GET', '/users.json?red=blue')
          .respond([{id: 1, name: 'user1'}]);
        var UserService = queryFactory('/users/:user_id.json');
        var user = UserService.query({
          params: { red: 'blue' }
        });
        expect(user).toEqual([{id: 1, name: 'user1'}]);
      });

      it('works when query params are set and the format is def', function() {
        $httpBackend.expect('GET', '/users.json?red=blue')
          .respond([{id: 1, name: 'user1'}]);
        var UserService = queryFactory('/users/:user_id.:format', {
          params: { format: 'json'}
        });
        var user = UserService.query({
          params: { red: 'blue' }
        });
        expect(user).toEqual([{id: 1, name: 'user1'}]);
      });

      it('should work with the action is overriden', function(){
        $httpBackend.expect('GET', '/users.json')
          .respond([{id: 1, name: 'user1'}]);
        var UserService = queryFactory('/users/:user_id', {}, {
          query: {
            method: 'GET',
            url: '/users/:user_id.json'
          }
        });
        var user = UserService.query();
        expect(user).toEqual([ {id: 1, name: 'user1'} ]);
      });

      it('should add them to the id', function() {
        $httpBackend.expect('GET', '/users/1.json')
          .respond({id: 1, name: 'user1'});
        var UserService = queryFactory('/users/:user_id.json');
        var user = UserService.query({
          params: { user_id: 1 }
        });
        expect(user).toEqual({id: 1, name: 'user1'});
      });

      it('should work when an id and query params are supplied', function() {
        $httpBackend.expect('GET', '/users/1.json?red=blue')
          .respond({id: 1, name: 'user1'});
        var UserService = queryFactory('/users/:user_id.json');
        var user = UserService.query({
          params: { user_id: 1, red: 'blue' }
        });
        expect(user).toEqual({id: 1, name: 'user1'});
      });

      it('should work when the format is a param', function() {
        $httpBackend.expect('GET', '/users/1.json?red=blue')
          .respond({id: 1, name: 'user1'});
        var UserService = queryFactory('/users/:user_id.:format', {
          params: {
            format: 'json'
          }
        });
        var user = UserService.query({
          params: { user_id: 1, red: 'blue' }
        });
        expect(user).toEqual({id: 1, name: 'user1'});
      });

      it('should work with the action is overriden', function(){
        $httpBackend.expect('GET', '/users/1.json')
          .respond({id: 1, name: 'user1'});
        var UserService = queryFactory('/users/:user_id', {}, {
          query: {
            method: 'GET',
            url: '/users/:user_id.json'
          }
        });
        var user = UserService.query({
          params: { user_id: 1 }
        });
        expect(user).toEqual({id: 1, name: 'user1'});
      });
    });

    describe('save', function() {
      it('should append the suffix', function() {
        var user = {id: 123, name: 'user1'};
        $httpBackend.expect('POST', '/users.json', '{"name":"user1"}')
          .respond(user);
        var UserService = queryFactory('/users/:id.json');
        UserService.save({data: {name: 'user1'} }).then(callback);
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(callback).toHaveBeenCalled();
        expect(callback.calls.mostRecent().args[0]).toEqual(user);
      });

      it('should append when an id is supplied', function() {
        var user = {id: 123, name: 'newName'};
        $httpBackend.expect('POST', '/users/123.json',
          '{"id":123,"name":"newName"}'
        ).respond(user);
        var UserService = queryFactory('/users/:id.json');
        UserService.save({
          params: {id: 123},
          data: {id: 123, name: 'newName'}
        }).then(callback);
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(callback).toHaveBeenCalled();
        expect(callback.calls.mostRecent().args[0]).toEqual(user);
      });

      it('appends when id is supplied and the format is a param', function() {
        var user = {id: 123, name: 'newName'};
        $httpBackend.expect('POST', '/users/123.json',
          '{"id":123,"name":"newName"}'
        ).respond(user);
        var UserService = queryFactory('/users/:id.:format', {
          params: { format: 'json'}
        });
        UserService.save({
          params: {id: 123},
          data: {id: 123, name: 'newName'}
        }).then(callback);
        expect(callback).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(callback).toHaveBeenCalled();
        expect(callback.calls.mostRecent().args[0]).toEqual(user);
      });
    });

    describe('escaping /. with /\\.', function() {
      it('should work with query()', function() {
        $httpBackend.expect('GET', '/users/.json').respond();
        queryFactory('/users/\\.json').query();
      });
      it('should work with save()', function() {
        $httpBackend.expect('POST', '/users/.json').respond();
        queryFactory('/users/\\.json').save({});
      });
    });
  });

  describe('action-level url override', function() {
    it('should support overriding url template with static url', function() {
      $httpBackend.expect('GET', '/override-url?type=Customer&typeId=123')
        .respond({id: 'abc'});
      var TypeItem = queryFactory('/:type/:typeId', {
        params: { type: 'Order'}
      }, {
        get: {
          method: 'GET',
          params: {type: 'Customer'},
          url: '/override-url'
        }
      });
      TypeItem.get({
        params: {typeId: 123}
      });
      $httpBackend.flush();
    });


    describe('supports overriding url with a new url', function() {
      it('url param in action, param ending the string', function() {
        $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});
        var TypeItem = queryFactory('/foo/:type', {
          parmas: { type: 'Order'}
        }, {
          get: {
            method: 'GET',
            params: {type: 'Customer'},
            url: '/:type/:typeId'
          }
        });
        TypeItem.get({ params: {typeId: 123} });
        $httpBackend.flush();
      });

      it('url param in action, param not ending the string', function() {
        $httpBackend.expect('GET', '/Customer/123/pay').respond({id: 'abc'});
        var TypeItem = queryFactory('/foo/:type', {
          params: { type: 'Order'}
        }, {
          get: {
            method: 'GET',
            params: { type: 'Customer' },
            url: '/:type/:typeId/pay'
          }
        });
        TypeItem.get({params: { typeId: 123} });
        $httpBackend.flush();
      });
    });
  });
});
