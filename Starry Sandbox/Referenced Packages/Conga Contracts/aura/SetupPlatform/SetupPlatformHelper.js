({
  save: function(cmp) {
    var helper = this;
    return helper.callAction(cmp.get("c.enableFileRepository"),{
        enable: cmp.get("v.isFilesEnabled")
    })
    .then(helper.safeCallback(cmp, function() {
        // Save successful
        cmp.set("v.isDirty", false);
    }))
    .catch(function(err) {
        helper.handleError(err);
    });
  },
  setFilesEnabled: function(cmp, enabled) {
    // Set checkbox checked attribute
    var cb = cmp.find("filesCheckbox");
    if (cb && cb.getElement()) {
      var el = cb.getElement();
      el.checked = enabled;
    }
  },
  getExternalConnections: function(cmp) {
    var helper = this;
    return helper.callAction(cmp.get("c.getExternalConnections"))
    .then(helper.safeCallback(cmp, function(connectionsJson) {
      var connections = JSON.parse(connectionsJson);
      if (connections && connections.length > 0) {
        cmp.set("v.hasConnections", true);
      }
    }))
    .catch(function(err) {
      helper.handleError(err);
    });
  },
  getFilesEnabled: function(cmp) {
    var helper = this;
    return helper.callAction(cmp.get("c.getFileRepositoryEnabled"))
    .then(helper.safeCallback(cmp, function(enabled) {
        // Set Files enabled setting
        helper.setFilesEnabled(cmp, enabled);
        // Set form isn't dirty because just loaded from server
        cmp.set("v.isDirty", false);
    }))
    .catch(function(err) {
        helper.handleError(err);
    });
  }
})