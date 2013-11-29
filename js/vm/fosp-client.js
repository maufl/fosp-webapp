define(['fosp/client','fosp/logger', 'knockout', 'vm/node', 'vm/login', 'vm/notifications', 'vm/buddy-list'], function(Client, logger, ko, Node, Login, Notifications, BuddyList) {
  var L = logger.forFile('vm/fosp-client')

  var FospClient = function() {
    this.client = null;
    this.connected = ko.observable(false);
    this.connectFailed = ko.observable(false);
    this.currentRoot = ko.observable(null);
    this.login = new Login()
    this.notifications = Notifications.getDefault();
    this.buddyList = new BuddyList()
    if (this.login.autoLogin())
      this.connect()
  }


  FospClient.prototype.connect = function() {
    L.info('Connecting')
    var self = this
    var login = this.login
    var identifier = this.login.user()
    var domain = identifier.substring(identifier.indexOf('@') + 1, identifier.length)
    this.connectFailed(false)
    this.client = new Client({host: domain})
    self.client.on('connect', function() {
      self.client.con.sendConnect({}, { version: '0.1' }).on('succeeded', function() {
        self.connected(true)
        self.notifications.add({title: 'Connected', text: 'Successfully connected to server "' + domain + '".', icon: 'globe'})
        if (login.signup())
          self.register()
        else
          self.authenticate()
      }).on('failed', function() {
        L.error('Connecting failed')
        self.connectFailed(true)
      })
      self.client.con.on('close', function(e) {
        L.warn('Connection was closed')
        console.debug(e)
        self.connected(false)
        self.login.authenticated(false)
        self.login.resetFailures()
      })
      self.client.con.on('error', function(err) {
        L.error('Connection emitted error: ' + err)
      })
      self.client.con.on('notification', function(msg) {
        L.info('Recieved a notification, ' + msg.uri.toString() + ' was ' + msg.event)
      })
    })
  }

  FospClient.prototype.register = function() {
    var self = this
    var login = this.login
    var name = login.user().substring(0, this.login.user().indexOf('@'))
    login.registrationFailure('')
    this.client.con.sendRegister({}, { name: name, password: login.password()}).on('succeeded', function() {
      self.authenticate()
    }).on('failed', function(err) {
      L.error('Registration failed: ' + err.body)
      login.registrationFailure(err.body)
    })
  }

  FospClient.prototype.authenticate = function() {
    var self = this
    var login = this.login
    var name = login.user().substring(0, this.login.user().indexOf('@'))
    login.authenticated(false)
    login.authenticationFailure('')
    this.client.con.sendAuthenticate({}, { name: name, password: login.password()}).on('succeeded', function() {
      login.authenticated(true)
      login.saveSettings()
      self.notifications.add({title: 'Authenticated', text: 'Successfully authenticated as user "' + name + '".', icon: 'user'})
      self.loadHome()
    }).on('failed', function(err) {
      L.error('Authentication failed: ' + err.body)
      login.authenticationFailure(err.body)
    })
  }

  FospClient.prototype.loadHome = function() {
    this.loadBuddy(this.login.user())
  }

  FospClient.prototype.loadBuddy = function(buddy) {
    var self = this
    var root = (new Node(self.client.con, buddy)).load(function() { root.children.load(function(){root.children.loadAllNodes()}) });
    root.on('loaded', function() {
      self.currentRoot(root)
      self.client.con.on('notification', function(ntf) { root.delegateNotification(ntf) })
    })
    root.on('loading-failed', function(resp) {
      self.notifications.add({title: 'Load failed', text: 'Could not switch root to ' + buddy + ' : ' + resp.body, type: 'error', icon: 'flash' })
    })
    root.on('loading-timeout', function(resp) {
      self.notifications.add({title: 'Load timeout', text: 'Could not switch root to ' + buddy + ', timed out', type: 'warn', icon: 'warning-sign', persistent: true })
    })
  }

  FospClient.prototype.logout = function() {
    this.client.con.close()
  }
  return FospClient;
})
