define(['fosp/client','fosp/logger', 'knockout', 'vm/fosp-object', 'vm/login'], function(Client, logger, ko, FospObject, Login) {
  var L = logger.forFile('vm/fosp-client')

  var FospClient = function() {
    this.client = null;
    this.connected = ko.observable(false);
    this.connectFailed = ko.observable(false);
    this.currentRoot = ko.observable(null);
    this.login = new Login()
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
      self.client.con.sendConnect({}, { version: '0.1' }).on('succeded', function() {
        self.connected(true)
        if (login.signup())
          self.register()
        else
          self.authenticate()
      }).on('failed', function() {
        L.error('Connecting failed')
        self.connectFailed(true)
      })
      self.client.con.on('close', function() {
        L.warn('Connection was closed')
        self.connected(false)
        self.login.authenticated(false)
        self.login.resetFailures()
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
    this.client.con.sendRegister({}, { name: name, password: login.password()}).on('succeded', function() {
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
    this.client.con.sendAuthenticate({}, { name: name, password: login.password()}).on('succeded', function() {
      login.authenticated(true)
      var root = (new FospObject(self.client.con, login.user())).load();
      self.currentRoot(root)
      login.saveSettings()
    }).on('failed', function(err) {
      L.error('Authentication failed: ' + err.body)
      login.authenticationFailure(err.body)
    })
  }

  FospClient.prototype.logout = function() {
    this.client.con.close()
  }
  return FospClient;
})
