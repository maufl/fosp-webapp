define(['knockout', 'jquery.pulse'], function(ko) {
ko.bindingHandlers.on = {
  init: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor()), emitter = value.emitter, event = value.event, pulse = value.pulse
    if (typeof emitter.on !== 'function')
      console.error('Can not attach listener because "on" is not a function')
    if (typeof pulse !== 'object' || pulse === null)
      return
    value.emitter.on(event, function() {
      $(element).pulse(pulse, {duration: 1000})
    })
  }
}
})

