({
    onRender: function(cmp, event, helper) {
        var selectedDirection = cmp.get("v.selectedDirection");
        helper.highlightButtonForSelectedDirection(cmp, selectedDirection);
    },
    handleClick: function(cmp, event, helper) {
        var selectedDirection = event.getSource().get("v.value");        
        cmp.set("v.selectedDirection", selectedDirection);

        helper.highlightButtonForSelectedDirection(cmp, selectedDirection);
            
        var changedEvent = cmp.getEvent("directionChanged");
        if (changedEvent) {
            changedEvent.setParam("value", selectedDirection);
            changedEvent.fire();
        }
    },
    changeSelectedDirection: function(cmp, event, helper) {
        var selectedDirection = event.getParam('arguments').newDirection;
        cmp.set("v.selectedDirection", selectedDirection);

        helper.highlightButtonForSelectedDirection(cmp, selectedDirection);
    },
    setEnabledDirections: function(cmp, event, helper) {
        var enabledDirections = event.getParam('arguments').enabledDirections;
        if (!enabledDirections)
            enabledDirections = [];

        cmp.set("v.leftDisabled", enabledDirections.indexOf("left") === -1);
        cmp.set("v.bothDisabled", enabledDirections.indexOf("both") === -1);
        cmp.set("v.rightDisabled", enabledDirections.indexOf("right") === -1);
    }
})