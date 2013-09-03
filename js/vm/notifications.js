define(['knockout', 'jquery'], function(ko, $) {

  var _default = null

  var _notification = {
    persistent: false,
    timeout: 4000,
    timeoutHandle: null,
    type: 'info',
    icon: null,
    title: null,
    text: ''
  }

  var Notifications = function() {
    this.all = ko.observableArray([]);
  }


  Notifications.prototype.add = function(ntf) {
    var self = this
    if (typeof ntf !== 'object')
      return
    ntf = $.extend({}, _notification, ntf)
    if (! ntf.persistent)
      ntf.timeoutHandle = setTimeout(function() { self.all.remove(ntf) }, ntf.timeout)
    this.all.push(ntf)
  }

  Notifications.prototype.remove = function(ntf) {
    if (ntf.timeoutHandler)
      clearTimeout(ntf.timeoutHandler)
    this.all.remove(ntf)
  }

  Notifications.prototype.stopTimeout = function(ntf) {
    var self = this
    if (ntf.persistent)
      return
    if (ntf.timeoutHandle) {
      clearTimeout(ntf.timeoutHandle)
      ntf.timeoutHandle = null
    }
  }
  Notifications.prototype.startTimeout = function(ntf) {
    var self = this
    if (ntf.persistent)
      return
    if (ntf.timeoutHandle)
      clearTimeout(ntf.timeoutHandle)
    ntf.timeoutHandle = setTimeout(function() { self.all.remove(ntf) }, ntf.timeout)
  }

  Notifications.prototype.fadeOut = function(element, index, notification) {
    $(element).fadeOut('fast', function() { $(element).detach() })
  }

  Notifications.getDefault = function() {
    if (_default === null)
      _default = new Notifications();
    return _default
  }

  return Notifications
})
