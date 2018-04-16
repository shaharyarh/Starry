({
  init: function(cmp, e, helper) {
    cmp.set("v.state", "queued");
    
    helper.refreshStatus(cmp);
  },
  expand: function(cmp, e, helper) {
    // Toggle expanded state
    var expanded = cmp.get("v.isExpanded");
    cmp.set("v.isExpanded", !expanded);
  }
})