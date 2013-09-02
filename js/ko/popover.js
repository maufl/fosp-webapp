define(['jquery', 'knockout'], function($, ko) {
var currentPopover = null
ko.bindingHandlers.popover = {
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    var content = null, options = ko.unwrap(valueAccessor()), templateId = options.template, title = options.title
    $(element).on('click', function(event) { event.stopPropagation(); $(element).popover('toggle') })
    $(element).on('shown.bs.popover', function(event) {
      ko.applyBindings(viewModel, content[0])
      if (currentPopover !== element) {
        $(currentPopover).popover('hide')
        currentPopover = element
      }
      $(element).addClass('selected')
      if (content)
        content.parent().parent().on('mouseleave', function(e) {
          $(element).popover('hide')
        })
    })
    $(element).on('hidden.bs.popover', function() {
      var data = $(element).data('bs.popover')
      if (data.$tip)
        data.$tip.remove()
      $(element).removeClass('selected')
    })
    var getContent = function() {
      content = $($('script#'+templateId).text())
      return content
    }
    //$(element).on('mouseleave', function(event) { $(element).popover('hide') })
    $(element).popover({
      html: true,
      placement: 'auto top',
      title: title,
      trigger: 'manual',
      container: 'body',
      content: getContent
    })
  }
}
})
