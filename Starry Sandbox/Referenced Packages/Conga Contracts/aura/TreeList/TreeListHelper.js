({
  searchItems: function(cmp, searchText) {
    // Filter w/ deep copy of original items
    var items = cmp.get("v.unfilteredItems");
    var filtered = JSON.parse(JSON.stringify(items));
    if (!items) {
      items = cmp.get("v.items");
      // Keep a set of unfiltered items for when search is cleared
      cmp.set("v.unfilteredItems", items);
      filtered = JSON.parse(JSON.stringify(items));
    }
    // Only search if more than 2 chars, otherwise display unfiltered
    if (searchText && searchText.length > 2) {
      var testItem = function(item) {
        // Search any string property on node object
        for (var name in item) {
          if (typeof(item[name]) === "string" && item[name].toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
            return true;
          }
        }
        // Search on value propery object too!
        if (item.value && testItem(item.value)) return true;
        return false;
      };
      var searchItem = function(tree){
        if (tree.items && tree.items.length > 0) {
          // Recursively filter subitems
          tree.items = tree.items.filter(searchItem);
          // Show this item if it has subitems
          return tree.items.length > 0;
        }
        // Otherwise node matches based on itself
        if (testItem(tree)) {
          return true;
        }
        return false;
      };
      // Search all items recursively and filter out empty items
      items = filtered.filter(searchItem);
    }
    cmp.set("v.items", items);
  },
  deselectItems: function(cmp) {
    var items = cmp.find("items");
    var helper = this;
    if (items && !items.length) items = [items];
    if (items && items.length > 0) {
      items.forEach(function(item) {
        if (item.isValid()) {
          var selected = item.get("v.selected");
          if (selected) {
            item.set("v.selected", false);
          }
          else {
            // Recursively select subitem
            helper.deselectItems(item);
          }
        }
      });
    }
  },
  selectItem: function(cmp, id) {
    var items = cmp.find("items");
    var helper = this;
    if (items && !items.length) items = [items];
    if (items && items.length > 0) {
      items.forEach(function(item) {
        if (item.isValid()) {
          var i = item.get("v.unique");
          if (i == id) {
            item.select();
            cmp.set("v.selectedItem", item);
          }
          else {
            // Recursively select subitem
            helper.selectItem(item, id);
          }
        }
      });
    }
  }
})