jQuery(document).ready( function($) {
  // Mix in underscore string exports
  _.mixin(_.string.exports());

  var templates = {
    items: '<label><input type="checkbox" value="%s" /> <img src="%s" width="16px" height="16px" /> %s</label><br />'
  }


  // Get the smallest icon URL available for a given extension.
  var smallestIconUrl = function(icons) {
    var smallest = _(icons).chain().pluck('size').min().value();
    var icon = _(icons).find({size: smallest});
    return (icon && icon.url) || '';
  };


  // Init main extensions list
  chrome.management.getAll(function(results) {
    _(results).each(function(item) {
      console.log(item);
      $("#profiles #edit").append(
        _(templates.items).sprintf(item.id, smallestIconUrl(item.icons), _(item.name).prune(35))
      );
    });
  });

});
