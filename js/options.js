jQuery(document).ready(function($) {

  var OptionsViewModel = function() {
    var self = this;
    self.options = new OptionsCollection();

    self.save = function() {
      self.options.save(function() {
        $('#save-result').text('| Saved!').show().delay(2000).fadeOut('slow');
      });
    };

    self.close = function() { window.close(); }
  };

  vm = new OptionsViewModel();

  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  ko.applyBindings(vm, document.getElementById('options'));

});