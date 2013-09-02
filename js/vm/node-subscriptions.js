define(['knockout', 'knockout.mapping', 'EventEmitter'], function(ko, map, EventEmitter) {

  var subscriptionTemplate = {
    user: '',
    created: false,
    updated: false,
    deleted: false,
    depth: -1
  }

  var NodeSubscriptions = function(con, path) {
    var self = this
    this.con = con
    this.path = path
    this.all = ko.observableArray([])
    this.writeBackTimeout = null
    this.newUser = ko.observable('')

    this.on('changed', function() {
      if (self.writeBackTimeout)
        clearTimeout(self.writeBackTimeout)
      self.writeBackTimeout = setTimeout(self.writeBack.bind(self), 3000)
    })
  }

  NodeSubscriptions.prototype = Object.create(EventEmitter.prototype)

  NodeSubscriptions.prototype.load = function(subscriptions) {
    var self = this
    this.all.removeAll()
    for (user in subscriptions) {
      var sub = subscriptions[user]
      if (sub === null)
        continue
      var newSubs = map.fromJS(subscriptionTemplate)
      newSubs.user(user)
      for (var i=0; i<sub.events.length; i++)
        newSubs[sub.events[i]](true)
      newSubs.depth(sub.depth)
      // Subscribe to updates
      for (key in newSubs)
        if (!key.match(/^__/))
          newSubs[key].subscribe(function(){self.emit('changed')})

      this.all.push(newSubs)
    }
    this.checksum = this.makeChecksum()
  }

  NodeSubscriptions.prototype.store = function() {
    var all = this.all(), subscriptions = {}
    for (var i=0; i<all.length; i++) {
      var sub = all[i], user = sub.user()
      if (sub._destroy) {
        subscriptions[user] = null
        continue
      }
      sub.depth(parseInt(sub.depth(), 10))
      if (sub.depth() < -1)
        sub.depth(-1)
      subscriptions[user] = {
        events: [],
        depth: sub.depth()
      }
      if (sub.created())
        subscriptions[user].events.push('created')
      if (sub.updated())
        subscriptions[user].events.push('updated')
      if (sub.deleted())
        subscriptions[user].events.push('deleted')
    }
    return subscriptions
  }

  NodeSubscriptions.prototype.add = function() {
    var self = this, user = this.newUser()
    console.log('adding user ' + user)
    if (!user.match(/.*@.*\..*/))
      return
    var newSubs = map.fromJS(subscriptionTemplate)
    newSubs.user(user)
    // setup notifications
    for (key in newSubs)
      if (!key.match(/^__/))
        newSubs[key].subscribe(function() { self.emit('changed') })
    this.all.push(newSubs)
    this.newUser('')
  }

  NodeSubscriptions.prototype.remove = function(subscriptions) {
    this.all.destroy(subscriptions)
    this.emit('changed')
  }

  NodeSubscriptions.prototype.makeChecksum = function() {
    return JSON.stringify(this.store())
  }

  NodeSubscriptions.prototype.writeBack = function() {
    var self = this
    if (this.checksum === this.makeChecksum()) {
      console.log('Nothing has changed')
      console.log(this.checksum)
      console.log(this.makeChecksum())
      return
    }
    this.writeBackTimeout = null
    this.con.sendUpdate(this.path, {}, { subscriptions: this.store() }).on('succeded', function() {
      self.checksum = self.makeChecksum()
      console.log('successfully updated subscriptions')
    }).on('failed', function(resp) {
      console.log('update failed ' + resp.status + ' :: ' + resp.body)
    })
  }


  return NodeSubscriptions
})
