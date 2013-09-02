define(['knockout'], function(ko) {
ko.bindingHandlers['3-state-checkbox'] = {
  init: function(element, optionsAccessor) {
    var options = ko.unwrap(optionsAccessor()), states = options.states, target = options.target
    var update = function(value) {
      if (states.indexOf(value) === 0) {
        $(element).prop('checked', true)
        $(element).prop('indeterminate', false)
      }
      if (states.indexOf(value) === 1) {
        $(element).prop('checked', false)
        $(element).prop('indeterminate', false)
      }
      if (states.indexOf(value) === 2) {
        $(element).prop('checked', false)
        $(element).prop('indeterminate', true)
      }
    }
    update(target())
    $(element).click(function(e) {
      var value = target()
      e.preventDefault()
      e.stopPropagation()
      if (states.indexOf(value) === 0)
        target(states[1])
      else if (states.indexOf(value) === 1)
        target(states[2])
      else
        target(states[0])
      setTimeout(function() { update(target()) }, 10);
    })
  }
}
})

