define(['knockout'], function(ko) {

  var BuddyList = function() {
    this.all = ko.observableArray([])
    this.selected = ko.observable(null)
    this.newBuddy = ko.observable('')
    this.load()
  }

  BuddyList.prototype.select = function(buddy) {
    this.selected(buddy)
  }

  BuddyList.prototype.add = function(buddy) {
    this.all.push(buddy)
  }

  BuddyList.prototype.addBuddy = function() {
    var name = this.newBuddy()
    if (! name.match(/^.*@.*\..*/)) {
      console.log('Tried to add invalid user! ' + name)
      return
    }
    this.add(name)
    this.newBuddy('')
    this.store()
  }

  BuddyList.prototype.remove = function(buddy) {
    this.all.remove(buddy)
  }

  BuddyList.prototype.store = function() {
    if (typeof localStorage !== 'object' || typeof localStorage.setItem !== 'function')
      return
    localStorage.setItem('buddy-list', JSON.stringify(this.all()))
  }

  BuddyList.prototype.load = function() {
    if (typeof localStorage !== 'object' || typeof localStorage.setItem !== 'function')
      return
    try {
      buddyList = JSON.parse(localStorage.getItem('buddy-list'))
      if (Object.prototype.toString.call(buddyList) !== '[object Array]')
        buddyList = []
    }
    catch (e) {
      buddyList = []
    }
    this.all(buddyList)
  }

  return BuddyList
})
