({
  refreshStatus: function(cmp) {
    var helper = this;
    // Display progress status while updating
    return helper.callAction(cmp.get("c.getSyncStatus"), {
      recordId: cmp.get("v.recordId")
    })
    .then(helper.safeCallback(cmp, function(json) {
      var status = JSON.parse(json);
      // Update attributes
      cmp.set("v.state", status.state);
      cmp.set("v.headerText", status.headerText);
      cmp.set("v.detailText", status.detailText);
      cmp.set("v.connections", status.connections);
      
      if ((status.state == "progress") || (status.state == "queued") || (status.state == "inactive") || (status.state == "error")) {
        // Set timer to refresh status until it changes from progress, queued, or inactive
        clearTimeout(helper.refreshTimer);
        helper.refreshTimer = setTimeout(helper.safeCallback(cmp, function() {
          helper.refreshStatus(cmp);
        }), 2000);
      }
    }))
    .catch(function(err) {
      // Display error state with error message as header
      cmp.set("v.state", "error");
      cmp.set("v.headerText", err.message);
    });
  }
})