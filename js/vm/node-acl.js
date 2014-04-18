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

  var template = {
    dataRead: 'inherit',
    dataWrite: 'inherit',
    aclRead: 'inherit',
    aclWrite: 'inherit',
    subscriptionsRead: 'inherit',
    subscriptionsWrite: 'inherit',
    childrenRead: 'inherit',
    childrenWrite: 'inherit',
    childrenDelete: 'inherit',
    attachmentRead: 'inherit',
    attachmentWrite: 'inherit'
  }
  var userTemplate = $.extend({}, template)
  userTemplate['user'] = ''
  var groupTemplate = $.extend({}, template)
  groupTemplate['group'] = ''

  var NodeACL = function(con, path) {
    var self = this
    this.con = con
    this.path = path
    this.users = ko.observableArray([])
    this.groups = ko.observableArray([])
    this.owner = ko.observable(null)
    this.others = ko.observable(null)
    this.writeBackTimeout = null
    this.newUser = ko.observable('')

    this.on('changed', function() {
      if (self.writeBackTimeout)
        clearTimeout(self.writeBackTimeout)
      self.writeBackTimeout = setTimeout(self.writeBack.bind(self), 3000)
    })
  }

  NodeACL.prototype = Object.create(EventEmitter.prototype)

  function mapPermissions(permissions) {
    var newPermissions = map.fromJS(template)
    if (typeof permissions.length !== 'number')
      return newPermissions
    for (var i=0; i<permissions.length; i++) {
      var right = permissions[i]
      if (right.match(/^not-/)) {
        var negative = toCamelCase(right.substring(4))
        newPermissions[negative]('no')
      }
      else {
        var positive = toCamelCase(right)
        newPermissions[positive]('yes')
      }
    }
    return newPermissions
  }

  NodeACL.prototype.subscribePermissions = function(permissions) {
    var self = this
    for (key in permissions)
      if (!key.match(/^__/))
        permissions[key].subscribe(function() { self.emit('changed') })
  }

  NodeACL.prototype.load = function(acl) {
    var self = this
    this.users.removeAll()
    if (typeof acl.owner === 'undefined') {
      this.owner(null)
    } else {
      this.owner(mapPermissions(acl.owner))
      this.subscribePermissions(this.owner())
    }
    if (typeof acl.others === 'undefined') {
      this.others(null)
    } else {
      this.others(mapPermissions(acl.others))
      this.subscribePermissions(this.others())
    }
    if (typeof acl.users === "object" && acl.users !== null) {
      for (user in acl.users) {
        if (acl.users[user] === null)
          continue
        var newACL = mapPermissions(acl.users[user])
        newACL['user'] = ko.observable(user)
        this.subscribePermissions(newACL)
        this.users.push(newACL)
      }
    }
    this.checksum = this.makeChecksum()
  }

  function reverseMapPermissions(permissions) {
    var newPermissions = []
    for (key in permissions) {
      if (key === 'user' || key === 'group' || key.match(/^__/))
        continue
      if (permissions[key]() === 'yes')
        newPermissions.push(toSpinalCase(key))
      if (permissions[key]() === 'no')
        newPermissions.push('not-' + toSpinalCase(key))
    }
    return newPermissions
  }

  NodeACL.prototype.store = function() {
    var acl = {owner: null, users: {}, groups: {}, others: null}
    if (this.owner() !== null)
      acl.owner = reverseMapPermissions(this.owner())
    for (var i=0; i<this.users().length; i++) {
      var rights = this.users()[i]
      var user = rights.user()
      if (rights._destroy) {
        acl.users[user] = null
      } else {
        acl.users[user] = reverseMapPermissions(rights)
      }
    }
    if (this.others() !== null)
      acl.others = reverseMapPermissions(this.others())
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
    this.con.sendUpdate(this.path, {}, { acl: this.store() }).on('succeeded', function() {
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
    var newACL = map.fromJS(userTemplate)
    newACL.user(user)
    this.subscribePermissions(newACL)
    this.users.push(newACL)
    this.newUser('')
  }

  NodeACL.prototype.addOwner = function() {
    if (this.owner() === null) {
      this.owner(map.fromJS(template))
      this.subscribePermissions(this.owner())
    }
  }

  NodeACL.prototype.addOthers = function() {
    if (this.others() === null) {
      this.others(map.fromJS(template))
      this.subscribePermissions(this.others())
    }
  }

  NodeACL.prototype.remove = function(acl) {
    this.users.destroy(acl)
    this.emit('changed')
  }

  return NodeACL
})
