document.addEventListener("DOMContentLoaded", function() {

  var BackupViewModel = function() {
    var self = this;

    self.profiles = new ProfileCollectionModel();

    self.backup = function() {
      console.log(self.profiles.backup());
      // console.log(btoa(JSON.stringify(self.profiles.backup())));
    };
  };

  vm = new BackupViewModel();

  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  ko.applyBindings(vm, document.getElementById('backup'));

});