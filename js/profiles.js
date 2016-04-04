var ProfilesViewModel = function() {
  var self = this;

  self.profiles = new ProfilesListModel();
  self.extensions = new ExtensionsListModel();
  self.current_profile = self.profiles.items()[0];

  self.checkExtension = function() {

  };

  self.selectProfile = function() {

  }

};

vm = new ProfilesViewModel();

jQuery(document).ready( function($) {

  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  ko.applyBindings(vm, document.getElementById('profiles'));


  // var templates = {
  //   profile: '<li><a href="javascript:void(0);" class="profile" data-name="%s">%s</a></li>',
  //   extension: '<label><input type="checkbox" class="extension" value="%s" /> <img src="%s" width="16px" height="16px" /> %s</label><br />'
  // }

  // // Get the smallest icon URL available for a given extension.
  // var smallestIconUrl = function(icons) {
  //   var smallest = _(icons).chain().pluck('size').min().value();
  //   var icon = _(icons).find({size: smallest});
  //   return (icon && icon.url) || '';
  // };

  // var profiles = JSON.parse(localStorage["profiles"] || "{}");

  // var refresh = function() {
  //   $("#profiles #list #items").empty();
  //   _(profiles).each(function(item, idx) {
  //     $("#profiles #list #items").append(
  //       _(templates.profile).sprintf(idx, idx)
  //     )
  //   });

  //   if(!_(profiles).keys().length) {
  //     // TODO: default new profile
  //   }
  // };

  // var save = function() {
  //   var selected = _($('#profiles input.extension:checked')).pluck('value');
  //   var n = $("#profiles input#name").val();
  //   profiles[n] = selected;
  //   localStorage['profiles'] = JSON.stringify(profiles);
  //   refresh();
  // }

  // var edit = function(name) {
  //   $("#profiles #edit").hide();
  //   $("#profiles #list #items li").removeClass("active");
  //   $("#profiles input#name").val(name);
  //   $("#profiles input.extension").prop("checked", false);
  //   _(profiles[name]).each(function(item) {
  //     $("#profiles input.extension[value='" + item +"'").prop("checked", true);
  //   });
  //   $("#profiles #edit").slideDown('fast');
  // }

  // refresh();


  // // var ProfilesViewModel = function() {

  // // };


  // // (new ProfilesViewModel).init()

  // // Bindings
  // $('#profiles #check-all').on('change', function(ev) {
  //   ev.preventDefault();
  //   $("#profiles input.extension").prop("checked", this.checked);
  // });

  // $('#profiles a.profile').on('click', function(ev) {
  //   ev.preventDefault();
  //   edit($(this).data("name"));
  // })

  // $('#profiles #save').on('click', function(ev) {
  //   ev.preventDefault();
  //   save();
  // });

  // $('.fa-close').on('click', function(ev) {
  //   ev.preventDefault();
  //   $(this).parent('p').slideUp();
  // });

});
