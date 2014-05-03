define(['knockout'], function(ko) {
ko.bindingHandlers.tab = {
  init: function(element, valueAccessor) {
    $(element).click(function(e) {
      e.preventDefault()
      $(this).tab('show')
    })
  }
}
})
