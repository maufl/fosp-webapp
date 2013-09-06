define(['jquery', 'knockout'], function($, ko) {
  ko.bindingHandlers.drop = {
    init: function(element, optionsAccessor) {
      var options = ko.unwrap(optionsAccessor()), callback = options.callback, preventDefault = (typeof options.preventDefault !== 'undefined')
      if (typeof callback !== 'function') {
        console.error('Tried to setup a drop binding but callback is not a function!')
        return
      }
      $(element).on('dragover', function(e) {
        e.stopPropagation()
        e.preventDefault()
      })
      $(element).on('drop', function(e) {
        e.stopPropagation()
        e.preventDefault()
        callback(e)
        return false
      })
    }
  },
  ko.bindingHandlers.dragenter = {
    init: function(element, optionsAccessor) {
      var options = ko.unwrap(optionsAccessor()), addClass = options.addClass, preventDefault = (typeof options.preventDefault !== 'undefined')
      $(element).on('dragenter', function(e) {
        if (preventDefault)
          e.preventDefault()
        $(element).addClass(addClass)
      })
    }
  },
  ko.bindingHandlers.dragleave = {
    init: function(element, optionsAccessor) {
      var options = ko.unwrap(optionsAccessor()), removeClass = options.removeClass, preventDefault = (typeof options.preventDefault !== 'undefined')
      $(element).on('dragleave', function(e) {
        if (preventDefault)
          e.preventDefault()
        $(element).removeClass(removeClass)
      })
    }
  }
  ko.bindingHandlers.dragover = {
    init: function(element, optionsAccessor) {
      var options = ko.unwrap(optionsAccessor()), preventDefault = (typeof options.preventDefault !== 'undefined')
      $(element).on('dragover', function(e) {
        if (preventDefault)
          e.preventDefault()
      })
    }
  }
})
