({
	init : function(component, event, helper) {
    // Get iconName for recordId from Apex Action
    var recordId = component.get("v.recordId");
    var objectName = component.get("v.sObjectName");
    if (objectName && objectName.length > 0) {
      var action = component.get("c.getIconForObject");
      action.setStorable({
        // Icons dont change often, cache for a long time
        defaultExpiration: 60 * 60, 
      });
      helper.callAction(action, {
        objectName: objectName
      })
      .then(function(iconName) {
        component.set("v.iconName", iconName);
      }).catch(function(err) {
        helper.handleError(err);
      });
    }
    else if (recordId && recordId.length > 0) {
      var action = component.get("c.getIconForId");
      action.setStorable({
        // Icons dont change often, cache for a long time
        defaultExpiration: 60 * 60, 
      });
      helper.callAction(action, {
        recordId: recordId
      })
      .then(function(iconName) {
        component.set("v.iconName", iconName);
      }).catch(function(err) {
        helper.handleError(err);
      });
    }
    else {
      console.log("Unable to acquire icon for null recordId");
    }
	}
})