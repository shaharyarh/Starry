({
  init: function(cmp, e, helper) {

  },
  remove: function(cmp, e, helper) {
    var e = cmp.getEvent("treeItemRemove");
    var val = cmp.get("v.value");
    e.setParams({
      value: val
    });
    e.fire();
  },
  select: function(cmp, e, helper) {
    var iconName = cmp.get("v.iconName");
    if (iconName != "utility:lock") {
      if (cmp.get("v.hasItems")) {
        var isExpanded = cmp.get("v.alwaysExpanded") ? true : !cmp.get("v.isExpanded");
        cmp.set("v.isExpanded", isExpanded);
        
        var val = cmp.get("v.value");
        if (val) {
          var e = cmp.getEvent("treeItemSelect");

          e.setParams({
            value: val
          });
          e.fire();
        }
      }
      else {
        var val = cmp.get("v.value");
        if (val) {
          var e = cmp.getEvent("treeItemSelect");

          e.setParams({
            value: val
          });
          e.fire();
        }
      }
    }
  }
})