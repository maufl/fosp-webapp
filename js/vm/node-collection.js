define(['require', 'fosp/logger', 'fosp/uri', 'knockout', 'vm/node', 'vm/notifications'], function(require, logger, URI, ko, Node, Notifications) {
  var L = logger.forFile('vm/node-collection')
  var N = Notifications.getDefault()

  var guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  var NodeCollection = function(con, basePath) {
    this.con = con
    this.basePath = basePath
    this.all = ko.observableArray([])
    this.selectedNode = ko.observable(null)

    this.newNodeContent = ko.observable('')
  }

  NodeCollection.prototype.select = function(node) {
    node.children.refresh(function() {
      node.children.loadAllNodes()
    })
    this.selectedNode(node)
  }

  NodeCollection.prototype.load = function(callback) {
    var self = this
    self.con.sendList(self.basePath).on('succeeded', function(resp) {
      self.all.removeAll()
      self.add(resp.body)
      if (typeof callback === 'function')
        callback()
    })
  }

  NodeCollection.prototype.refresh = function(callback) {
    var self = this
    self.con.sendList(self.basePath).on('succeeded', function(resp) {
      var list = resp.body
      var diff = self.diff(list)
      self.remove(diff[0])
      self.add(diff[1])
      if (typeof callback === 'function')
        callback()
    })
  }

  NodeCollection.prototype.remove = function(list) {
    var nodes = this.all()
    for (var i=0; i<nodes.length; i++) {
      var name = nodes[i].name
      var index = list.indexOf(name)
      if (index >= 0) {
        L.debug('Removing child ' + i + ' with name ' + name)
        if (this.all()[i] === this.selectedNode())
          this.selectedNode(null)
        this.all.splice(i,1)
      }
    }
  }

  NodeCollection.prototype.add = function(list) {
    // Ugly!!
    var Node = require('vm/node'), self = this
    for (var i=0; i<list.length; i++) {
      var name = list[i], newNode = new Node(this.con, this.basePath + '/' + name)
      this.all.push(newNode)
      newNode.on('deleted', function(node) {
        self.remove(node.name)
      })
    }
  }

  // Take a list of node names, return an array of arrays
  // First array contains names of nodes in this collection that are not in the list
  // Second array contains names of nodes that are not in this collection but are in the list
  NodeCollection.prototype.diff = function(names) {
    var gone = [], missing = [], nodes = this.all()
    for (var i=0; i<nodes.length; i++) {
      var c_name = nodes[i].name
      var index = names.indexOf(c_name)
      if (index < 0) {
        gone.push(c_name)
        continue
      }
      names.splice(index, 1)
    }
    missing = names
    return [gone,missing]
  }

  NodeCollection.prototype.loadAllNodes = function(force) {
    if (typeof force !== 'boolean')
      force = false
    var nodes = this.all()
    for (var i=0; i<nodes.length; i++) {
      var node = nodes[i]
      if (!node.isLoaded() || force)
        node.load()
    }
  }

  NodeCollection.prototype.addNode = function() {
    var newId = guid(), self = this
    self.con.sendCreate(self.basePath + '/' + newId, {}, {data: self.newNodeContent()}).on('succeeded', function() {
      self.refresh(function() {
        self.loadAllNodes()
      })
      self.newNodeContent('')
      N.add({title: 'Added', text: 'Successfully added new node', type: 'success', icon: 'plus'})
    }).on('failed', function(resp) {
      L.warn('Creating new node failed, reason ' + resp.status + ': ' + resp.body)
      N.add({title: 'Adding failed', text: 'Could not add new node: ' + resp.body, type: 'error', icon: 'flash'})
    })
  }

  NodeCollection.prototype.get = function(name) {
    var nodes = this.all()
    for (var i=0; i<nodes.length; i++) {
      if (nodes[i].name === name)
        return nodes[i]
    }
    return null
  }

  NodeCollection.prototype.delegateNotification = function(ntf) {
    if (URI.parentOf(this.basePath, ntf.uri.toString())) {
      var name = ntf.uri.toString().substring(this.basePath.length + 1)
      /*
      if (ntf.event === 'DELETED') {
        if (this.selectedNode() === this.get(name))
          this.selectedNode(null)
        this.remove([name])
      }
      */
      if (ntf.event === 'CREATED') {
        this.add([name])
        this.get(name).load()
      }
      var node = this.get(name)
      if (node !== null)
        node.delegateNotification(ntf)
      return
    }
    var nodes = this.all()
    for (var i=0; i<nodes.length; i++) {
      nodes[i].delegateNotification(ntf)
    }
  }

  return NodeCollection
})
