({
  continue : function(cmp, event, helper) {
    var refreshEvent = cmp.getEvent("refreshVersions");
    if (refreshEvent) {
      // Tell parent component to refresh view
      refreshEvent.fire();
    }
    helper.close(cmp);
  },
  cancel: function(cmp, e, helper) {
    helper.close(cmp);
  }
})