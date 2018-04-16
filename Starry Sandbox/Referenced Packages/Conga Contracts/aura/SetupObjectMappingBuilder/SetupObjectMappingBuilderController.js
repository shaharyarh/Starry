({
    init: function(cmp, event, helper) {
        var objectMapping = cmp.get("v.objectMapping");
        cmp.set("v.selectedGlobalDirection", helper.getGlobalDirectionFromMappings(cmp, objectMapping));
        cmp.set("v.selectedGlobalPrimary", helper.getGlobalPrimaryFromMappings(cmp, objectMapping));

        helper.initObjects(cmp);
    },
    onRender: function(cmp, event, helper) {
        helper.validateForm(cmp);
    },
    handleSalesforceObjectChanged: function(cmp, event, helper) {
        helper.initObjects(cmp);
    },
    handleExternalObjectChanged: function(cmp, event, helper) {
        helper.initObjects(cmp);
    },
    handleDirectionChanged: function(cmp, event, helper) {
        var selectedDirection = event.getParam("value");
        var sourceId = event.getSource().getLocalId();

        if (sourceId === "globalDirection") {
            // just deselecting global control - nothing to do
            if (!selectedDirection)
                return;

            var fieldMappingComponents = cmp.find("fieldMapping");
            if (!fieldMappingComponents)
                return;
            
            // when there's only one found, find() returns the component
            // when there's multiple it returns an array - can't treat a single result like an array.
            if (!fieldMappingComponents.length) {
                fieldMappingComponents.changeSelectedFieldDirection(selectedDirection);
            }
            else {
                for (var i = 0; i < fieldMappingComponents.length; i++) {
                    fieldMappingComponents[i].changeSelectedFieldDirection(selectedDirection);
                }
            }

            cmp.set("v.globalPrimaryDisabled", selectedDirection !== "both");

        } else {
            var objectMapping = cmp.get("v.objectMapping");
            cmp.set("v.selectedGlobalDirection", helper.getGlobalDirectionFromMappings(cmp, objectMapping));
            cmp.set("v.globalPrimaryDisabled", !helper.bidirectionalFieldMappingExists(cmp, objectMapping));
        }
    },
    handlePrimaryChanged: function(cmp, event, helper) {
        var selectedPrimary = event.getParam("value");
        var sourceId = event.getSource().getLocalId();

        if (sourceId === "globalPrimary") {
            // just deselecting global control - nothing to do
            if (!selectedPrimary)
                return;

            var fieldMappingComponents = cmp.find("fieldMapping");
            if (!fieldMappingComponents)
                return;
            
            // when there's only one found, find() returns the component
            // when there's multiple it returns an array - can't treat a single result like an array.
            if (!fieldMappingComponents.length) {
                fieldMappingComponents.changeSelectedFieldPrimary(selectedPrimary);
            }
            else {
                for (var i = 0; i < fieldMappingComponents.length; i++) {
                    fieldMappingComponents[i].changeSelectedFieldPrimary(selectedPrimary);
                }
            }

        } else {
            cmp.find("globalPrimary").changeSelectedPrimary(helper.getGlobalPrimaryFromMappings(cmp));
        }

        helper.validateForm(cmp);
    },
    handleFieldDeleted: function(cmp, event, helper) {
        var fieldIndex = event.getParam("value");
        var objectMapping = cmp.get("v.objectMapping");
        if (!objectMapping || !objectMapping.FieldMappings)
            return;

        objectMapping.FieldMappings.splice(fieldIndex, 1);
        cmp.set("v.objectMapping", objectMapping);

        // refresh global controls
        cmp.set("v.selectedGlobalDirection", helper.getGlobalDirectionFromMappings(cmp, objectMapping));
        cmp.find("globalPrimary").changeSelectedPrimary(helper.getGlobalPrimaryFromMappings(cmp, objectMapping));
    },
    handleFieldValueChanged: function(cmp, event, helper) {
        helper.validateForm(cmp);
    },
    addFieldMapping: function(cmp, event, helper) {
        var objectMapping = cmp.get("v.objectMapping");
        if (!objectMapping)
            return;
        
        if (!objectMapping.FieldMappings) {
            objectMapping.FieldMappings = [];
        }

        var defaultDirection = helper.getDefaultDirection(cmp, objectMapping);
        var fieldMapping = {
            Direction: defaultDirection,
            Primary: helper.getDefaultPrimary(cmp, objectMapping, defaultDirection)
        };

        objectMapping.FieldMappings.push(fieldMapping);
        cmp.set("v.objectMapping", objectMapping);

        // refresh global controls
        cmp.set("v.selectedGlobalDirection", helper.getGlobalDirectionFromMappings(cmp, objectMapping));
        cmp.find("globalPrimary").changeSelectedPrimary(helper.getGlobalPrimaryFromMappings(cmp, objectMapping));
    },
    handleExternalOptoutChanged: function(cmp, event, helper) {
        var enabled = event.getSource().get("v.checked")
        cmp.set("v.objectMapping.ExternalOptoutField", enabled ? "congaPlatformExclude" : undefined);
    }
})