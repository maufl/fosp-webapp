define(['jquery','knockout'], function($, ko) {
ko.bindingHandlers.prettyTime = {
  update: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor())
    console.log('Value is: ' + value)
    if (value !== null && moment(value).isValid())
      $(element).text(moment(value).fromNow())
  }
}
})
