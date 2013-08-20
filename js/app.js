require.config({
  paths: {
    jquery: 'jquery-2.0.3.min',
    EventEmitter: 'EventEmitter.min'
  }
})
require(['fosp/client'], function(Client) {
  window.fospClient = new Client({host: 'mighty-maufl.local'});
})
