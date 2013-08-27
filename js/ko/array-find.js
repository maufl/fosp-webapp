define(['knockout'], function(ko) {
  ko.observableArray.fn.find = function(filter) {
    var all = this()
    for (var i=0; i<all.length; i++) {
      var current = all[i]
      if (filter(current))
        return current
    }
    return null
  }
})
