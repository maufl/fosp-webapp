define(['knockout'], function(ko) {
ko.bindingHandlers.debug = {
  update: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor())
    console.debug(value)
  }
}
})
