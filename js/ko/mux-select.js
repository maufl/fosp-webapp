define(['knockout', 'jquery'], function(ko, $) {

  ko.bindingHandlers.muxSelect = {
    init: function(element, selectorAccessor) {
      var selector = ko.unwrap(selectorAccessor())
      $(element).on('click', selector, function(e) {
        $(element).find(selector).removeClass('selected')
        $(e.currentTarget).addClass('selected')
      })
    }
  }
})
