define(['fosp/logger', 'fosp/uri', 'knockout', 'vm/node-collection', 'vm/node-acl', 'vm/node-subscriptions', 'vm/notifications', 'moment', 'EventEmitter'],
    function(logger, URI, ko, NodeCollection, NodeAcl, NodeSubscriptions, Notifications, moment, EventEmitter) {
  var L = logger.forFile('vm/node')
  var N = Notifications.getDefault()

  var stop = function(e) {
    if (typeof e === 'object' && e !== null && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  var Node = function(con,path) {
    var self = this
    this.con = con
    this.path = path
    var tail = path.split('/').pop()
    if (tail === path || tail === '')
      tail = '/'
    this.name = tail

    this.data = ko.observable({})
    this.btime = ko.observable(null);
    this.mtime = ko.observable(null);
    this.isModified = ko.computed(function() {
      if (this.btime() === null || this.mtime() === null)
        return false
      if (moment(this.btime()).diff(moment(this.mtime())) < -500)
        return true
      return false
    }, this)
    this.owner = ko.observable('');
    this.acl = new NodeAcl(this.con, this.path)
    this.subscriptions = new NodeSubscriptions(this.con, this.path)

    this.children = new NodeCollection(con, path);

    this.editing = ko.observable(false)
    this.editingContent = ko.observable('')

    // Keeping track of node state
    this.state = ko.observable('unloaded')
    this.isLoaded = ko.computed(function() {
      return this.state() === 'loaded'
    }, this)
    this.isLoading = ko.computed(function() {
      return this.state() === 'loading'
    }, this)

    // No proper way to display it yet
    this.bodyString = ko.computed(function() {
      if (typeof this.data() === 'string')
        return this.data()
      return JSON.stringify(this.data())
    }, this)

    this.newChildContent = ko.observable('')

    // Handle updates
    this.on('updated', function(ntf) {
      self.fromObject(ntf.body)
    })
  }

  Node.prototype = Object.create(EventEmitter.prototype)

  Node.prototype.fromObject = function(object) {
    if (object.data)
      this.data(object.data)
    this.btime(moment(object.btime));
    this.mtime(moment(object.mtime));
    this.owner(object.owner); 
    if (object.acl)
      this.acl.load(object.acl)
    if (object.subscriptions)
      this.subscriptions.load(object.subscriptions)
  }

  Node.prototype.load = function(callback) {
    var self = this
    self.con.sendSelect(self.path).on('succeded', function(resp) {
      self.fromObject(resp.body)
      self.state('loaded')
      self.emit('loaded')
      if (typeof callback === 'function')
        callback()
    }).on('failed', function(resp) {
      self.emit('loading-failed', resp)
      console.log('Loading of node ' + self.path + ' failed: ' + resp.body)
    }).on('timeout', function() {
      self.emit('loading-timeout')
    })
    self.state('loading')
    self.emit('loading')
    return this
  }

  Node.prototype.trash = function(d, e) {
    stop(e)
    this.con.sendDelete(this.path).on('succeded', function() {
      N.add({title: 'Removed', text: 'Successfully removed node', type: 'success', icon: 'minus'})
    }).on('failed', function(resp) {
      L.warn('Delete failed ' + resp.status + ': ' + resp.body)
      N.add({title: 'Remove failed', text: 'Could not remove node: ' + resp.body, type: 'error', icon: 'flash'})
    })
    this.emit('deleted', this)
  }

  Node.prototype.startEdit = function(d, e) {
    stop(e)
    this.editingContent(this.bodyString())
    this.editing(true)
  }
  Node.prototype.commitEdit = function(d, e) {
    stop(e)
    var self = this, content = ''
    try {
      content = JSON.parse(this.editingContent())
    }
    catch (e) {
      content = this.editingContent()
    }
    self.con.sendUpdate(this.path, {}, { data: content }).on('succeded', function() {
      self.cancleEdit()
      self.load()
      N.add({title: 'Edited', type: 'success', text: 'Edit successful', icon: 'pencil'})
    }).on('failed', function(err) {
      L.error('Update failed: ' + err.body)
      N.add({title: 'Failed', type: 'error', text: 'Edit failed: ' + err.body, icon: 'flash'})
    })
  }
  Node.prototype.cancleEdit = function(d, e) {
    stop(e)
    this.editing(false)
  }
  Node.prototype.delegateNotification = function(ntf) {
    if (this.path === ntf.uri.toString())
      this.emit(ntf.event.toLowerCase(), this, ntf)
    if (URI.ancestorOf(this.path, ntf.uri.toString()))
      this.children.delegateNotification(ntf)
  }
  return Node
})
