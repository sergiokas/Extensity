document.addEventListener("DOMContentLoaded", function() {
  var OptionsViewModel = function() {
    var self = this;
    self.options = new OptionsCollection();

    self.save = function() {
      self.options.save(function() {
        fadeOutMessage("save-result");
      });
    };

    self.close = function() { window.close(); }
  };

  vm = new OptionsViewModel();

  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  ko.applyBindings(vm, document.getElementById('options'));
});