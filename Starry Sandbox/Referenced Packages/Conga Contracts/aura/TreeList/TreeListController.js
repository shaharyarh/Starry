({
  remove: function(cmp, e, helper) {
    var items = cmp.get("v.items");
    var clickedItem = e.getSource();
    var id = clickedItem.get("v.unique");
    // Find item with this id and remove it
    var match;
    var emptyHeaders = [];
    items.forEach(function(headerNode) {
      match = headerNode.items.find(function(x) {
        return x.id == id;
      });
      if (match) {
        headerNode.items.splice(headerNode.items.indexOf(match), 1);
        if (headerNode.items.length == 0) {
          emptyHeaders.push(headerNode);
        }
      }
    });
    emptyHeaders.forEach(function(x) {
      // Remove any empty header items
      items.splice(items.indexOf(x), 1);
    });
    if (match) {
      // Item removed redraw items
      cmp.set("v.items", items);
    }
  },
  searchItemsMethod: function(cmp, e, helper) {
    // Search text passed in programatically
    var args = e.getParam("arguments");
    helper.searchItems(cmp, args.searchText);
  },
  searchItems: function(cmp, e, helper) {
    clearInterval(helper.debounceTimer);
    helper.debounceTimer = setTimeout(helper.safeCallback(cmp, function() {
      helper.searchItems(cmp, e.target.value);
    }), 300);
  },
  selectItem: function(cmp, e, helper) {
    var params = e.getParam("arguments");
    var id = params && params.id;
    if (id) {
      helper.selectItem(cmp, id);
    }
  },
  select: function(cmp, e, helper) {
    // child tree item selected, update styling
    var clickedItem = e.getSource();
    var selectedItem = cmp.get("v.selectedItem");
    helper.deselectItems(cmp);
    cmp.set("v.selectedItem", clickedItem);
    clickedItem.set("v.selected", true);
  }
})