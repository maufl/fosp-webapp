require.config({
  paths: {
    jquery: 'jquery-2.0.3.min',
    EventEmitter: 'EventEmitter.min',
    bootstrap: 'bootstrap.min',
    knockout: 'knockout-2.3.0',
    moment: 'moment.min'
  },
  shim: {
    bootstrap: {
      deps: ['jquery'],
      exports: 'jquery'
    }
  }
})
require(['jquery', 'bootstrap', 'knockout', 'ko/time-helper', 'vm/fosp-client'], function($, b, ko, helper, FospClient) {
  console.level = 'info'
  ko.applyBindings(new FospClient());
})
