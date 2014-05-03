require.config({
  paths: {
    jquery: 'jquery-2.0.3.min',
    EventEmitter: 'EventEmitter.min',
    bootstrap: 'bootstrap',
    knockout: 'knockout-2.3.0',
    moment: 'moment.min',
    'jquery.pulse': 'jquery.pulse',
    'fosp': '../node_modules/fosp/lib',
    'filesaver': 'FileSaver'
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
require(['jquery', 'bootstrap', 'knockout', 'ko/time-helper', 'vm/fosp-client', 'ko/popover', 'ko/debug', 'ko/on', 'ko/3-state-checkbox', 'ko/mouse-events', 'ko/mux-select', 'ko/key-events', 'ko/dnd', 'ko/tabs'], function($, b, ko, helper, FospClient) {
  console.level = 'info';
  $('script[data-template-src]').each(function(i,e) {
    $.get($(e).data('templateSrc'), function(tmpl) {
      $(e).html(tmpl)
    })
  })
  ko.applyBindings(new FospClient());
})
