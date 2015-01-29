jQuery(document).ready(function($) {
  // Configuration page selectors
  this.selectors = {
    save    : 'button#save',
    result  : 'span#save-result',
    close   : 'a#close'
  };

  // Start the configuration page
  this.start = function() {
    var self = this;

    self.options = new ExtensityConfiguration();
    self.restore();

    // Capture events
    $(self.selectors.save).on('click', function(ev) {
      self.save();
    });

    $(self.selectors.close).on('click', function(ev) {
      self.close();
    });
  };

  // Restore configuration from the settings
  this.restore = function() {
    var self = this;
    $(self.options.settings).each(function(i, item) {
      $('input#' + item).attr('checked', Boolean(self.options[item]));
    });

  };

  // Collect configuration options from the UI
  this.collect = function() {
    var self = this;
    $(self.options.settings).each(function(i, item) {
      self.options[item] = Boolean($('input#' + item + ':checked').length>0);
    });
  };

  //Close the configuration window
  this.save = function() {
    var self = this;
    self.collect();
    self.options.save();
    $(self.selectors.result).text('| Saved!').show().delay(1000).fadeOut('slow');
  };

  // Close the configuration window
  this.close = function() {
    window.close();
  };

  this.start();
});
