({
  init: function(cmp, e, helper) {
    // Set has back
    var back = cmp.get("v.back");
    if (back && back.length > 0) {
      cmp.set("v.hasBack", true);
    }
  },
  close : function(cmp, event, helper) {
    helper.close(cmp);
  },
  toggleBack: function(cmp, e, helper) {
    var showBack = cmp.get("v.showBack");
    cmp.set("v.showBack", !showBack);
    setTimeout(helper.safeCallback(cmp, function() {
      helper.position(cmp);
    }));
  },
  reposition: function(cmp, e, helper) {
    setTimeout(helper.safeCallback(cmp, function() {
      helper.position(cmp);
    }));
  }
})