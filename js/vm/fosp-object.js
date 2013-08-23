define(['fosp/logger', 'knockout', 'knockout.mapping', 'moment'], function(logger, ko, mapping, moment) {
  var L = logger.forFile('vm/fosp-object')

  var stop = function(e) {
    e.stopPropagation()
    e.preventDefault()
  }

  var FospObject = function(con,path) {
    this.con = con
    this.path = ko.observable(path)
    var tail = path.split('/').pop()
    if (tail === path || tail === '')
      tail = '/'
    this.name = ko.observable(tail)
    this.state = ko.observable('unloaded')
    this.children = ko.observableArray([])
    this.data = ko.observable({})
    this.btime = ko.observable(null);
    this.mtime = ko.observable(null);
    this.owner = ko.observable('');
    this.acl = ko.observable({});
    this.subscriptions = ko.observable({})
    this.selectedNode = ko.observable(null)
    this.editing = ko.observable(false)
    this.editingContent = ko.observable('')
    this.isLoaded = ko.computed(function() {
      return this.state() === 'loaded'
    }, this)
    this.isLoading = ko.computed(function() {
      return this.state() === 'loading'
    }, this)
    this.bodyString = ko.computed(function() {
      return JSON.stringify(this.data())
    }, this)

    this.newChildContent = ko.observable('')
  }
  FospObject.prototype.load = function() {
    var self = this
    self.con.sendSelect(self.path()).on('succeded', function(resp) {
      self.data(resp.body.data)
      self.btime(moment(resp.body.btime));
      self.mtime(moment(resp.body.mtime));
      self.owner(resp.body.owner);
      self.acl(resp.body.acl);
      self.subscriptions(resp.body.subscriptions)
      self.state('loaded')
    })
    self.state('loading')
    return this
  }
  FospObject.prototype.loadChildren = function() {
    var self = this
    self.con.sendList(self.path()).on('succeded', function(resp) {
      self.children.removeAll()
      var children = resp.body
      for (var i=0; i<children.length; i++) {
        var newPath = self.path() + '/' + children[i]
        var newObj = new FospObject(self.con, newPath)
        newObj.load()
        self.children.push(newObj)
      }
    })
    return this
  }

  FospObject.prototype.createChild = function() {
    var name = this.path() + '/' + moment().toISOString(), self = this, content = this.newChildContent()
    self.con.sendCreate(name, {}, { data: content }).on('succeded', function() {
      self.newChildContent('')
      self.loadChildren()
    }).on('failed', function(err) {
      L.error('Creating child failed: ' + err.body)
    })
  }
  FospObject.prototype.deleteChild = function(node, e) {
    var self = this
    stop(e)
    self.con.sendDelete(node.path()).on('succeded', function() {
      if (self.selectedNode() === node)
        self.selectedNode(null)
      self.loadChildren()
    }).on('failed', function(err) {
      L.error('Failed to delete node ' + node.path() + ': ' + err.body)
    })
  }
  FospObject.prototype.select = function(node, e) {
    console.log('Selecting node: ' + node.name() + ' in node ' + this.name())
    this.selectedNode(node)
    node.loadChildren()
    return this
  }
  FospObject.prototype.startEdit = function(d, e) {
    stop(e)
    this.editingContent(JSON.stringify(this.data()))
    this.editing(true)
  }
  FospObject.prototype.commitEdit = function(d, e) {
    stop(e)
    var self = this, content = ''
    try {
      content = JSON.parse(this.editingContent())
    }
    catch (e) {
      content = this.editingContent()
    }
    self.con.sendUpdate(this.path(), {}, { data: content }).on('succeded', function() {
      self.cancleEdit()
      self.load()
    }).on('failed', function(err) {
      L.error('Update failed: ' + err.body)
    })
  }
  FospObject.prototype.cancleEdit = function(d, e) {
    stop(e)
    this.editing(false)
  }
  return FospObject
})
