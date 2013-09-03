define(['knockout', 'jquery'], function(ko, $) {

ko.bindingHandlers.hover = {
  init: function(element, callbackAccessor, allBindingsAccessor, viewModel) {
    var callback = ko.unwrap(callbackAccessor())
    if (typeof callback !== 'function') {
      console.log('Hover binding used but argument is not a function!')
      return
    }
    $(element).on('mouseover', function() {
      callback(viewModel)
    })
  }
}
ko.bindingHandlers.mouseenter = {
  init: function(element, callbackAccessor, _, viewModel) {
    var callback = ko.unwrap(callbackAccessor())
    if (typeof callback !== 'function') {
      console.log('Mouseenter binding used but argument is not a function!')
      return
    }
    $(element).on('mouseenter', function() {
      callback(viewModel)
    })
  }
}
ko.bindingHandlers.mouseleave = {
  init: function(element, callbackAccessor, _, viewModel) {
    var callback = ko.unwrap(callbackAccessor())
    if (typeof callback !== 'function') {
      console.log('Mouseleave binding used but argument is not a function!')
      return
    }
    $(element).on('mouseleave', function() {
      callback(viewModel)
    })
  }
}
})
