({
    onRender: function(cmp, event, helper) {
        
    },
    handleChange: function(cmp, event, helper) {
        var selectedPrimary = event.getSource().get("v.value");
            
        var changedEvent = cmp.getEvent("primaryChanged");
        if (changedEvent) {
            changedEvent.setParam("value", selectedPrimary);
            changedEvent.fire();
        }
    },
    changeSelectedPrimary: function(cmp, event, helper) {
        var params = event.getParam('arguments');
        cmp.set("v.selectedPrimary", params.newPrimary);
    }
})