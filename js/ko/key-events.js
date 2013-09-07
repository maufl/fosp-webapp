define(['knockout', 'jquery'], function(ko, $) {

  ko.bindingHandlers.key = {
    init: function(element, optionsAccessor, allBindingsAccessor, viewModel) {
      var options = ko.unwrap(optionsAccessor()), code = options.code, event = options.event, callback = options.callback, allBindings = ko.unwrap(allBindingsAccessor())
      if (typeof callback !== 'function') {
        console.log('Tried to setup key event binding for non-function!')
        return
      }
      $(element).on('key'+event, function(e) {
        if (e.which !== code)
          return
        if (typeof allBindings.value === 'function')
          allBindings.value($(element).val())
        callback()
      })
    }
  }
})
