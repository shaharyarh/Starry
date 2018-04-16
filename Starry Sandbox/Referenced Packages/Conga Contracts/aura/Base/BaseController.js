({
  init: function(cmp, e, helper) {
    // Get the UI theme for UI specific functionality
    helper.setUserInfo(cmp)
    .catch(function(err) {
      helper.handleError(err);
    });
  },
  getHelper: function(component, event, helper) {
    return helper;
  }
})