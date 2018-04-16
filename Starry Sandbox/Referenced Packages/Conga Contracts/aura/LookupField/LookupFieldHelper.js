({
  setRecordId: function(component) {
    var recordId = component.get("v.recordId");
    var helper = this;
    var objectName = component.get("v.sObjectName");
    if (recordId || objectName) {
      var infoAction = component.get("c.getLookupInfo");
      infoAction.setStorable(); // Cache for short durations
      helper.callAction(infoAction, {
        apiNameOrId: recordId || objectName
      })
      .then(helper.safeCallback(component, function(lookupInfo) {
        component.set("v.name", lookupInfo.NameValue);
        component.set("v.nameField", lookupInfo.NameField);
        component.set("v.sObjectName", lookupInfo.ObjectName);
        component.set("v.label", lookupInfo.ObjectLabel);
        component.set("v.pluralLabel", lookupInfo.ObjectPluralLabel);
        component.set("v.lookupInfo", lookupInfo);
      }))
      .catch(function(err) {
        helper.handleError(err);
      });
    }
  },
  close: function(cmp) {
    $A.util.removeClass(cmp, "slds-is-open");
  },
  open: function(cmp) {
    var results = cmp.get("v.searchResults");
    var searchText = cmp.get("v.searchText");
    if (results && results.length > 0 || searchText && searchText.length > 0) {
      $A.util.addClass(cmp, "slds-is-open");
    }
  }
})