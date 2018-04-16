({
    init: function(cmp, event, helper) {
        var selectedSalesforceObjectName = cmp.get("v.salesforceObjectName");
        var connectionId = cmp.get("v.connectionId");
        var field = cmp.get("v.field");

        if (field) {
            if (selectedSalesforceObjectName && field.SalesforceFieldName && field.SalesforceFieldType === "picklist") {
                helper.populateAvailableSalesforceFieldValues(cmp, selectedSalesforceObjectName, field.SalesforceFieldName);
            }
    
            if (field.ExternalFieldName && field.ExternalFieldType === "picklist") {
                var externalFieldId = helper.getExternalFieldId(cmp, field.ExternalFieldName);
                helper.populateAvailableExternalFieldValues(cmp, connectionId, externalFieldId);
            }

            helper.handleLookupObjectPopulation(cmp, field);
        }
    },
    changeSelectedFieldDirection: function(cmp, event, helper) {
        var params = event.getParam('arguments');
        var newDirection = params.newDirection;
        var fieldDirection = cmp.find('fieldDirection');
        fieldDirection.changeSelectedDirection(newDirection);
    },
    changeSelectedFieldPrimary: function(cmp, event, helper) {
        var params = event.getParam('arguments');
        var newPrimary = params.newPrimary;
        var fieldPrimary = cmp.find('fieldPrimary');
        fieldPrimary.changeSelectedPrimary(newPrimary);
    },
    handleDeleteField: function(cmp, event, helper) {
        var deletedEvent = cmp.getEvent("fieldDeleted");
        if (deletedEvent) {
            deletedEvent.setParam("value", cmp.get("v.fieldIndex"));
            deletedEvent.fire();
        }
    },
    handleSalesforceFieldChanged: function(cmp, event, helper) {
        var fieldApiName = event.getSource().get("v.value");
        var objectId = cmp.get("v.salesforceObjectName");
        var fieldType = helper.getFieldType(cmp, fieldApiName, "v.availableSalesforceFields");
        cmp.set("v.field.SalesforceFieldType", fieldType);

        if (fieldType === "picklist") {
            helper.populateAvailableSalesforceFieldValues(cmp, objectId, fieldApiName)
                .then(helper.safeCallback(cmp, function () {
                    helper.updateValueMappings(cmp);
                }))
                .catch(function (err) {
                    helper.handleError(err);
                });

        } else {
            cmp.set("v.availableSalesforceFieldValues", []);
            helper.updateValueMappings(cmp);
        }

        var field = cmp.get("v.field");
        helper.handleLookupObjectPopulation(cmp, field);
    },
    handleExternalFieldChanged: function(cmp, event, helper) {
        var fieldApiName = event.getSource().get("v.value");
        var connectionId = cmp.get("v.connectionId");        
        var fieldType = helper.getFieldType(cmp, fieldApiName, "v.availableExternalFields");
        cmp.set("v.field.ExternalFieldType", fieldType);

        var externalFieldId = helper.getExternalFieldId(cmp, fieldApiName);
        cmp.set("v.externalFieldId", externalFieldId);

        if (fieldType === "picklist") {
            helper.populateAvailableExternalFieldValues(cmp, connectionId, externalFieldId)
                .then(helper.safeCallback(cmp, function () {
                    //helper.updateFieldDirection(cmp);
                    helper.updateValueMappings(cmp);
                }))
                .catch(function (err) {
                    helper.handleError(err);
                });
                
        } else {
            cmp.set("v.availableExternalFieldValues", []);
            //helper.updateFieldDirection(cmp);
            helper.updateValueMappings(cmp);
        }

        // if we haven't picked a salesforce field yet, filter it to castable types
        var field = cmp.get("v.field");
        helper.handleLookupObjectPopulation(cmp, field);
    },
    handleFieldValueChanged: function(cmp, event, helper) {
        var changedEvent = cmp.getEvent("fieldValueChanged");
        if (changedEvent) {
            changedEvent.fire();
        }
    },
    handleDirectionChanged: function(cmp, event, helper) {
        var selectedDirection = event.getParam("value");
        helper.updateValueMappings(cmp);
    }
})