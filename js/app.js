require.config({
  paths: {
    jquery: 'jquery-2.0.3.min',
    EventEmitter: 'EventEmitter.min',
    bootstrap: 'bootstrap',
    knockout: 'knockout-2.3.0',
    moment: 'moment.min',
    'jquery.pulse': 'jquery.pulse'
  },
  shim: {
    bootstrap: {
      deps: ['jquery'],
      exports: 'jquery'
    },
    'jquery.pulse': {
      deps: ['jquery', 'jquery.color'],
      exports: 'jquery'
    },
    'jquery.color': {
      deps: ['jquery'],
      exports: 'jquery'
    }
  }
})
require(['jquery', 'bootstrap', 'knockout', 'ko/time-helper', 'vm/fosp-client', 'ko/popover', 'ko/debug', 'ko/on', 'ko/3-state-checkbox'], function($, b, ko, helper, FospClient) {
  console.level = 'info'
  ko.applyBindings(new FospClient());
})
