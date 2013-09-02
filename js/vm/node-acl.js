define(['jquery', 'knockout', 'knockout.mapping', 'EventEmitter'], function($, ko, map, EventEmitter) {

  var toCamelCase = function(input) {
    return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
  }

  var toSpinalCase = function(input) {
    return input.replace(/([A-Z])/g, function(match, group) {
      return '-' + group.toLowerCase();
    })
  }

  var aclTemplate = {
    user: '',
    dataRead: 'inherit',
    dataWrite: 'inherit',
    aclRead: 'inherit',
    aclWrite: 'inherit',
    subscriptionsRead: 'inherit',
    subscriptionsWrite: 'inherit',
    childrenRead: 'inherit',
    childrenWrite: 'inherit',
    childrenDelete: 'inherit'
  }

  var NodeACL = function(con, path) {
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

  NodeACL.prototype = Object.create(EventEmitter.prototype)

  NodeACL.prototype.load = function(acl) {
    var self = this
    this.all.removeAll()
    for (user in acl) {
      if (acl[user] === null)
        continue
      var newACL = map.fromJS(aclTemplate)
      newACL.user(user)
      for (var i=0; i<acl[user].length; i++) {
        var right = acl[user][i]
        if (right.match(/^not-/)) {
          var negative = toCamelCase(right.substring(4))
          newACL[negative]('no')
        }
        else {
          var positive = toCamelCase(right)
          newACL[positive]('yes')
        }
      }
      // setup notifications
      for (key in newACL)
        if (!key.match(/^__/))
          newACL[key].subscribe(function() { self.emit('changed') })
      this.all.push(newACL)
    }
    this.checksum = this.makeChecksum()
  }

  NodeACL.prototype.store = function() {
    var acl = {}
    for (var i=0; i<this.all().length; i++) {
      var rights = this.all()[i]
      var user = rights.user()
      acl[user] = []
      if (rights._destroy) {
        acl[user] = null
        continue
      }
      for (key in rights) {
        if (key === 'user' || key.match(/^__/))
          continue
        if (rights[key]() === 'yes')
          acl[user].push(toSpinalCase(key))
        if (rights[key]() === 'no')
          acl[user].push('not-' + toSpinalCase(key))
      }
    }
    return acl
  }

  NodeACL.prototype.makeChecksum = function() {
    return JSON.stringify(this.store())
  }

  NodeACL.prototype.writeBack = function() {
    var self = this
    if (this.checksum === this.makeChecksum()) {
      console.log('Nothing has changed')
      return
    }
    this.writeBackTimeout = null
    this.con.sendUpdate(this.path, {}, { acl: this.store() }).on('succeded', function() {
      self.checksum = self.makeChecksum()
      console.log('successfully updated acl')
    }).on('failed', function(resp) {
      console.log('update failed ' + resp.status + ' :: ' + resp.body)
    })
  }

  NodeACL.prototype.add = function() {
    var self = this, user = this.newUser()
    if (!user.match(/.*@.*\..*/))
      return
    var newACL = map.fromJS(aclTemplate)
    newACL.user(user)
    // setup notifications
    for (key in newACL)
      if (!key.match(/^__/))
        newACL[key].subscribe(function() { self.emit('changed') })
    this.all.push(newACL)
    this.newUser('')
  }

  NodeACL.prototype.remove = function(acl) {
    this.all.destroy(acl)
    this.emit('changed')
  }

  return NodeACL
})
