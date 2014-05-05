define(['fosp/logger', 'knockout'], function(logger, ko) {
  var L = logger.forFile('vm/login')

  var Login = function() {
    this.signup = ko.observable(false)

    this.user = ko.observable('');
    this.password = ko.observable('');
    this.passwordConfirmation = ko.observable('')
    this.passwordsDiffer = ko.computed(function() {
      return this.password() !== this.passwordConfirmation();
    }, this)

    this.autoLogin = ko.observable(false);
    this.insecure = ko.observable(false)

    this.authenticated = ko.observable(false);
    this.authenticationFailure = ko.observable('')
    this.registrationFailure = ko.observable('')

    this.loadSettings()
  }

  Login.prototype.saveSettings = function() {
    var store = localStorage
    if (typeof store === 'object') {
      store.setItem('user', this.user())
      store.setItem('password', this.password())
      store.setItem('auto-login', this.autoLogin())
    }
  }

  Login.prototype.loadSettings = function() {
    var store = localStorage
    if (typeof store === 'object') {
      this.user(store.getItem('user'))
      this.password(store.getItem('password'))
      this.autoLogin((store.getItem('auto-login') === 'true'))
    }
  }

  Login.prototype.resetFailures = function() {
    this.authenticationFailure('')
    this.registrationFailure('')
  }
  return Login
})
